import "server-only";
import { z } from "zod";
import type { Urgency } from "@prisma/client";
import { prisma } from "@/lib/db";
import { median, resolutionHours } from "@/lib/scoring/stats";
import { nextIssueReference, ticketReference } from "@/lib/references";
import { audit, notify } from "./events";

// Step 2 of the workflow: AUTHORITY REVIEW → PUBLISH → CREATE TICKET.
// Every complaint must pass through one of these functions before anything becomes public.

export const approveSchema = z.object({
  title: z.string().trim().min(3).max(120),
  // optional overrides ("Correct & Approve")
  departmentId: z.string().optional(),
  categoryId: z.string().optional(),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  localityId: z.string().optional().nullable(),
  wardId: z.number().int().optional().nullable(),
});

export const rejectSchema = z.object({
  reason: z.string().trim().min(10, "Please explain why this complaint is rejected (at least 10 characters)."),
});

class ReviewError extends Error {}

async function loadReviewable(complaintId: string) {
  const c = await prisma.complaint.findUnique({ where: { id: complaintId }, include: { category: true } });
  if (!c) throw new ReviewError("Complaint not found");
  if (c.status !== "PENDING_REVIEW" && c.status !== "DUPLICATE_REVIEW") throw new ReviewError("Complaint has already been reviewed");
  return c;
}

export async function departmentMedianHours(departmentId: string): Promise<number | null> {
  const [historical, resolved] = await Promise.all([
    prisma.historicalRecord.findMany({ where: { departmentId, resolvedAt: { not: null } }, select: { reportedAt: true, resolvedAt: true }, take: 5000 }),
    prisma.issue.findMany({ where: { departmentId, resolvedAt: { not: null } }, select: { firstReportedAt: true, resolvedAt: true }, take: 5000 }),
  ]);
  const hours = [
    ...historical.map((r) => resolutionHours(r.reportedAt, r.resolvedAt!)),
    ...resolved.map((r) => resolutionHours(r.firstReportedAt, r.resolvedAt!)),
  ];
  const m = median(hours);
  return m == null ? null : Math.round(m * 10) / 10;
}

/** Approve (optionally with corrections) → creates the public Issue + internal Ticket. */
export async function approveComplaint(complaintId: string, raw: unknown, reviewerId: string) {
  const input = approveSchema.parse(raw);
  const c = await loadReviewable(complaintId);

  const categoryId = input.categoryId ?? c.categoryId ?? "other";
  const category = await prisma.category.findUniqueOrThrow({ where: { id: categoryId }, include: { department: true } });
  const departmentId = input.departmentId ?? category.departmentId;
  const department = departmentId === category.departmentId ? category.department : await prisma.department.findUniqueOrThrow({ where: { id: departmentId } });
  const urgency: Urgency = input.urgency ?? c.urgency ?? "MEDIUM";
  const medianHours = await departmentMedianHours(departmentId);

  const result = await prisma.$transaction(async (tx) => {
    const reference = await nextIssueReference(tx);
    const issue = await tx.issue.create({
      data: {
        reference,
        title: input.title,
        summary: c.text.slice(0, 280),
        departmentId,
        categoryId,
        localityId: input.localityId === undefined ? c.localityId : input.localityId,
        wardId: input.wardId === undefined ? c.wardId : input.wardId,
        urgency,
        urgencyScore: c.urgencyScore ?? 50,
        firstReportedAt: c.createdAt,
        updates: { create: [{ status: "APPROVED", note: "Verified by authority and published." }] },
      },
    });
    const ticket = await tx.ticket.create({
      data: {
        reference: ticketReference(reference),
        issueId: issue.id,
        departmentId,
        expectedResolution: new Date(Date.now() + department.slaHours * 3_600_000),
        medianHoursAtCreate: medianHours,
      },
    });
    await tx.issue.update({ where: { id: issue.id }, data: { status: "ASSIGNED", updates: { create: { status: "ASSIGNED", note: `Ticket ${ticket.reference} created and assigned to ${department.name}.` } } } });
    await tx.complaint.update({ where: { id: c.id }, data: { status: "APPROVED", issueId: issue.id, reviewedAt: new Date(), reviewedById: reviewerId } });
    await tx.duplicateMatch.updateMany({ where: { complaintId: c.id, decision: "PENDING" }, data: { decision: "DIFFERENT_ISSUE", decidedAt: new Date() } });
    return { issue, ticket };
  });

  const corrected = input.categoryId !== undefined || input.departmentId !== undefined || input.urgency !== undefined;
  if (c.reporterId) await notify(c.reporterId, "ISSUE_APPROVED", "Your complaint is now live", `Published as ${result.issue.reference} and assigned to ${department.name}.`, `/issues/${result.issue.reference}`);
  await audit(reviewerId, corrected ? "complaint.correct_approve" : "complaint.approve", "Complaint", c.id, { issue: result.issue.reference, ticket: result.ticket.reference, departmentId, categoryId, urgency });
  return result;
}

/** Reject with a mandatory, citizen-visible reason. */
export async function rejectComplaint(complaintId: string, raw: unknown, reviewerId: string) {
  const { reason } = rejectSchema.parse(raw);
  const c = await loadReviewable(complaintId);
  await prisma.complaint.update({ where: { id: c.id }, data: { status: "REJECTED", rejectionReason: reason, reviewedAt: new Date(), reviewedById: reviewerId } });
  if (c.reporterId) await notify(c.reporterId, "ISSUE_REJECTED", "Complaint not accepted", reason, `/my-issues/${c.reference}`);
  await audit(reviewerId, "complaint.reject", "Complaint", c.id, { reason });
}

/** Duplicate review: "Same Issue" merges the complaint into the existing live issue. */
export async function markSameIssue(complaintId: string, issueId: string, reviewerId: string) {
  const c = await loadReviewable(complaintId);
  const issue = await prisma.issue.findUniqueOrThrow({ where: { id: issueId } });
  const reason = `This problem is already registered under Issue #${issue.reference}.`;

  await prisma.$transaction([
    prisma.complaint.update({ where: { id: c.id }, data: { status: "MERGED_DUPLICATE", issueId, rejectionReason: reason, reviewedAt: new Date(), reviewedById: reviewerId } }),
    prisma.issue.update({ where: { id: issueId }, data: { reportCount: { increment: 1 } } }),
    prisma.duplicateMatch.updateMany({ where: { complaintId: c.id, issueId }, data: { decision: "SAME_ISSUE", decidedAt: new Date() } }),
    prisma.duplicateMatch.updateMany({ where: { complaintId: c.id, issueId: { not: issueId } }, data: { decision: "DIFFERENT_ISSUE", decidedAt: new Date() } }),
  ]);
  if (c.reporterId) await notify(c.reporterId, "DUPLICATE_DETECTED", "Already reported", `${reason} Your report has been added to it.`, `/issues/${issue.reference}`);
  await audit(reviewerId, "duplicate.same_issue", "Complaint", c.id, { issue: issue.reference });
}

/** Duplicate review: "Different Issue" sends the complaint back to normal review. */
export async function markDifferentIssue(complaintId: string, reviewerId: string) {
  const c = await loadReviewable(complaintId);
  await prisma.$transaction([
    prisma.duplicateMatch.updateMany({ where: { complaintId: c.id }, data: { decision: "DIFFERENT_ISSUE", decidedAt: new Date() } }),
    prisma.complaint.update({ where: { id: c.id }, data: { status: "PENDING_REVIEW" } }),
  ]);
  await audit(reviewerId, "duplicate.different_issue", "Complaint", c.id);
}

export { ReviewError };
