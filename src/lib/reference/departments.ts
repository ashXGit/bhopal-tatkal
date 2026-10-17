// Default department + category configuration.
// Seeded into the DB; admins can edit afterwards. The demo AI classifier also reads this list,
// so adding keywords here improves classification without code changes.

export type CategoryDef = {
  id: string;
  name: string;
  nameHi: string;
  keywords: string[];
  safetyRisk: number; // 0-40
  serviceRisk: number; // 0-30
};

export type DepartmentDef = {
  id: string;
  name: string;
  nameHi: string;
  icon: string;
  slaHours: number;
  categories: CategoryDef[];
};

export const DEPARTMENTS: DepartmentDef[] = [
  {
    id: "roads",
    name: "Roads",
    nameHi: "सड़क",
    icon: "🛣️",
    slaHours: 72,
    categories: [
      { id: "pothole", name: "Pothole / Road Damage", nameHi: "गड्ढा / सड़क टूटी", keywords: ["road", "pothole", "gadha", "gaddha", "gadda", "गड्ढा", "गढ्ढा", "road toot", "road tuta", "road damage", "broken road", "toota", "tooti", "सड़क टूटी"], safetyRisk: 30, serviceRisk: 5 },
      { id: "road-blocked", name: "Road Blocked / Debris", nameHi: "रास्ता बंद", keywords: ["malba", "debris", "blocked", "rasta band", "रास्ता बंद", "मलबा"], safetyRisk: 20, serviceRisk: 10 },
      { id: "footpath", name: "Footpath Damage", nameHi: "फुटपाथ", keywords: ["footpath", "फुटपाथ", "sidewalk", "pavement"], safetyRisk: 15, serviceRisk: 0 },
    ],
  },
  {
    id: "water",
    name: "Water Supply",
    nameHi: "पानी",
    icon: "💧",
    slaHours: 24,
    categories: [
      { id: "no-water", name: "No Water Supply", nameHi: "पानी नहीं आ रहा", keywords: ["pani nahi", "pani nhi", "paani nahi", "no water", "water supply", "पानी नहीं", "nal", "नल", "supply band"], safetyRisk: 5, serviceRisk: 30 },
      { id: "pipe-leak", name: "Pipeline Leakage", nameHi: "पाइप लीकेज", keywords: ["leak", "leakage", "pipe phata", "pipeline", "पाइप", "लीक", "pani beh"], safetyRisk: 5, serviceRisk: 20 },
      { id: "dirty-water", name: "Dirty / Contaminated Water", nameHi: "गंदा पानी", keywords: ["ganda pani", "dirty water", "गंदा पानी", "contaminated", "badbu wala pani", "peela pani"], safetyRisk: 25, serviceRisk: 20 },
    ],
  },
  {
    id: "sanitation",
    name: "Garbage & Sanitation",
    nameHi: "कचरा और सफाई",
    icon: "🗑️",
    slaHours: 48,
    categories: [
      { id: "garbage", name: "Garbage Not Collected", nameHi: "कचरा नहीं उठा", keywords: ["garbage", "kachra", "kachara", "कचरा", "waste", "dustbin", "kuda", "कूड़ा", "safai"], safetyRisk: 10, serviceRisk: 15 },
      { id: "dead-animal", name: "Dead Animal", nameHi: "मृत जानवर", keywords: ["dead animal", "mara hua", "मरा हुआ", "dead dog", "dead cow"], safetyRisk: 20, serviceRisk: 10 },
      { id: "public-toilet", name: "Public Toilet", nameHi: "सार्वजनिक शौचालय", keywords: ["toilet", "shauchalay", "शौचालय", "washroom", "urinal"], safetyRisk: 10, serviceRisk: 15 },
    ],
  },
  {
    id: "drainage",
    name: "Drainage",
    nameHi: "नाली",
    icon: "🚰",
    slaHours: 48,
    categories: [
      { id: "drain-overflow", name: "Drain Overflow / Blocked", nameHi: "नाली ओवरफ्लो", keywords: ["nali", "naali", "नाली", "drain", "overflow", "sewer", "gutter", "chamber", "choke"], safetyRisk: 20, serviceRisk: 15 },
      { id: "waterlogging", name: "Waterlogging", nameHi: "जलभराव", keywords: ["waterlogging", "pani bhara", "जलभराव", "pani jama", "flood", "bhar gaya"], safetyRisk: 25, serviceRisk: 15 },
    ],
  },
  {
    id: "streetlights",
    name: "Street Lighting",
    nameHi: "स्ट्रीट लाइट",
    icon: "💡",
    slaHours: 48,
    categories: [
      { id: "light-not-working", name: "Street Light Not Working", nameHi: "लाइट बंद", keywords: ["street light", "streetlight", "light kharab", "light band", "batti", "लाइट", "andhera", "अंधेरा", "lamp"], safetyRisk: 20, serviceRisk: 10 },
    ],
  },
  {
    id: "electricity",
    name: "Electricity",
    nameHi: "बिजली",
    icon: "⚡",
    slaHours: 24,
    categories: [
      { id: "power-cut", name: "Power Cut", nameHi: "बिजली कटौती", keywords: ["bijli", "बिजली", "power cut", "light nahi", "current nahi", "electricity", "outage"], safetyRisk: 5, serviceRisk: 30 },
      { id: "loose-wire", name: "Loose / Hanging Wire", nameHi: "लटकता तार", keywords: ["wire", "taar", "तार", "transformer", "spark", "khamba", "pole", "current"], safetyRisk: 40, serviceRisk: 10 },
    ],
  },
  {
    id: "parks",
    name: "Parks",
    nameHi: "पार्क",
    icon: "🌳",
    slaHours: 120,
    categories: [
      { id: "park-maintenance", name: "Park Maintenance", nameHi: "पार्क रखरखाव", keywords: ["park", "पार्क", "garden", "bagicha", "jhula", "swing", "ped", "tree"], safetyRisk: 5, serviceRisk: 5 },
      { id: "fallen-tree", name: "Fallen Tree", nameHi: "गिरा पेड़", keywords: ["ped gira", "tree fall", "fallen tree", "पेड़ गिरा", "branch"], safetyRisk: 30, serviceRisk: 10 },
    ],
  },
  {
    id: "traffic",
    name: "Traffic",
    nameHi: "यातायात",
    icon: "🚦",
    slaHours: 48,
    categories: [
      { id: "signal", name: "Traffic Signal Fault", nameHi: "सिग्नल खराब", keywords: ["signal", "सिग्नल", "traffic light"], safetyRisk: 30, serviceRisk: 10 },
      { id: "encroachment", name: "Encroachment / Illegal Parking", nameHi: "अतिक्रमण", keywords: ["encroachment", "atikraman", "अतिक्रमण", "parking", "thela", "jam"], safetyRisk: 10, serviceRisk: 10 },
    ],
  },
  {
    id: "infrastructure",
    name: "Public Infrastructure",
    nameHi: "सार्वजनिक ढांचा",
    icon: "🏗️",
    slaHours: 168,
    categories: [
      { id: "public-property", name: "Damaged Public Property", nameHi: "सार्वजनिक संपत्ति", keywords: ["bus stop", "bench", "railing", "bridge", "pul", "पुल", "divider", "wall", "deewar"], safetyRisk: 20, serviceRisk: 5 },
    ],
  },
  {
    id: "other",
    name: "Other",
    nameHi: "अन्य",
    icon: "📋",
    slaHours: 168,
    categories: [
      { id: "other", name: "Other Civic Issue", nameHi: "अन्य समस्या", keywords: [], safetyRisk: 0, serviceRisk: 0 },
    ],
  },
];

export const CATEGORY_INDEX = new Map(
  DEPARTMENTS.flatMap((d) => d.categories.map((c) => [c.id, { ...c, departmentId: d.id }] as const)),
);
