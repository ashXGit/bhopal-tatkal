import "server-only";
import { z } from "zod";
import { prisma } from "@/lib/db";
import type { Session } from "@/lib/auth/session";
import { audit, notify } from "./events";

// Post-publication actions: upvote, status updates, 30-day explanations, messages.

async function issueByRef(reference: string) {
  return prisma.issue.findUniqueOrThrow({ where: { reference }, include: { complaints: { select: { reporterId: true } } } });
}

async function notifyReporters(issue: Awaited<ReturnType<typeof issueByRef>>, type: Parameters<typeof notify>[1], title: string, body: string) {
  const ids = [...new Set(issue.complaints.map((c) => c.reporterId).filter((x): x is string => !!x))];
  await Promise.all(ids.map((id) => notify(id, type, title, body, `/issues/${issue.reference}`)));
}

export async function toggleUpvote(reference: string, userId: string) {
  const issue = await prisma.issue.findUniqueOrThrow({ where: { reference }, select: { id: true } });
  const key = { issueId_userId: { issueId: issue.id, userId } };
  const existing = await prisma.upvote.findUnique({ where: key });
  const [, updated] = await prisma.$transaction([
    existing ? prisma.upvote.delete({ where: key }) : prisma.upvote.create({ data: { issueId: issue.id, userId } }),
    prisma.issue.update({ where: { id: issue.id }, data: { upvoteCount: { increment: existing ? -1 : 1 } }, select: { upvoteCount: true } }),
  ]);
  return { upvoted: !existing, upvotes: updated.upvoteCount };
}

export const statusSchema = z
  .object({ status: z.enum(["ASSIGNED", "IN_PROGRESS", "RESOLVED"]), note: z.string().trim().max(1000).default("") })
  .refine((v) => v.status !== "RESOLVED" || v.note.length >= 10, { message: "A resolution note (at least 10 characters) is required.", path: ["note"] });

export async function updateStatus(reference: string, raw: unknown, s: Session) {
  const { status, note } = statusSchema.parse(raw);
  const issue = await issueByRef(reference);
  const now = new Date();
  await prisma.$transaction([
    prisma.issue.update({ where: { id: issue.id }, data: { status, resolvedAt: status === "RESOLVED" ? now : null } }),
    prisma.issueUpdate.create({ data: { issueId: issue.id, status, note: note || `Status changed to ${status.replace("_", " ").toLowerCase()}.` } }),
    prisma.ticket.updateMany({ where: { issueId: issue.id }, data: { status } }),
    ...(status === "RESOLVED" ? [prisma.resolutionRecord.upsert({ where: { issueId: issue.id }, create: { issueId: issue.id, note, resolvedAt: now }, update: { note, resolvedAt: now } })] : []),
  ]);
  await notifyReporters(issue, status === "RESOLVED" ? "ISSUE_RESOLVED" : "STATUS_CHANGED", status === "RESOLVED" ? "Issue Resolved" : "Status updated", note || status);
  await audit(s.userId, "issue.status", "Issue", issue.id, { status, note });
}

export const explanationSchema = z.object({
  explanation: z.string().trim().min(20, "Please write a clear explanation (at least 20 characters)."),
  expectedResolution: z.coerce.date().refine((d) => d.getTime() > Date.now() - 86_400_000, "Expected date must be today or later."),
  actionNote: z.string().trim().max(500).optional(),
});

export async function submitExplanation(reference: string, raw: unknown, s: Session) {
  const input = explanationSchema.parse(raw);
  const issue = await issueByRef(reference);
  await prisma.authorityExplanation.create({ data: { issueId: issue.id, ...input } });
  await prisma.issueUpdate.create({ data: { issueId: issue.id, note: `Formal explanation published. Expected resolution: ${input.expectedResolution.toDateString()}.` } });
  await notifyReporters(issue, "THIRTY_DAY_UPDATE", "Authority explanation published", input.explanation.slice(0, 140));
  await audit(s.userId, "issue.explanation", "Issue", issue.id);
}

export const messageSchema = z.object({ body: z.string().trim().min(1).max(1000) });

export async function postMessage(reference: string, raw: unknown, s: Session) {
  const { body } = messageSchema.parse(raw);
  const issue = await issueByRef(reference);
  const sender = s.role === "CITIZEN" ? "CITIZEN" : "AUTHORITY";
  const msg = await prisma.message.create({ data: { issueId: issue.id, sender, body }, select: { id: true, sender: true, body: true, createdAt: true } });
  if (sender === "AUTHORITY") await notifyReporters(issue, "NEW_MESSAGE", "New message from authority", body.slice(0, 140));
  return msg;
}
