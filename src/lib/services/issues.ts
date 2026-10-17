import "server-only";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { BUCKET_RANGES, type UnresolvedBucket } from "@/lib/scoring/accountability";
import { PUBLIC_ISSUE_INCLUDE, toPublicIssue } from "@/lib/privacy/public-issue";

// Public read side: only APPROVED issues exist in the Issue table, so nothing unreviewed can leak here.

export const issueQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  ward: z.coerce.number().int().optional(),
  department: z.string().max(50).optional(),
  category: z.string().max(50).optional(),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  status: z.enum(["APPROVED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "OPEN"]).optional(),
  days: z.enum(["<3", "3-7", "7-15", "15-30", "30+"]).optional(),
  sort: z.enum(["priority", "upvotes", "oldest", "urgency", "recent", "updated"]).default("priority"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});
export type IssueQuery = z.infer<typeof issueQuerySchema>;

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000);
}

export async function listPublicIssues(raw: unknown) {
  const q = issueQuerySchema.parse(raw);
  const where: Prisma.IssueWhereInput = {
    ...(q.ward && { wardId: q.ward }),
    ...(q.department && { departmentId: q.department }),
    ...(q.category && { categoryId: q.category }),
    ...(q.urgency && { urgency: q.urgency }),
    ...(q.status === "OPEN" ? { status: { not: "RESOLVED" } } : q.status ? { status: q.status } : {}),
  };
  if (q.days) {
    const [min, max] = BUCKET_RANGES[q.days as UnresolvedBucket];
    where.resolvedAt = null;
    where.firstReportedAt = { lte: daysAgo(min), ...(max != null && { gt: daysAgo(max) }) };
  }
  if (q.q) {
    where.OR = [
      { reference: { contains: q.q, mode: "insensitive" } },
      { title: { contains: q.q, mode: "insensitive" } },
      { summary: { contains: q.q, mode: "insensitive" } },
      { locality: { name: { contains: q.q, mode: "insensitive" } } },
      { category: { name: { contains: q.q, mode: "insensitive" } } },
      { department: { name: { contains: q.q, mode: "insensitive" } } },
    ];
  }

  // "priority" is computed in app code (it blends three signals), so we rank a bounded window.
  const orderBy: Prisma.IssueOrderByWithRelationInput[] = {
    priority: [{ urgencyScore: "desc" as const }],
    upvotes: [{ upvoteCount: "desc" as const }],
    oldest: [{ firstReportedAt: "asc" as const }],
    urgency: [{ urgencyScore: "desc" as const }],
    recent: [{ firstReportedAt: "desc" as const }],
    updated: [{ updatedAt: "desc" as const }],
  }[q.sort];

  if (q.sort === "priority") {
    const rows = await prisma.issue.findMany({ where, include: PUBLIC_ISSUE_INCLUDE, orderBy, take: 500 });
    const ranked = rows.map((r) => toPublicIssue(r)).sort((a, b) => b.priority - a.priority);
    return { items: ranked.slice((q.page - 1) * q.pageSize, q.page * q.pageSize), total: ranked.length, page: q.page, pageSize: q.pageSize };
  }

  const [rows, total] = await Promise.all([
    prisma.issue.findMany({ where, include: PUBLIC_ISSUE_INCLUDE, orderBy, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
    prisma.issue.count({ where }),
  ]);
  return { items: rows.map((r) => toPublicIssue(r)), total, page: q.page, pageSize: q.pageSize };
}

export async function publicStats() {
  const [reported, resolved, pending, attention] = await Promise.all([
    prisma.complaint.count(),
    prisma.issue.count({ where: { status: "RESOLVED" } }),
    prisma.issue.count({ where: { status: { not: "RESOLVED" } } }),
    prisma.issue.count({ where: { status: "IN_PROGRESS" } }),
  ]);
  return { reported, resolved, pending, attention };
}
