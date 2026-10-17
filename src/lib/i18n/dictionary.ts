// UI strings in English, Hinglish and Hindi. Citizens can type in any language regardless of UI language.
// Keep labels short and plain — no technical terms.

export const LANGS = ["en", "hinglish", "hi"] as const;
export type Lang = (typeof LANGS)[number];
export const LANG_LABEL: Record<Lang, string> = { hi: "हिंदी", hinglish: "Hinglish", en: "English" };

const en = {
  tagline: "Bhopal Tatkal — the City's Complaint Queue",
  subtext: "Report a civic problem. We help get it to the right authority.",
  promise: "One problem. One verified issue. One accountable authority.",
  report: "Report a Problem",
  track: "Track My Issue",
  explore: "Explore Issues",
  statReported: "Issues Reported",
  statResolved: "Issues Resolved",
  statPending: "Issues Pending",
  statAttention: "Getting Attention",
  howItWorks: "How it works",
  flow: ["Citizen Reports", "AI checks it", "Authority Review", "Verified Issue", "Accountable Department", "Resolution"],
  navHome: "Home",
  navMyIssues: "My Issues",
  navMessages: "Messages",
  upvotes: "Upvotes",
  daysUnresolved: "days unresolved",
  reports: "reports",
  anonymous: "Anonymous Citizen",
  emptyIssues: "No issues here yet.",
  demoBanner: "Demo Mode: synthetic data, not connected to any government system.",
};

type Dict = typeof en;

const hinglish: Dict = {
  ...en,
  subtext: "Shehar ki samasya batayein. Hum use sahi vibhag tak pahunchayenge.",
  promise: "Ek samasya. Ek verified issue. Ek zimmedar vibhag.",
  report: "Samasya Batayein",
  track: "Meri Shikayat Dekhein",
  explore: "Sabhi Samasyayein",
  statReported: "Kul Shikayatein",
  statResolved: "Hal Hui",
  statPending: "Baaki",
  statAttention: "Kaam Chal Raha",
  howItWorks: "Kaise kaam karta hai",
  flow: ["Aap batate hain", "AI samajhta hai", "Adhikari jaanch", "Verified Issue", "Zimmedar Vibhag", "Samadhan"],
  navMyIssues: "Meri Shikayatein",
  daysUnresolved: "din se pending",
  reports: "shikayatein",
  emptyIssues: "Abhi koi samasya nahi hai.",
  demoBanner: "Demo Mode: synthetic data, kisi sarkari system se jude nahi hain.",
};

const hi: Dict = {
  ...en,
  tagline: "भोपाल तत्काल — शहर की शिकायत कतार",
  subtext: "शहर की समस्या बताइए। हम उसे सही विभाग तक पहुँचाएँगे।",
  promise: "एक समस्या। एक सत्यापित मुद्दा। एक ज़िम्मेदार विभाग।",
  report: "समस्या बताएँ",
  track: "मेरी शिकायत देखें",
  explore: "सभी समस्याएँ",
  statReported: "कुल शिकायतें",
  statResolved: "हल हुईं",
  statPending: "बाकी",
  statAttention: "काम जारी",
  howItWorks: "यह कैसे काम करता है",
  flow: ["नागरिक शिकायत", "AI जाँच", "अधिकारी समीक्षा", "सत्यापित मुद्दा", "ज़िम्मेदार विभाग", "समाधान"],
  navHome: "होम",
  navMyIssues: "मेरी शिकायतें",
  navMessages: "संदेश",
  upvotes: "समर्थन",
  daysUnresolved: "दिन से लंबित",
  reports: "शिकायतें",
  anonymous: "अज्ञात नागरिक",
  emptyIssues: "अभी यहाँ कोई समस्या नहीं है।",
  demoBanner: "डेमो मोड: सिंथेटिक डेटा, किसी सरकारी सिस्टम से जुड़ा नहीं।",
};

export const DICTIONARY: Record<Lang, Dict> = { en, hinglish, hi };
export type { Dict };
