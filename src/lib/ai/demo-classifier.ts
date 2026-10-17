import { DEPARTMENTS } from "@/lib/reference/departments";
import { canonicalTokens, normaliseText } from "@/lib/text/normalize";
import type { Classification, ComplaintInput } from "./types";

// Deterministic keyword classifier over the configured category keyword lists.
// Scoring per category:
//   exact phrase in text ("street light")              → 2
//   all words of a phrase present, any order ("pani … nhi") → 1.5
//   a single concept present (gadha ≈ gaddha ≈ pothole) → 1
// Each concept / phrase signature counts once, so synonym lists don't inflate the score.
// Confidence rises with evidence and drops when another category scores nearly as high.

type Scored = { deptId: string; deptName: string; catId: string; catName: string; score: number; hits: Set<string> };

export function classifyDemo(input: ComplaintInput): Classification {
  const raw = [input.text, input.imageCaption].filter(Boolean).join(" ");
  const text = ` ${normaliseText(raw)} `;

  // canonical concept → the citizen's own word(s) that produced it (used as key terms)
  const concepts = new Map<string, string>();
  for (const word of normaliseText(raw).split(" ")) {
    const c = canonicalTokens(word)[0];
    if (c && !concepts.has(c)) concepts.set(c, word);
  }

  const scored: Scored[] = [];
  for (const dept of DEPARTMENTS) {
    for (const cat of dept.categories) {
      const hits = new Set<string>();
      const seenConcepts = new Set<string>();
      let score = 0;
      for (const kw of cat.keywords) {
        const k = normaliseText(kw);
        const kwConcepts = canonicalTokens(k);
        if (k.includes(" ")) {
          // synonymous phrases ("road tuta" / "सड़क टूटी") share a concept signature → counted once
          const signature = [...kwConcepts].sort().join("+");
          if (seenConcepts.has(signature)) continue;
          if (text.includes(` ${k} `)) {
            seenConcepts.add(signature);
            score += 2;
            hits.add(k);
          } else if (kwConcepts.length > 1 && kwConcepts.every((c) => concepts.has(c))) {
            seenConcepts.add(signature);
            score += 1.5;
            kwConcepts.forEach((c) => hits.add(concepts.get(c)!));
          }
        } else {
          const c = kwConcepts[0];
          if (c && concepts.has(c) && !seenConcepts.has(c)) {
            seenConcepts.add(c);
            score += 1;
            hits.add(concepts.get(c)!);
          }
        }
      }
      if (score > 0) scored.push({ deptId: dept.id, deptName: dept.name, catId: cat.id, catName: cat.name, score, hits });
    }
  }
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  if (!best) {
    return {
      departmentId: "other",
      categoryId: "other",
      confidence: 0.35,
      keyTerms: [...concepts.values()].slice(0, 5),
      reason: "No clear civic category was found. An authority will choose the right department.",
    };
  }

  const runnerUp = scored.find((s) => s.catId !== best.catId)?.score ?? 0;
  const evidence = 1 - Math.exp(-1.2 * best.score); // 1 → 0.70, 2 → 0.91, 3 → 0.97
  const ambiguity = 1 - 0.3 * (runnerUp / best.score);
  const confidence = Math.min(0.97, Math.max(0.4, evidence * ambiguity));

  const contextTerms = ["school", "hospital", "day", "not"].filter((c) => concepts.has(c)).map((c) => concepts.get(c)!);
  const keyTerms = [...new Set([...best.hits, ...contextTerms])].slice(0, 6);

  return {
    departmentId: best.deptId,
    categoryId: best.catId,
    confidence: Math.round(confidence * 100) / 100,
    keyTerms,
    reason: `The complaint mentions ${[...best.hits].slice(0, 3).map((h) => `"${h}"`).join(", ")}, which matches ${best.deptName} → ${best.catName}.`,
  };
}
