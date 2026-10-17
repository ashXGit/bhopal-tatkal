import type { UrgencyLevel } from "@/lib/ai/types";

// Issue Priority = upvote impact + unresolved-duration impact + urgency impact (0..100).
// Upvotes use a log curve so a viral issue can't completely dominate; duration saturates at 60 days.

export const RANKING_WEIGHTS = { upvotes: 35, duration: 35, urgency: 30 };
const UPVOTE_SATURATION = 500;
const DURATION_SATURATION_DAYS = 60;
const URGENCY_VALUE: Record<UrgencyLevel, number> = { LOW: 0.15, MEDIUM: 0.45, HIGH: 0.75, CRITICAL: 1 };

export type RankingInput = { upvotes: number; daysUnresolved: number; urgency: UrgencyLevel; reportCount?: number };

export function priorityScore(i: RankingInput) {
  const upvoteImpact = Math.min(1, Math.log1p(i.upvotes + (i.reportCount ?? 1) - 1) / Math.log1p(UPVOTE_SATURATION));
  const durationImpact = Math.min(1, i.daysUnresolved / DURATION_SATURATION_DAYS);
  const urgencyImpact = URGENCY_VALUE[i.urgency];
  const parts = {
    upvotes: Math.round(upvoteImpact * RANKING_WEIGHTS.upvotes),
    duration: Math.round(durationImpact * RANKING_WEIGHTS.duration),
    urgency: Math.round(urgencyImpact * RANKING_WEIGHTS.urgency),
  };
  return { score: parts.upvotes + parts.duration + parts.urgency, parts };
}
