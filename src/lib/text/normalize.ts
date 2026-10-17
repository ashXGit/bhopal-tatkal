// Text normalisation for Hindi / Hinglish / English complaints.
// Maps spelling variants and cross-language synonyms to one canonical token so that
// "gadha", "gaddha", "गड्ढा" and "pothole" all compare as the same concept.

const CANONICAL: Record<string, string> = {
  // road damage
  gadha: "pothole", gaddha: "pothole", gadda: "pothole", gadde: "pothole", gaddhe: "pothole", potholes: "pothole",
  "गड्ढा": "pothole", "गढ्ढा": "pothole", "गड्ढे": "pothole",
  sadak: "road", "सड़क": "road", rasta: "road", "रास्ता": "road", roads: "road",
  toota: "broken", tuta: "broken", tooti: "broken", tuti: "broken", "टूटी": "broken", "टूटा": "broken", damaged: "broken",
  // water
  pani: "water", paani: "water", "पानी": "water", jal: "water", nal: "tap", "नल": "tap",
  // sanitation
  kachra: "garbage", kachara: "garbage", kuda: "garbage", kooda: "garbage", "कचरा": "garbage", "कूड़ा": "garbage", trash: "garbage", waste: "garbage",
  // drainage
  nali: "drain", naali: "drain", "नाली": "drain", gutter: "drain", sewer: "drain", drains: "drain",
  // lights / power
  batti: "light", "लाइट": "light", lights: "light", bijli: "electricity", "बिजली": "electricity", current: "electricity", power: "electricity",
  taar: "wire", "तार": "wire", wires: "wire",
  // time
  din: "day", dino: "day", "दिन": "day", days: "day", hafte: "week", hafta: "week", "हफ्ते": "week",
  // places
  vidyalaya: "school", "स्कूल": "school", schools: "school", aspatal: "hospital", "अस्पताल": "hospital",
  // negation
  nahi: "not", nhi: "not", nahin: "not", "नहीं": "not", na: "not",
  kharab: "broken", "खराब": "broken",
};

// Function words that carry no meaning for classification / similarity.
const STOPWORDS = new Set([
  "hai", "hain", "ho", "raha", "rahi", "rha", "rhi", "rahe", "gaya", "gayi", "gya", "me", "mein", "main", "mai", "ke", "ka", "ki", "ko",
  "se", "par", "pe", "paas", "pass", "bahut", "bhut", "bada", "badi", "bade", "ek", "yeh", "ye", "woh", "wo", "aur", "bhi", "to", "tak",
  "wali", "wala", "wale", "side", "please", "plz", "kripya", "sir", "ji",
  "the", "a", "an", "is", "are", "was", "in", "on", "at", "of", "for", "and", "or", "near", "there", "very", "big", "since", "from", "my", "our", "this", "it", "has", "have", "been",
  "है", "हैं", "में", "के", "का", "की", "को", "से", "पर", "पास", "बहुत", "बड़ा", "और", "भी", "हो", "रहा", "रही",
]);

export function normaliseText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFC")
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ") // keep letters (incl. Devanagari + matras), digits
    .replace(/\s+/g, " ")
    .trim();
}

export function canonicalTokens(input: string): string[] {
  return normaliseText(input)
    .split(" ")
    .filter(Boolean)
    .map((t) => CANONICAL[t] ?? t)
    .filter((t) => !STOPWORDS.has(t) && t.length > 1);
}

export const containsDevanagari = (s: string) => /[ऀ-ॿ]/.test(s);
