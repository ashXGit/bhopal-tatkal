# Bhopal Tatkal: MVP understanding

## The problem in one line
Complaints reach Bhopal's civic bodies in many forms and languages, with vague locations and lots of duplicates, and nobody can see who is accountable for which problem.

## The product in one line
**Many citizen complaints → one verified issue → one accountable department → measurable resolution.**

## Core workflow (every feature serves this)

```
REPORT → UNDERSTAND → CLASSIFY → CHECK DUPLICATE → NORMALISE LOCATION
       → AUTHORITY REVIEW → PUBLISH → CREATE TICKET → TRACK → RESOLVE → MEASURE ACCOUNTABILITY
```

| Stage | Where it lives |
|---|---|
| Report (text / voice / photo + caption / location) | `app/report`, `POST /api/complaints` |
| Understand + classify (language, dept, category, confidence, key terms) | `lib/ai/*` |
| Urgency (safety + outage + duration + sensitive place, 0-100) | `lib/scoring/urgency.ts` |
| Locality → ward (aliases, landmarks, GPS) | `lib/locality/resolve.ts`, `lib/reference/gazetteer.ts` |
| Duplicate check (text 50%, location 25%, category 15%, time 10%; ≥ 80% means human review) | `lib/duplicates/similarity.ts` |
| Authority review (approve / reject with reason / correct & approve / same-or-different issue) | `lib/services/review.ts`, `/api/authority/complaints/:id/*` |
| Publish (anonymised) | `lib/privacy/public-issue.ts` (allow-list mapper) |
| Ticket (internal only) | created in `approveComplaint` |
| Track: upvotes + days unresolved + priority | `lib/scoring/ranking.ts`, `lib/services/issues.ts` |
| 30-day rule ("Explanation Required") | `lib/scoring/accountability.ts` |
| Accountability (median resolution, authority score, digest) | `lib/scoring/stats.ts`, `lib/scoring/authority-score.ts` |

## Non-negotiable rules (enforced in code)
1. **Nothing is public before approval.** Complaints are private records; only `approveComplaint` creates an `Issue`.
2. **Reporter identity is never public.** Public data goes only through `toPublicIssue`, which always says "Anonymous Citizen".
3. **Rejections need a reason** of at least 10 characters (`rejectSchema`).
4. **Duplicate threshold is 0.80**, and the score is computed from real vectors and features, never invented.
5. **No live government integrations.** Data is seeded or imported only, and tickets stay inside the app.
6. **AI always works.** The deterministic demo AI is the fallback and is labelled "Demo AI Processing".

## Roles
- **Citizen**: report, track, upvote, message.
- **Authority** (per department): review queue, duplicate queue, status updates, 30-day explanations, digest, score.
- **Zone Officer / Admin**: city-wide view, leaderboard, departments/categories/gazetteer, dataset import, analytics.

## Build status
**Done (scaffold):** data model + migration, AI pipeline (demo provider), urgency, locality resolution, duplicate scoring, ranking, accountability rules, authority score, intake/review/listing services, API routes, signed-cookie RBAC + middleware, demo role switcher, seed script (demo scenario §61), landing page, Explore page, i18n dictionary, shared badges/IssueCard.

**Next, in priority order:**
1. Report flow UI (category icons, voice via Web Speech API, photo upload, location, AI result screen).
2. Authority Pending Review + Duplicate Queue screens (APIs already exist).
3. Issue detail page (timeline, updates, messages, explanation, resolution).
4. Status updates, resolution note, and the 30-day explanation API and forms.
5. My Issues, notifications, messages.
6. Authority dashboard, weekly digest, leaderboard, charts.
7. Admin: dataset import (CSV/JSON validation), department/gazetteer editors.
8. Optional LLM provider (`lib/ai/provider.ts`), with the demo layer kept as fallback.
