import type { Prisma } from "@prisma/client";
import { daysUnresolved, explanationRequired } from "@/lib/scoring/accountability";
import { priorityScore } from "@/lib/scoring/ranking";

// The ONLY shape that public pages / public APIs may return for an issue.
// It is built field-by-field (allow-list), so reporter identity can never leak by accident.

export const PUBLIC_ISSUE_INCLUDE = {
  department: { select: { id: true, name: true, icon: true } },
  category: { select: { id: true, name: true } },
  locality: { select: { name: true } },
  explanations: { select: { createdAt: true }, orderBy: { createdAt: "desc" as const }, take: 1 },
} satisfies Prisma.IssueInclude;

type IssueWithPublicRelations = Prisma.IssueGetPayload<{ include: typeof PUBLIC_ISSUE_INCLUDE }>;

export type PublicIssue = {
  reference: string;
  title: string;
  summary: string;
  department: { id: string; name: string; icon: string };
  category: { id: string; name: string };
  locality: string | null;
  ward: number | null;
  urgency: IssueWithPublicRelations["urgency"];
  urgencyScore: number;
  status: IssueWithPublicRelations["status"];
  upvotes: number;
  reports: number;
  daysUnresolved: number;
  explanationRequired: boolean;
  priority: number;
  reportedBy: "Anonymous Citizen";
  firstReportedAt: string;
  updatedAt: string;
};

export function toPublicIssue(i: IssueWithPublicRelations, now = new Date()): PublicIssue {
  const days = daysUnresolved(i.firstReportedAt, i.resolvedAt, now);
  return {
    reference: i.reference,
    title: i.title,
    summary: i.summary,
    department: i.department,
    category: i.category,
    locality: i.locality?.name ?? null,
    ward: i.wardId,
    urgency: i.urgency,
    urgencyScore: i.urgencyScore,
    status: i.status,
    upvotes: i.upvoteCount,
    reports: i.reportCount,
    daysUnresolved: days,
    explanationRequired: explanationRequired(i, i.explanations[0]?.createdAt, now),
    priority: priorityScore({ upvotes: i.upvoteCount, daysUnresolved: days, urgency: i.urgency, reportCount: i.reportCount }).score,
    reportedBy: "Anonymous Citizen",
    firstReportedAt: i.firstReportedAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  };
}
