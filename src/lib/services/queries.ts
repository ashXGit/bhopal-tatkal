import "server-only";
import { prisma } from "@/lib/db";
import { PUBLIC_ISSUE_INCLUDE, toPublicIssue } from "@/lib/privacy/public-issue";
import { daysUnresolved, explanationRequired, isOverdue } from "@/lib/scoring/accountability";
import { authorityScore } from "@/lib/scoring/authority-score";
import { departmentMedianHours } from "./review";

// Read models for the issue page, the review queue and the dashboard.

export async function getIssueDetail(reference: string) {
  const issue = await prisma.issue.findUnique({
    where: { reference },
    include: {
      ...PUBLIC_ISSUE_INCLUDE,
      ticket: { select: { reference: true, expectedResolution: true, medianHoursAtCreate: true, status: true } },
      updates: { where: { public: true }, orderBy: { createdAt: "asc" } },
      explanations: { orderBy: { createdAt: "desc" } },
      resolution: true,
      messages: { orderBy: { createdAt: "asc" }, select: { id: true, sender: true, body: true, createdAt: true } },
    },
  });
  if (!issue) return null;
  return {
    pub: toPublicIssue({ ...issue, explanations: issue.explanations.slice(0, 1) }),
    id: issue.id,
    departmentId: issue.departmentId,
    ticket: issue.ticket,
    updates: issue.updates,
    explanations: issue.explanations,
    resolution: issue.resolution,
    messages: issue.messages,
  };
}

export async function getReviewQueue(departmentId?: string) {
  return prisma.complaint.findMany({
    where: { status: { in: ["PENDING_REVIEW", "DUPLICATE_REVIEW"] }, ...(departmentId && { aiDepartmentId: departmentId }) },
    orderBy: [{ status: "asc" }, { urgencyScore: "desc" }],
    take: 50,
    select: {
      id: true, reference: true, status: true, text: true, inputMode: true, imageUrl: true, imageCaption: true, createdAt: true,
      language: true, aiDepartmentId: true, categoryId: true, urgency: true, urgencyScore: true, urgencyReasons: true,
      wardId: true, keyTerms: true, aiConfidence: true, aiExplanation: true, aiIsDemo: true,
      category: { select: { name: true } },
      locality: { select: { name: true } },
      duplicates: {
        where: { decision: "PENDING" },
        orderBy: { similarity: "desc" },
        select: {
          similarity: true, textScore: true, locationScore: true, categoryScore: true, timeScore: true,
          issue: { select: { id: true, reference: true, title: true, summary: true, reportCount: true, upvoteCount: true, firstReportedAt: true, locality: { select: { name: true } }, category: { select: { name: true } } } },
        },
      },
    },
  });
}
export type ReviewItem = Awaited<ReturnType<typeof getReviewQueue>>[number];

export async function getDashboard(departmentId?: string) {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const deptFilter = departmentId ? { departmentId } : {};
  const departments = await prisma.department.findMany({ where: departmentId ? { id: departmentId } : { active: true }, orderBy: { name: "asc" } });

  const [issues, weekComplaints, merged] = await Promise.all([
    prisma.issue.findMany({
      where: deptFilter,
      select: { reference: true, title: true, departmentId: true, status: true, firstReportedAt: true, resolvedAt: true, approvedAt: true, wardId: true, locality: { select: { name: true } }, explanations: { select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 } },
    }),
    prisma.complaint.groupBy({ by: ["status"], where: { createdAt: { gte: weekAgo }, ...(departmentId && { aiDepartmentId: departmentId }) }, _count: true }),
    prisma.complaint.groupBy({ by: ["aiDepartmentId"], where: { status: "MERGED_DUPLICATE" }, _count: true }),
  ]);

  const perDept = await Promise.all(
    departments.map(async (d) => {
      const di = issues.filter((i) => i.departmentId === d.id);
      const open = di.filter((i) => !i.resolvedAt);
      const m = {
        received: di.length + (merged.find((x) => x.aiDepartmentId === d.id)?._count ?? 0),
        resolved: di.length - open.length,
        pending: open.length,
        overdue: open.filter((i) => isOverdue(i.approvedAt, d.slaHours)).length,
        over30Days: open.filter((i) => daysUnresolved(i.firstReportedAt) > 30).length,
        repeatComplaints: merged.find((x) => x.aiDepartmentId === d.id)?._count ?? 0,
        medianResolutionHours: await departmentMedianHours(d.id),
        slaHours: d.slaHours,
      };
      return { dept: d, metrics: m, ...authorityScore(m) };
    }),
  );

  const open = issues.filter((i) => !i.resolvedAt);
  const count = (s: string) => weekComplaints.find((w) => w.status === s)?._count ?? 0;
  const localityCounts = new Map<string, number>();
  open.forEach((i) => i.locality && localityCounts.set(i.locality.name, (localityCounts.get(i.locality.name) ?? 0) + 1));

  return {
    pendingReview: await prisma.complaint.count({ where: { status: { in: ["PENDING_REVIEW", "DUPLICATE_REVIEW"] }, ...(departmentId && { aiDepartmentId: departmentId }) } }),
    resolvedThisWeek: issues.filter((i) => i.resolvedAt && i.resolvedAt >= weekAgo).length,
    overdue: perDept.reduce((s, d) => s + d.metrics.overdue, 0),
    over30: open.filter((i) => daysUnresolved(i.firstReportedAt) > 30),
    explanationDue: open.filter((i) => explanationRequired(i, i.explanations[0]?.createdAt)),
    week: {
      received: weekComplaints.reduce((s, w) => s + w._count, 0),
      approved: count("APPROVED"),
      rejected: count("REJECTED"),
      merged: count("MERGED_DUPLICATE"),
      pending: count("PENDING_REVIEW") + count("DUPLICATE_REVIEW"),
    },
    topLocality: [...localityCounts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—",
    perDept: perDept.sort((a, b) => b.score - a.score),
  };
}

export async function getMyComplaints(userId: string) {
  return prisma.complaint.findMany({
    where: { reporterId: userId },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { reference: true, status: true, text: true, createdAt: true, rejectionReason: true, urgency: true, category: { select: { name: true } }, issue: { select: { reference: true, title: true } } },
  });
}
