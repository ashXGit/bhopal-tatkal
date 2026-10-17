import { canonicalTokens } from "@/lib/text/normalize";

// Deterministic "demo" embedding: feature-hashed bag of canonical tokens + character trigrams.
// Not a neural embedding, but a real vector — cosine similarity on it is a genuine measure of
// textual overlap (after Hinglish/Hindi synonym normalisation). A real provider can swap this out.

export const EMBEDDING_DIM = 256;

function hash(s: string): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function demoEmbedding(text: string): number[] {
  const v = new Array<number>(EMBEDDING_DIM).fill(0);
  const tokens = canonicalTokens(text);
  for (const t of tokens) {
    v[hash(t) % EMBEDDING_DIM] += 1;
    // trigrams give tolerance to typos ("pothol", "garbge") at a lower weight
    const padded = ` ${t} `;
    for (let i = 0; i + 3 <= padded.length; i++) v[hash("#" + padded.slice(i, i + 3)) % EMBEDDING_DIM] += 0.25;
  }
  return l2normalise(v);
}

export function l2normalise(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return norm === 0 ? v : v.map((x) => x / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na === 0 || nb === 0 ? 0 : dot / Math.sqrt(na * nb);
}
