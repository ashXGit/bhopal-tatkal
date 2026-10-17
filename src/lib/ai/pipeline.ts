import { CATEGORY_INDEX } from "@/lib/reference/departments";
import { resolveLocality, type GazetteerEntry } from "@/lib/locality/resolve";
import { scoreUrgency } from "@/lib/scoring/urgency";
import { classifyDemo } from "./demo-classifier";
import { demoEmbedding } from "./embedding";
import { demoProvider as DEMO } from "./demo-provider";
import { detectLanguage } from "./language";
import type { AIProvider, ComplaintInput, TriageResult } from "./types";

// Complaint → Language → Classification → Urgency → Locality → Embedding.
// Duplicate detection and ticket creation happen in the service layer (they need the DB).

export async function triageComplaint(
  input: ComplaintInput,
  opts: { provider?: AIProvider; gazetteer?: GazetteerEntry[] } = {},
): Promise<TriageResult> {
  let provider = opts.provider ?? DEMO;
  const fullText = [input.text, input.imageCaption].filter(Boolean).join(". ");

  const language = detectLanguage(fullText);

  let classification;
  try {
    classification = await provider.classify(input);
  } catch (err) {
    console.error(`[ai] ${provider.name} classify failed, falling back to demo AI`, err);
    provider = DEMO;
    classification = classifyDemo(input);
  }
  // Guard against an LLM returning an unknown category.
  if (!CATEGORY_INDEX.has(classification.categoryId)) {
    classification = { ...classification, departmentId: "other", categoryId: "other" };
  }

  const urgency = scoreUrgency(fullText, classification.categoryId);

  const locality = resolveLocality(
    [input.locationText, fullText].filter(Boolean).join(" "),
    { lat: input.latitude, lng: input.longitude },
    opts.gazetteer,
  );

  let embedding: number[];
  try {
    embedding = await provider.embed(fullText);
  } catch {
    embedding = demoEmbedding(fullText);
  }

  return { language, classification, urgency, locality, embedding, isDemo: provider.isDemo, provider: provider.name };
}
