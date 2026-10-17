import { LOCALITIES, type LocalityDef } from "@/lib/reference/gazetteer";
import { normaliseText } from "@/lib/text/normalize";
import type { LocalityMatch } from "@/lib/ai/types";

// Resolves informal location descriptions ("board office wali road", "DB Mall ke paas")
// to an official locality + ward using the gazetteer. Longest alias match wins, so
// "mp nagar zone 2" beats "mp nagar". GPS is used when no text match is found.

export type GazetteerEntry = LocalityDef & { id?: string };

export function resolveLocality(
  text: string,
  coords?: { lat?: number | null; lng?: number | null },
  gazetteer: GazetteerEntry[] = LOCALITIES,
): LocalityMatch | null {
  const t = ` ${normaliseText(text)} `;
  let best: { entry: GazetteerEntry; term: string; landmark: boolean } | null = null;

  for (const entry of gazetteer) {
    const terms = [
      ...[entry.name, ...entry.aliases].map((term) => ({ term, landmark: false })),
      ...entry.landmarks.map((term) => ({ term, landmark: true })),
    ];
    for (const { term, landmark } of terms) {
      const n = normaliseText(term);
      if (n && t.includes(` ${n} `) && (!best || n.length > normaliseText(best.term).length)) {
        best = { entry, term, landmark };
      }
    }
  }

  if (best) {
    return {
      localityId: best.entry.id,
      localityName: best.entry.name,
      wardId: best.entry.ward,
      matchedOn: best.term,
      confidence: best.landmark ? 0.8 : 0.92,
    };
  }

  if (coords?.lat != null && coords?.lng != null) {
    const nearest = gazetteer
      .map((e) => ({ e, d: distanceMetres(coords.lat!, coords.lng!, e.lat, e.lng) }))
      .sort((a, b) => a.d - b.d)[0];
    if (nearest && nearest.d < 3000) {
      return {
        localityId: nearest.e.id,
        localityName: nearest.e.name,
        wardId: nearest.e.ward,
        matchedOn: "gps",
        confidence: nearest.d < 800 ? 0.85 : 0.6,
      };
    }
  }
  return null;
}

export function distanceMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
