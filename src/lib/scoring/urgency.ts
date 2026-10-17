import { CATEGORY_INDEX } from "@/lib/reference/departments";
import { canonicalTokens, normaliseText } from "@/lib/text/normalize";
import type { UrgencyLevel, UrgencyResult } from "@/lib/ai/types";

// Urgency = Public Safety (0-40) + Service Outage (0-30) + Duration (0-20) + Sensitive location (0-15), capped at 100.
// All weights live here so the scoring is configurable and never arbitrary.

export const URGENCY_CONFIG = {
  sensitivePlaces: ["school", "hospital", "college", "temple", "mandir", "masjid", "bus stop", "chauraha", "market", "anganwadi"],
  sensitiveBonus: 15,
  safetyWords: ["khatra", "danger", "dangerous", "accident", "ghayal", "injured", "spark", "current", "bacche", "bachche", "children", "khatarnak", "girne", "खतरा", "बच्चों", "बच्चे", "दुर्घटना"],
  safetyWordBonus: 10,
  durationPerDay: 3, // points per reported day, capped
  durationMax: 20,
  thresholds: { CRITICAL: 70, HIGH: 45, MEDIUM: 25 } as Record<Exclude<UrgencyLevel, "LOW">, number>,
};

/** Extracts a reported duration such as "3 din se", "5 days", "2 hafte" → days. */
export function extractDurationDays(text: string): number | null {
  const t = normaliseText(text);
  const m = t.match(/(\d+)\s*(din|dino|day|days|दिन|hafte|hafta|week|weeks|हफ्ते|mahine|month|months)/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const unit = m[2];
  if (/hafte|hafta|week|हफ्ते/.test(unit)) return n * 7;
  if (/mahine|month/.test(unit)) return n * 30;
  return n;
}

export function scoreUrgency(text: string, categoryId: string, reportedDaysAgo = 0): UrgencyResult {
  const cat = CATEGORY_INDEX.get(categoryId);
  const norm = ` ${normaliseText(text)} `;
  const tokens = new Set(canonicalTokens(text));
  const reasons: string[] = [];

  let safety = cat?.safetyRisk ?? 0;
  if (URGENCY_CONFIG.safetyWords.some((w) => norm.includes(` ${w} `))) {
    safety = Math.min(40, safety + URGENCY_CONFIG.safetyWordBonus);
  }
  if (safety >= 20) reasons.push("Public safety concern");

  const service = cat?.serviceRisk ?? 0;
  if (service >= 20) reasons.push("Essential service unavailable");

  const statedDays = extractDurationDays(text) ?? 0;
  const days = Math.max(statedDays, reportedDaysAgo);
  const duration = Math.min(URGENCY_CONFIG.durationMax, days * URGENCY_CONFIG.durationPerDay);
  if (days > 0) reasons.push(`Reported for ${days} day${days === 1 ? "" : "s"}`);

  const place = URGENCY_CONFIG.sensitivePlaces.find((p) => norm.includes(` ${p} `) || tokens.has(p));
  const sensitiveLocation = place ? URGENCY_CONFIG.sensitiveBonus : 0;
  if (place) reasons.push(`Near a ${place}`);

  const score = Math.min(100, safety + service + duration + sensitiveLocation);
  const { CRITICAL, HIGH, MEDIUM } = URGENCY_CONFIG.thresholds;
  const level: UrgencyLevel = score >= CRITICAL ? "CRITICAL" : score >= HIGH ? "HIGH" : score >= MEDIUM ? "MEDIUM" : "LOW";

  return { level, score, reasons, factors: { safety, service, duration, sensitiveLocation } };
}

export function urgencyExplanation(u: UrgencyResult): string {
  if (u.reasons.length === 0) return `Urgency is ${u.level.toLowerCase()} — no safety risk or service outage was mentioned.`;
  return `Urgency is ${u.level.toLowerCase()} because: ${u.reasons.join(", ").toLowerCase()}.`;
}
