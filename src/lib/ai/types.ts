// Shared types for the triage pipeline. Mirrors Prisma enums but keeps lib/ai free of DB imports.

export type LanguageCode = "HINDI" | "ENGLISH" | "HINGLISH";
export type UrgencyLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ComplaintInput = {
  text: string;
  imageCaption?: string | null;
  locationText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  hasImage?: boolean;
};

export type Classification = {
  departmentId: string;
  categoryId: string;
  confidence: number; // 0..1
  keyTerms: string[];
  reason: string; // short, user-facing — never chain-of-thought
};

export type LocalityMatch = {
  localityId?: string; // DB id when resolved against DB rows
  localityName: string;
  wardId: number;
  matchedOn: string; // the alias / landmark / "gps"
  confidence: number;
};

export type UrgencyResult = {
  level: UrgencyLevel;
  score: number; // 0..100
  reasons: string[];
  factors: { safety: number; service: number; duration: number; sensitiveLocation: number };
};

export type TriageResult = {
  language: LanguageCode;
  classification: Classification;
  urgency: UrgencyResult;
  locality: LocalityMatch | null;
  embedding: number[];
  isDemo: boolean; // true when produced by the deterministic demo layer
  provider: string;
};

// A pluggable LLM provider only needs to improve classification; the rest of the
// pipeline (urgency, locality, embeddings, duplicates) stays deterministic + explainable.
export interface AIProvider {
  name: string;
  isDemo: boolean;
  classify(input: ComplaintInput): Promise<Classification>;
  embed(text: string): Promise<number[]>;
}
