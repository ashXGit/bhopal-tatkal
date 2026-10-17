import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { triageComplaint } from "@/lib/ai/pipeline";
import { getAIProvider } from "@/lib/ai/provider";
import { urgencyExplanation } from "@/lib/scoring/urgency";
import { findDuplicates } from "@/lib/duplicates/similarity";
import { DEPARTMENTS } from "@/lib/reference/departments";
import { audit, notify, notifyDepartment } from "./events";

// Step 1 of the workflow: REPORT → UNDERSTAND → CLASSIFY → CHECK DUPLICATE → NORMALISE LOCATION.
// The result is always a private Complaint waiting for authority review — never a public issue.

export const complaintSchema = z.object({
  text: z.string().trim().min(5, "Please describe the problem in a few words.").max(2000),
  inputMode: z.enum(["TEXT", "VOICE", "IMAGE"]).default("TEXT"),
  imageUrl: z.string().max(500).optional().nullable(),
  imageCaption: z.string().trim().max(500).optional().nullable(),
  locationText: z.string().trim().max(200).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  categoryHint: z.string().max(50).optional().nullable(), // big-icon choice from step 1 of the report flow
});
export type ComplaintFormInput = z.infer<typeof complaintSchema>;

const DUPLICATE_CANDIDATE_WINDOW_DAYS = 90;

function newReference(prefix: string) {
  return `${prefix}-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

async function loadGazetteer() {
  const rows = await prisma.locality.findMany({ include: { aliases: true } });
  return rows.map((l) => ({
    id: l.id,
    name: l.name,
    ward: l.wardId,
    lat: l.latitude ?? 0,
    lng: l.longitude ?? 0,
    aliases: l.aliases.filter((a) => !a.isLandmark).map((a) => a.alias),
    landmarks: l.aliases.filter((a) => a.isLandmark).map((a) => a.alias),
  }));
}

export async function submitComplaint(raw: unknown, reporterId: string | null) {
  const input = complaintSchema.parse(raw);
  const triage = await triageComplaint(input, { provider: getAIProvider(), gazetteer: await loadGazetteer() });
  // If AI found no category, trust the big-icon choice the citizen made.
  const hinted = input.categoryHint && triage.classification.departmentId === "other" ? DEPARTMENTS.find((d) => d.id === input.categoryHint) : undefined;
  if (hinted) triage.classification = { ...triage.classification, departmentId: hinted.id, categoryId: hinted.categories[0].id, reason: `You selected ${hinted.name}.` };
  const { classification: cls, urgency, locality } = triage;

  // Candidate live issues: same department or same ward, still open or recently resolved.
  const since = new Date(Date.now() - DUPLICATE_CANDIDATE_WINDOW_DAYS * 86_400_000);
  const candidates = await prisma.issue.findMany({
    where: {
      OR: [{ departmentId: cls.departmentId }, ...(locality ? [{ wardId: locality.wardId }] : [])],
      AND: [{ OR: [{ resolvedAt: null }, { resolvedAt: { gte: since } }] }],
    },
    select: {
      id: true, reference: true, categoryId: true, departmentId: true, localityId: true, wardId: true, resolvedAt: true,
      locality: { select: { latitude: true, longitude: true } },
      complaints: { where: { status: "APPROVED" }, select: { embedding: true }, take: 1, orderBy: { createdAt: "asc" } },
    },
    take: 200,
  });

  const matches = findDuplicates(
    { embedding: triage.embedding, categoryId: cls.categoryId, departmentId: cls.departmentId, localityId: locality?.localityId, wardId: locality?.wardId, lat: input.latitude, lng: input.longitude },
    candidates
      .filter((c) => c.complaints[0]?.embedding.length)
      .map((c) => ({
        issueId: c.id, reference: c.reference, embedding: c.complaints[0].embedding, categoryId: c.categoryId, departmentId: c.departmentId,
        localityId: c.localityId, wardId: c.wardId, lat: c.locality?.latitude, lng: c.locality?.longitude, resolvedAt: c.resolvedAt,
      })),
  ).slice(0, 3);

  const complaint = await prisma.complaint.create({
    data: {
      reference: newReference("C"),
      reporterId,
      status: matches.length ? "DUPLICATE_REVIEW" : "PENDING_REVIEW",
      text: input.text,
      inputMode: input.inputMode,
      imageUrl: input.imageUrl,
      imageCaption: input.imageCaption,
      locationText: input.locationText,
      latitude: input.latitude,
      longitude: input.longitude,
      language: triage.language,
      aiDepartmentId: cls.departmentId,
      categoryId: cls.categoryId,
      urgency: urgency.level,
      urgencyScore: urgency.score,
      urgencyReasons: urgency.reasons,
      localityId: locality?.localityId,
      wardId: locality?.wardId,
      keyTerms: cls.keyTerms,
      aiConfidence: cls.confidence,
      aiExplanation: { department: cls.reason, urgency: urgencyExplanation(urgency), location: locality ? `Matched "${locality.matchedOn}"` : null },
      aiIsDemo: triage.isDemo,
      embedding: triage.embedding,
      duplicates: {
        create: matches.map((m) => ({
          issueId: m.issueId, similarity: m.similarity, textScore: m.textScore, locationScore: m.locationScore, categoryScore: m.categoryScore, timeScore: m.timeScore,
        })),
      },
    },
  });

  if (reporterId) {
    await notify(reporterId, "ISSUE_SUBMITTED", "Complaint received", matches.length
      ? "This looks similar to an existing issue. An authority will review it before it is published."
      : `AI checked your complaint and suggested ${cls.departmentId} → ${cls.categoryId}. An authority will review it.`, `/my-issues/${complaint.reference}`);
  }
  await notifyDepartment(cls.departmentId, matches.length ? "POSSIBLE_DUPLICATE" : "NEW_REVIEW", "New complaint to review", complaint.reference);
  if (urgency.level === "HIGH" || urgency.level === "CRITICAL") {
    await notifyDepartment(cls.departmentId, "HIGH_URGENCY", `${urgency.level} urgency complaint`, complaint.reference);
  }
  await audit(reporterId, "complaint.submit", "Complaint", complaint.id, { status: complaint.status, matches: matches.map((m) => m.reference) });

  return { complaint, triage, matches };
}
