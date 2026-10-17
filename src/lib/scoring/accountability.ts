// Days-unresolved, overdue and the 30-day accountability rule.

export const EXPLANATION_REQUIRED_AFTER_DAYS = 30;
export const APPROACHING_WARNING_DAYS = 25;

export type UnresolvedBucket = "<3" | "3-7" | "7-15" | "15-30" | "30+";

const DAY_MS = 86_400_000;

export function daysUnresolved(firstReportedAt: Date, resolvedAt?: Date | null, now = new Date()): number {
  const end = resolvedAt ?? now;
  return Math.max(0, Math.floor((end.getTime() - firstReportedAt.getTime()) / DAY_MS));
}

export function unresolvedBucket(days: number): UnresolvedBucket {
  if (days < 3) return "<3";
  if (days < 7) return "3-7";
  if (days < 15) return "7-15";
  if (days <= 30) return "15-30";
  return "30+";
}

/** Bucket → [minDays, maxDays) for DB date-range filters. */
export const BUCKET_RANGES: Record<UnresolvedBucket, [number, number | null]> = {
  "<3": [0, 3],
  "3-7": [3, 7],
  "7-15": [7, 15],
  "15-30": [15, 31],
  "30+": [31, null],
};

/**
 * "Explanation Required" is derived, not stored: an open issue unresolved > 30 days
 * that has no explanation submitted since it crossed the 30-day mark.
 */
export function explanationRequired(
  issue: { firstReportedAt: Date; resolvedAt?: Date | null; status: string },
  latestExplanationAt?: Date | null,
  now = new Date(),
): boolean {
  if (issue.status === "RESOLVED" || issue.resolvedAt) return false;
  const days = daysUnresolved(issue.firstReportedAt, null, now);
  if (days <= EXPLANATION_REQUIRED_AFTER_DAYS) return false;
  const crossedAt = new Date(issue.firstReportedAt.getTime() + EXPLANATION_REQUIRED_AFTER_DAYS * DAY_MS);
  return !latestExplanationAt || latestExplanationAt < crossedAt;
}

export function isOverdue(createdAt: Date, slaHours: number, resolvedAt?: Date | null, now = new Date()): boolean {
  if (resolvedAt) return false;
  return now.getTime() - createdAt.getTime() > slaHours * 3_600_000;
}
