// Default Bhopal locality gazetteer — DEMO / SYNTHETIC.
// Ward numbers and groupings are illustrative, not official BMC ward boundaries.
// Replace via Admin → Gazetteer or a dataset import when official data is supplied.

export type LocalityDef = {
  name: string;
  ward: number;
  lat: number;
  lng: number;
  aliases: string[]; // colloquial names
  landmarks: string[];
};

export type WardDef = { id: number; name: string; zone: string };

export const WARDS: WardDef[] = [
  { id: 12, name: "MP Nagar", zone: "Zone 3" },
  { id: 14, name: "Arera Colony", zone: "Zone 3" },
  { id: 19, name: "Shivaji Nagar", zone: "Zone 4" },
  { id: 23, name: "TT Nagar", zone: "Zone 4" },
  { id: 31, name: "Kolar Road", zone: "Zone 7" },
  { id: 36, name: "Bawadia Kalan", zone: "Zone 7" },
  { id: 41, name: "Govindpura", zone: "Zone 9" },
  { id: 45, name: "Ashoka Garden", zone: "Zone 9" },
  { id: 52, name: "Old City", zone: "Zone 1" },
  { id: 58, name: "Bairagarh", zone: "Zone 2" },
];

export const LOCALITIES: LocalityDef[] = [
  { name: "MP Nagar Zone 1", ward: 12, lat: 23.2332, lng: 77.4343, aliases: ["mp nagar", "m p nagar", "एमपी नगर", "madhya pradesh nagar", "zone 1"], landmarks: ["db mall", "डीबी मॉल", "jyoti talkies", "ज्योति टॉकीज"] },
  { name: "Board Office Area", ward: 12, lat: 23.2326, lng: 77.4296, aliases: ["board office", "बोर्ड ऑफिस", "board office wali road", "board office chauraha"], landmarks: ["board office square", "pragati petrol pump"] },
  { name: "MP Nagar Zone 2", ward: 12, lat: 23.2287, lng: 77.4386, aliases: ["zone 2", "zone-2"], landmarks: ["mansarovar complex", "habibganj naka"] },
  { name: "Arera Colony", ward: 14, lat: 23.2156, lng: 77.4325, aliases: ["arera", "अरेरा कॉलोनी", "e-7", "e7", "e-5", "10 number", "10 no market", "das number"], landmarks: ["10 number market", "bittan market", "बिट्टन मार्केट"] },
  { name: "Shivaji Nagar", ward: 19, lat: 23.2331, lng: 77.4093, aliases: ["shivaji nagar", "शिवाजी नगर", "1100 quarters", "1250"], landmarks: ["1250 hospital", "shivaji nagar bus stop"] },
  { name: "TT Nagar", ward: 23, lat: 23.2385, lng: 77.3986, aliases: ["tt nagar", "t t nagar", "टीटी नगर", "tatya tope nagar", "new market"], landmarks: ["new market", "न्यू मार्केट", "roshanpura", "रोशनपुरा"] },
  { name: "Kolar Road", ward: 31, lat: 23.1837, lng: 77.4107, aliases: ["kolar", "कोलार", "kolar road", "sarvdharm"], landmarks: ["sarvdharm bridge", "c21 mall", "danish kunj"] },
  { name: "Bawadia Kalan", ward: 36, lat: 23.1942, lng: 77.4389, aliases: ["bawadia", "bawadiya", "बावड़िया कलां", "bawadia kalan", "bawadia kalan side"], landmarks: ["aura mall", "gulmohar"] },
  { name: "Govindpura", ward: 41, lat: 23.2565, lng: 77.4497, aliases: ["govindpura", "गोविंदपुरा", "industrial area", "bhel"], landmarks: ["govindpura industrial area", "jk road"] },
  { name: "Ashoka Garden", ward: 45, lat: 23.2584, lng: 77.4243, aliases: ["ashoka garden", "अशोका गार्डन", "ashoka garden road"], landmarks: ["prabhat square", "प्रभात चौराहा"] },
  { name: "Old City (Chowk Bazaar)", ward: 52, lat: 23.2614, lng: 77.4033, aliases: ["old city", "purana bhopal", "पुराना भोपाल", "chowk", "चौक बाजार", "peer gate"], landmarks: ["taj ul masajid", "moti masjid", "chowk bazaar"] },
  { name: "Bairagarh", ward: 58, lat: 23.2766, lng: 77.3376, aliases: ["bairagarh", "बैरागढ़", "sant hirdaram nagar"], landmarks: ["bairagarh market", "upper lake view"] },
];
