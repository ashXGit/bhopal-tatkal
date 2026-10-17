import { cosineSimilarity } from "@/lib/ai/embedding";
import { distanceMetres } from "@/lib/locality/resolve";

// Duplicate score = weighted blend of semantic, location, category and time-window similarity.
// >= DUPLICATE_THRESHOLD routes the new complaint to the Duplicate Review queue (human decides).

export const DUPLICATE_THRESHOLD = 0.8;

export const DUPLICATE_WEIGHTS = { text: 0.5, location: 0.25, category: 0.15, time: 0.1 };

export type DuplicateSubject = {
  embedding: number[];
  categoryId: string;
  departmentId: string;
  localityId?: string | null;
  wardId?: number | null;
  lat?: number | null;
  lng?: number | null;
};

export type DuplicateCandidate = DuplicateSubject & {
  issueId: string;
  reference: string;
  resolvedAt?: Date | null;
};

export type DuplicateScore = {
  issueId: string;
  reference: string;
  similarity: number;
  textScore: number;
  locationScore: number;
  categoryScore: number;
  timeScore: number;
  sameCategory: boolean;
  sameLocality: boolean;
};

function locationScore(a: DuplicateSubject, b: DuplicateSubject): number {
  if (a.localityId && a.localityId === b.localityId) return 1;
  if (a.lat != null && a.lng != null && b.lat != null && b.lng != null) {
    const d = distanceMetres(a.lat, a.lng, b.lat, b.lng);
    if (d < 300) return 1;
    if (d < 1000) return 0.6;
  }
  if (a.wardId != null && a.wardId === b.wardId) return 0.6;
  return 0;
}

function timeScore(c: DuplicateCandidate, now: Date): number {
  if (!c.resolvedAt) return 1; // still open → a new report is very likely about the same incident
  const daysSince = (now.getTime() - c.resolvedAt.getTime()) / 86_400_000;
  return daysSince <= 7 ? 0.5 : daysSince <= 30 ? 0.2 : 0;
}

export function scoreDuplicate(subject: DuplicateSubject, c: DuplicateCandidate, now = new Date()): DuplicateScore {
  const textScore = Math.max(0, cosineSimilarity(subject.embedding, c.embedding));
  const loc = locationScore(subject, c);
  const cat = subject.categoryId === c.categoryId ? 1 : subject.departmentId === c.departmentId ? 0.5 : 0;
  const time = timeScore(c, now);
  const w = DUPLICATE_WEIGHTS;
  const similarity = w.text * textScore + w.location * loc + w.category * cat + w.time * time;
  const r = (x: number) => Math.round(x * 1000) / 1000;
  return {
    issueId: c.issueId,
    reference: c.reference,
    similarity: r(similarity),
    textScore: r(textScore),
    locationScore: r(loc),
    categoryScore: r(cat),
    timeScore: r(time),
    sameCategory: cat === 1,
    sameLocality: loc === 1,
  };
}

/** Returns candidates at/above threshold, best first. */
export function findDuplicates(subject: DuplicateSubject, candidates: DuplicateCandidate[], now = new Date()): DuplicateScore[] {
  return candidates
    .map((c) => scoreDuplicate(subject, c, now))
    .filter((s) => s.similarity >= DUPLICATE_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity);
}
