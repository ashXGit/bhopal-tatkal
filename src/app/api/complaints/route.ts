import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { getSession } from "@/lib/auth/current-user";
import { submitComplaint } from "@/lib/services/complaints";
import { rateLimit } from "@/lib/rate-limit";

// Citizen submits a complaint. Returns the AI triage so the citizen sees what AI understood.
export const POST = handle(async (req: Request) => {
  const session = await getSession();
  const key = session?.userId ?? req.headers.get("x-forwarded-for") ?? "anon";
  if (!rateLimit(`complaint:${key}`, 10, 60 * 60_000)) {
    return NextResponse.json({ error: "Too many complaints in a short time. Please try again later." }, { status: 429 });
  }
  const { complaint, triage, matches } = await submitComplaint(await req.json(), session?.userId ?? null);
  return NextResponse.json(
    {
      reference: complaint.reference,
      status: complaint.status,
      ai: {
        demo: triage.isDemo,
        language: triage.language,
        departmentId: triage.classification.departmentId,
        categoryId: triage.classification.categoryId,
        confidence: triage.classification.confidence,
        keyTerms: triage.classification.keyTerms,
        reason: triage.classification.reason,
        urgency: { level: triage.urgency.level, score: triage.urgency.score, reasons: triage.urgency.reasons },
        locality: triage.locality && { name: triage.locality.localityName, ward: triage.locality.wardId },
      },
      possibleDuplicate: matches.length > 0,
    },
    { status: 201 },
  );
});
