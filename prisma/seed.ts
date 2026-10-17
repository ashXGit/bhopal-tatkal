/* eslint-disable no-console */
// Seeds DEMO / SYNTHETIC data. Nothing here comes from a real government system.
// Every seeded complaint runs through the same triage pipeline used in production.

import { PrismaClient, type ComplaintStatus, type InputMode, type IssueStatus } from "@prisma/client";
import { DEPARTMENTS } from "../src/lib/reference/departments";
import { LOCALITIES, WARDS } from "../src/lib/reference/gazetteer";
import { DEMO_USERS } from "../src/lib/auth/roles";
import { triageComplaint } from "../src/lib/ai/pipeline";
import { findDuplicates } from "../src/lib/duplicates/similarity";
import { ticketReference } from "../src/lib/references";

const prisma = new PrismaClient();
const DAY = 86_400_000;
const now = Date.now();
const daysAgo = (d: number, h = 0) => new Date(now - d * DAY - h * 3_600_000);

// Deterministic PRNG so every seed produces the same demo dataset.
let rng = 42;
const rand = () => ((rng = (rng * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];

type IssueSeed = {
  reference?: string;
  title: string;
  reports: string[]; // first = original complaint, rest = merged duplicates
  mode?: InputMode;
  caption?: string;
  ageDays: number;
  upvotes: number;
  status: IssueStatus;
  resolvedAfterHours?: number;
  explanation?: string;
};

const ISSUES: IssueSeed[] = [
  // ★ Hackathon demo issue (spec §61): 11 reports now, the live demo adds the 12th.
  {
    reference: "TR-1024",
    title: "Large road pothole near school",
    reports: [
      "MP Nagar Zone 1 me school ke paas road par bada pothole ho gaya hai, bacchon ko khatra hai",
      "MP Nagar school ke saamne gaddha, do-wheeler gir rahe hain",
      "Big pothole near the school in MP Nagar, very dangerous for kids",
      "mp nagar road me gadha hai school ke paas",
      "एमपी नगर में स्कूल के पास सड़क पर बड़ा गड्ढा",
      "Jyoti Talkies se school wali road pe pothole",
      "MP Nagar zone 1 road toot gayi hai school ke paas",
      "school ke paas road me gadde ki wajah se accident hua",
      "Pothole MP Nagar school road still not repaired",
      "MP Nagar me gaddha abhi bhi hai, school bus phas gayi",
      "DB Mall se school ki taraf road pe bada gadha",
    ],
    ageDays: 17,
    upvotes: 148,
    status: "IN_PROGRESS",
  },
  // 30+ day issue — triggers "Explanation Required"
  { title: "Drain overflowing on main road", reports: ["Bawadia Kalan main road pe nali overflow ho rahi hai, ganda pani road pe", "Bawadia nali 1 mahine se band hai", "बावड़िया कलां में नाली ओवरफ्लो"], ageDays: 34, upvotes: 96, status: "ASSIGNED" },
  { title: "Garbage dump not cleared", reports: ["Old City chowk bazaar me kachra 10 din se pada hai", "Chowk me garbage ka dher, badbu aa rahi hai"], ageDays: 41, upvotes: 63, status: "IN_PROGRESS", explanation: "Collection vehicle under repair; alternate vehicle deployed from Zone 2. Clearance scheduled this week." },
  { title: "No water supply for days", reports: ["pani 3 din se nhi aa rha, Arera Colony E-7", "Arera colony me water supply band hai", "E-7 Arera me nal me pani nahi"], ageDays: 6, upvotes: 71, status: "IN_PROGRESS" },
  { title: "Street lights not working", reports: ["street light kharab hai board office wali road", "Board office chauraha pe andhera rehta hai, light band"], ageDays: 9, upvotes: 38, status: "ASSIGNED", mode: "VOICE" },
  { title: "Hanging electricity wire", reports: ["बिजली का तार लटक रहा है, बच्चों को खतरा है - अशोका गार्डन"], ageDays: 2, upvotes: 22, status: "ASSIGNED" },
  { title: "Traffic signal not working", reports: ["The traffic signal at Roshanpura is not working since yesterday", "Roshanpura signal band hai, jam lag raha hai"], ageDays: 3, upvotes: 19, status: "IN_PROGRESS" },
  { title: "Waterlogging after rain", reports: ["Kolar road pe barish ke baad pani bhara hai, nikalna mushkil"], ageDays: 12, upvotes: 44, status: "ASSIGNED" },
  { title: "Broken footpath near market", reports: ["New Market footpath toota hua hai, log gir rahe hain"], ageDays: 22, upvotes: 27, status: "ASSIGNED", mode: "IMAGE", caption: "Ye footpath market ke paas toot gaya hai." },
  { title: "Park swings broken", reports: ["Shivaji Nagar park me jhula toota hai"], ageDays: 15, upvotes: 12, status: "APPROVED" },
  { title: "Dirty water from tap", reports: ["Govindpura me nal se ganda pani aa raha hai, peela pani"], ageDays: 4, upvotes: 33, status: "IN_PROGRESS" },
  { title: "Pipeline leakage", reports: ["Bairagarh market ke paas pipeline leak, pani beh raha hai 2 din se"], ageDays: 2, upvotes: 9, status: "ASSIGNED" },
  { title: "Fallen tree blocking lane", reports: ["Arera colony 10 number market ke paas ped gira hai, rasta band"], ageDays: 1, upvotes: 14, status: "ASSIGNED" },
  { title: "Public toilet unusable", reports: ["TT Nagar public toilet bahut ganda hai, safai nahi hoti"], ageDays: 31, upvotes: 18, status: "ASSIGNED" },
  { title: "Bus stop shelter damaged", reports: ["Shivaji Nagar bus stop ki bench aur roof tooti hai"], ageDays: 26, upvotes: 8, status: "APPROVED" },
  // resolved issues (feed median resolution time + "Issues Resolved")
  { title: "Pothole on Kolar road", reports: ["Kolar road sarvdharm ke paas gadha"], ageDays: 20, upvotes: 40, status: "RESOLVED", resolvedAfterHours: 30 },
  { title: "Garbage not collected", reports: ["Ashoka Garden me kachra gaadi nahi aayi 3 din se"], ageDays: 14, upvotes: 15, status: "RESOLVED", resolvedAfterHours: 26 },
  { title: "Street light repaired", reports: ["Bairagarh me street light band hai"], ageDays: 10, upvotes: 6, status: "RESOLVED", resolvedAfterHours: 40 },
  { title: "Water supply restored", reports: ["TT Nagar me pani nahi aa raha subah se"], ageDays: 8, upvotes: 25, status: "RESOLVED", resolvedAfterHours: 11 },
  { title: "Drain cleaned", reports: ["Govindpura industrial area nali choke"], ageDays: 18, upvotes: 11, status: "RESOLVED", resolvedAfterHours: 52 },
  { title: "Power restored", reports: ["Shivaji Nagar me bijli 6 ghante se nahi hai"], ageDays: 5, upvotes: 30, status: "RESOLVED", resolvedAfterHours: 7 },
  { title: "Dead animal removed", reports: ["Bawadia Kalan road pe dead dog pada hai"], ageDays: 7, upvotes: 5, status: "RESOLVED", resolvedAfterHours: 9 },
  { title: "Encroachment cleared", reports: ["Old City peer gate ke paas thela encroachment, jam"], ageDays: 25, upvotes: 17, status: "RESOLVED", resolvedAfterHours: 120 },
  { title: "Road debris removed", reports: ["MP Nagar Zone 2 me malba pada hai road pe"], ageDays: 12, upvotes: 10, status: "RESOLVED", resolvedAfterHours: 20 },
];

// Complaints still waiting for authority review (not public).
const PENDING: { text: string; mode?: InputMode; caption?: string; ageHours: number }[] = [
  { text: "garbage 5 din se pada hai DB Mall ke paas", ageHours: 5 },
  { text: "nali overflow ho rahi hai Bawadia Kalan side", ageHours: 3 }, // will match the 30+ day drain issue
  { text: "Arera colony me pani nahi aa raha", ageHours: 8, mode: "VOICE" }, // will match the water issue
  { text: "Kolar road pe street light band hai", ageHours: 2 },
  { text: "Ashoka Garden me transformer se spark aa raha hai", ageHours: 1 },
  { text: "TT Nagar new market ke paas road me gaddhe", ageHours: 12, mode: "IMAGE", caption: "Photo ke saath: road bilkul toot gayi hai" },
  { text: "Bairagarh park me ghaas bahut badi ho gayi hai", ageHours: 20 },
  { text: "Govindpura me kuch problem hai", ageHours: 30 }, // vague — good rejection demo
];

const REJECTED: { text: string; reason: string; ageDays: number }[] = [
  { text: "kuch theek nahi hai", reason: "This complaint does not contain enough information to verify the problem or the location.", ageDays: 6 },
  { text: "Shivaji Nagar me light kharab", reason: "The submitted image does not match the described civic problem.", ageDays: 4 },
];

async function main() {
  console.log("Seeding Bhopal Tatkal demo data…");

  // Clean slate (order respects FKs)
  await prisma.$transaction([
    prisma.auditLog.deleteMany(), prisma.notification.deleteMany(), prisma.message.deleteMany(),
    prisma.duplicateMatch.deleteMany(), prisma.upvote.deleteMany(), prisma.issueUpdate.deleteMany(),
    prisma.authorityExplanation.deleteMany(), prisma.resolutionRecord.deleteMany(), prisma.ticket.deleteMany(),
    prisma.complaint.deleteMany(), prisma.issue.deleteMany(), prisma.historicalRecord.deleteMany(),
    prisma.dataset.deleteMany(), prisma.weeklyDigest.deleteMany(), prisma.user.deleteMany(),
    prisma.localityAlias.deleteMany(), prisma.locality.deleteMany(), prisma.ward.deleteMany(),
    prisma.category.deleteMany(), prisma.department.deleteMany(),
  ]);

  // Reference data
  for (const d of DEPARTMENTS) {
    await prisma.department.create({
      data: {
        id: d.id, name: d.name, nameHi: d.nameHi, icon: d.icon, slaHours: d.slaHours,
        categories: { create: d.categories.map((c) => ({ id: c.id, name: c.name, nameHi: c.nameHi, keywords: c.keywords, safetyRisk: c.safetyRisk, serviceRisk: c.serviceRisk })) },
      },
    });
  }
  await prisma.ward.createMany({ data: WARDS });
  const localityIds = new Map<string, string>();
  for (const l of LOCALITIES) {
    const row = await prisma.locality.create({
      data: {
        name: l.name, wardId: l.ward, latitude: l.lat, longitude: l.lng,
        aliases: {
          create: (() => {
            const aliases = [...new Set(l.aliases.map((a) => a.toLowerCase()))];
            const landmarks = [...new Set(l.landmarks.map((a) => a.toLowerCase()))].filter((a) => !aliases.includes(a));
            return [...aliases.map((alias) => ({ alias })), ...landmarks.map((alias) => ({ alias, isLandmark: true }))];
          })(),
        },
      },
    });
    localityIds.set(l.name, row.id);
  }

  // Demo users (no real credentials, no real personal data)
  for (const u of DEMO_USERS) {
    await prisma.user.create({ data: { id: u.id, role: u.role, displayName: u.label, departmentId: u.departmentId, isDemo: true, zoneWardIds: u.role === "ZONE_OFFICER" ? [12, 14, 19, 23] : [] } });
  }
  for (const d of DEPARTMENTS.filter((d) => d.id !== "roads")) {
    await prisma.user.create({ data: { id: `demo-authority-${d.id}`, role: "AUTHORITY", displayName: `${d.name} Authority (demo)`, departmentId: d.id, isDemo: true } });
  }
  const citizens = await Promise.all(
    Array.from({ length: 25 }, (_, i) => prisma.user.create({ data: { id: `demo-citizen-${i + 1}`, role: "CITIZEN", displayName: `Synthetic Citizen ${i + 1}`, isDemo: true } })),
  );
  const citizenIds = ["demo-citizen", ...citizens.map((c) => c.id)];

  // Historical resolution records (synthetic) → median resolution time per department
  const HIST_MEDIAN_HOURS: Record<string, number> = { roads: 18.4, water: 11.2, sanitation: 26.7, drainage: 30, streetlights: 22, electricity: 8, parks: 70, traffic: 20, infrastructure: 96, other: 48 };
  const historical = DEPARTMENTS.flatMap((d) =>
    Array.from({ length: 40 }, () => {
      const reportedAt = daysAgo(30 + Math.floor(rand() * 150));
      const hours = HIST_MEDIAN_HOURS[d.id] * (0.4 + rand() * 1.2);
      const ward = pick(WARDS).id;
      return { departmentId: d.id, categoryId: pick(d.categories).id, wardId: ward, reportedAt, resolvedAt: new Date(reportedAt.getTime() + hours * 3_600_000), status: "RESOLVED" };
    }),
  );
  await prisma.historicalRecord.createMany({ data: historical });

  let complaintSeq = 1;
  const ref = () => `C-${new Date().getFullYear()}-${String(complaintSeq++).padStart(5, "0")}`;

  async function triagedComplaint(text: string, opts: { mode?: InputMode; caption?: string; createdAt: Date; status: ComplaintStatus; issueId?: string; rejectionReason?: string }) {
    const t = await triageComplaint({ text, imageCaption: opts.caption });
    return prisma.complaint.create({
      data: {
        reference: ref(), reporterId: pick(citizenIds), status: opts.status, text, inputMode: opts.mode ?? "TEXT",
        imageCaption: opts.caption, imageUrl: opts.mode === "IMAGE" ? "/demo/photo-placeholder.svg" : null, createdAt: opts.createdAt,
        language: t.language, aiDepartmentId: t.classification.departmentId, categoryId: t.classification.categoryId,
        urgency: t.urgency.level, urgencyScore: t.urgency.score, urgencyReasons: t.urgency.reasons,
        localityId: t.locality ? localityIds.get(t.locality.localityName) : null, wardId: t.locality?.wardId,
        keyTerms: t.classification.keyTerms, aiConfidence: t.classification.confidence,
        aiExplanation: { department: t.classification.reason, urgency: t.urgency.reasons.join(", ") || "No safety risk or outage mentioned" },
        aiIsDemo: true, embedding: t.embedding, issueId: opts.issueId, rejectionReason: opts.rejectionReason,
        reviewedAt: opts.status === "PENDING_REVIEW" ? null : new Date(opts.createdAt.getTime() + 2 * 3_600_000),
        reviewedById: opts.status === "PENDING_REVIEW" ? null : `demo-authority-${t.classification.departmentId}`,
      },
    });
  }

  // Live issues + their complaint clusters
  let issueSeq = 1001;
  for (const s of ISSUES) {
    const created = daysAgo(s.ageDays, 3);
    const t = await triageComplaint({ text: s.reports[0], imageCaption: s.caption });
    const dept = DEPARTMENTS.find((d) => d.id === t.classification.departmentId)!;
    let reference = s.reference;
    if (!reference) {
      if (issueSeq === 1024) issueSeq++; // reserved for the demo issue
      reference = `TR-${issueSeq++}`;
    }
    const resolvedAt = s.status === "RESOLVED" ? new Date(created.getTime() + (s.resolvedAfterHours ?? 24) * 3_600_000) : null;

    const issue = await prisma.issue.create({
      data: {
        reference, title: s.title, summary: s.reports[0], departmentId: dept.id, categoryId: t.classification.categoryId,
        localityId: t.locality ? localityIds.get(t.locality.localityName) : null, wardId: t.locality?.wardId,
        urgency: t.urgency.level, urgencyScore: t.urgency.score, status: s.status,
        reportCount: s.reports.length, upvoteCount: s.upvotes,
        firstReportedAt: created, approvedAt: new Date(created.getTime() + 2 * 3_600_000), resolvedAt,
      },
    });

    await triagedComplaint(s.reports[0], { mode: s.mode, caption: s.caption, createdAt: created, status: "APPROVED", issueId: issue.id });
    for (let i = 1; i < s.reports.length; i++) {
      const at = new Date(created.getTime() + (i * s.ageDays * DAY) / (s.reports.length + 1));
      await triagedComplaint(s.reports[i], { createdAt: at, status: "MERGED_DUPLICATE", issueId: issue.id, rejectionReason: `This problem is already registered under Issue #${reference}.` });
    }

    const ticket = await prisma.ticket.create({
      data: {
        reference: ticketReference(reference), issueId: issue.id, departmentId: dept.id,
        status: s.status === "RESOLVED" ? "RESOLVED" : s.status === "IN_PROGRESS" ? "IN_PROGRESS" : "ASSIGNED",
        expectedResolution: new Date(created.getTime() + dept.slaHours * 3_600_000), medianHoursAtCreate: HIST_MEDIAN_HOURS[dept.id], createdAt: issue.approvedAt,
      },
    });

    const updates = [
      { status: "APPROVED" as const, note: "Verified by authority and published.", createdAt: issue.approvedAt },
      { status: "ASSIGNED" as const, note: `Ticket ${ticket.reference} created and assigned to ${dept.name}.`, createdAt: issue.approvedAt },
    ];
    if (s.status === "IN_PROGRESS" || s.status === "RESOLVED") updates.push({ status: "IN_PROGRESS" as never, note: "Field team has been assigned.", createdAt: new Date(created.getTime() + 6 * 3_600_000) });
    if (resolvedAt) updates.push({ status: "RESOLVED" as never, note: "Work completed.", createdAt: resolvedAt });
    await prisma.issueUpdate.createMany({ data: updates.map((u) => ({ ...u, issueId: issue.id })) });

    if (resolvedAt) await prisma.resolutionRecord.create({ data: { issueId: issue.id, note: "Work completed and verified by department.", resolvedAt } });
    if (s.explanation) {
      await prisma.authorityExplanation.create({ data: { issueId: issue.id, explanation: s.explanation, expectedResolution: new Date(now + 5 * DAY), createdAt: daysAgo(s.ageDays - 31) } });
    }
    if (reference === "TR-1024") {
      await prisma.message.createMany({
        data: [
          { issueId: issue.id, sender: "AUTHORITY", body: "Work has been assigned to the road maintenance team.", createdAt: daysAgo(14) },
          { issueId: issue.id, sender: "CITIZEN", body: "Problem is still present.", createdAt: daysAgo(6) },
          { issueId: issue.id, sender: "AUTHORITY", body: "Inspection scheduled; patch work material has been requested.", createdAt: daysAgo(5) },
        ],
      });
    }
  }

  // Pending complaints go through the same duplicate check as live submissions.
  const liveIssues = await prisma.issue.findMany({
    where: { resolvedAt: null },
    include: { locality: true, complaints: { where: { status: "APPROVED" }, take: 1 } },
  });
  const candidates = liveIssues.map((i) => ({
    issueId: i.id, reference: i.reference, embedding: i.complaints[0].embedding, categoryId: i.categoryId, departmentId: i.departmentId,
    localityId: i.localityId, wardId: i.wardId, lat: i.locality?.latitude, lng: i.locality?.longitude, resolvedAt: i.resolvedAt,
  }));
  for (const p of PENDING) {
    const c = await triagedComplaint(p.text, { mode: p.mode, caption: p.caption, createdAt: new Date(now - p.ageHours * 3_600_000), status: "PENDING_REVIEW" });
    const matches = findDuplicates(
      { embedding: c.embedding, categoryId: c.categoryId!, departmentId: c.aiDepartmentId!, localityId: c.localityId, wardId: c.wardId },
      candidates,
    ).slice(0, 3);
    if (matches.length) {
      await prisma.complaint.update({
        where: { id: c.id },
        data: {
          status: "DUPLICATE_REVIEW",
          duplicates: { create: matches.map(({ issueId, similarity, textScore, locationScore, categoryScore, timeScore }) => ({ issueId, similarity, textScore, locationScore, categoryScore, timeScore })) },
        },
      });
      console.log(`  duplicate review: "${p.text}" → ${matches[0].reference} (${Math.round(matches[0].similarity * 100)}%)`);
    }
  }
  for (const r of REJECTED) {
    await triagedComplaint(r.text, { createdAt: daysAgo(r.ageDays), status: "REJECTED", rejectionReason: r.reason });
  }

  const counts = { complaints: await prisma.complaint.count(), issues: await prisma.issue.count(), historical: await prisma.historicalRecord.count() };
  console.log("Done:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
