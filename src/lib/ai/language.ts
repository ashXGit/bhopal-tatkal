import { containsDevanagari, normaliseText } from "@/lib/text/normalize";
import type { LanguageCode } from "./types";

// Romanised Hindi function words — their presence in Latin script signals Hinglish.
const HINGLISH_MARKERS = new Set([
  "hai", "hain", "nahi", "nhi", "nahin", "raha", "rahi", "rha", "rhi", "gaya", "gya", "me", "mein", "ke", "ka", "ki", "ko",
  "se", "paas", "bahut", "bhut", "din", "pani", "paani", "kharab", "wali", "wala", "kab", "kyu", "kyon", "ho",
]);

export function detectLanguage(text: string): LanguageCode {
  if (containsDevanagari(text)) {
    const latinWords = text.match(/[a-zA-Z]{3,}/g)?.length ?? 0;
    return latinWords >= 3 ? "HINGLISH" : "HINDI";
  }
  const words = normaliseText(text).split(" ");
  const markers = words.filter((w) => HINGLISH_MARKERS.has(w)).length;
  return markers >= 1 && markers / Math.max(words.length, 1) >= 0.08 ? "HINGLISH" : "ENGLISH";
}
