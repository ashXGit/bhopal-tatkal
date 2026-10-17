// Sanity check for the demo AI pipeline using the hackathon scenario (spec §61).
// Run: npm run check:pipeline
import { triageComplaint } from "@/lib/ai/pipeline";
import { DUPLICATE_THRESHOLD, scoreDuplicate } from "@/lib/duplicates/similarity";

const samples = [
  "MP Nagar me school ke paas road me bahut bada gadha hai.",
  "pani 3 din se nhi aa rha, Arera Colony E-7",
  "street light kharab hai board office wali road",
  "nali overflow ho rahi hai Bawadia Kalan side",
  "garbage 5 din se pada hai DB Mall ke paas",
  "बिजली का तार लटक रहा है, बच्चों को खतरा है - अशोका गार्डन",
  "The traffic signal at Roshanpura is not working since yesterday",
];

async function main() {
  for (const text of samples) {
    const r = await triageComplaint({ text });
    console.log(`\n"${text}"`);
    console.log(`  ${r.language} | ${r.classification.departmentId} → ${r.classification.categoryId} | ${Math.round(r.classification.confidence * 100)}%`);
    console.log(`  urgency ${r.urgency.level} ${r.urgency.score}/100 [${r.urgency.reasons.join("; ")}]`);
    console.log(`  location ${r.locality ? `${r.locality.localityName} · Ward ${r.locality.wardId} (via "${r.locality.matchedOn}")` : "not found"}`);
    console.log(`  key terms: ${r.classification.keyTerms.join(", ")}`);
  }

  // Duplicate check: new complaint vs existing live issue TR-1024
  const existing = await triageComplaint({ text: "MP Nagar Zone 1 me school ke paas road par bada pothole ho gaya hai, bacchon ko khatra hai" });
  const incoming = await triageComplaint({ text: samples[0] });
  const subject = (t: typeof existing) => ({
    embedding: t.embedding,
    categoryId: t.classification.categoryId,
    departmentId: t.classification.departmentId,
    localityId: t.locality?.localityName,
    wardId: t.locality?.wardId,
  });
  const dup = scoreDuplicate(subject(incoming), { ...subject(existing), issueId: "x", reference: "TR-1024" });
  console.log(`\nDuplicate vs TR-1024: ${Math.round(dup.similarity * 100)}%`, dup, dup.similarity >= DUPLICATE_THRESHOLD ? "→ DUPLICATE REVIEW" : "→ normal review");

  const unrelated = await triageComplaint({ text: "Kolar road pe street light band hai" });
  const dup2 = scoreDuplicate(subject(unrelated), { ...subject(existing), issueId: "x", reference: "TR-1024" });
  console.log(`Unrelated vs TR-1024: ${Math.round(dup2.similarity * 100)}%`);
}
main();
