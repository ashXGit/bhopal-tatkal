# Bhopal Tatkal: the City's Complaint Queue

A prototype civic complaint queue for Bhopal with AI-assisted triage. It turns text, voice and photo complaints written in Hindi, Hinglish or English into verified civic issues. Along the way it detects duplicates, resolves informal locations to wards, scores urgency, routes each issue to an accountable department, and tracks how quickly problems get resolved.

> **Prototype:** every dataset here is demo/synthetic. The app is **not** connected to CM Helpline 181, BMC, or any other government system.

See [docs/MVP.md](docs/MVP.md) for the product scope and how it maps to the code.

## Stack
Next.js 15 (App Router) · React 19 · Tailwind CSS 4 · PostgreSQL + Prisma 6 · Zod · signed-cookie RBAC

## Quick start

```bash
cp .env.example .env            # then set AUTH_SECRET
docker compose up -d            # local PostgreSQL (or point DATABASE_URL at any Postgres)
npm install
npx prisma migrate deploy       # apply prisma/migrations
npm run db:seed                 # demo data (~75 complaints, 24 issues, TR-1024 demo scenario)
npm run dev                     # http://localhost:3000
```

Open **/login** (only available while `DEMO_MODE=true`) to switch between the demo accounts: Citizen, Authority (Roads), Zone Officer and Admin.

Run `npm run check:pipeline` to see the demo AI working on sample complaints. It needs no database.

## Environment

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AI_PROVIDER` | `demo` (default, offline, deterministic). Other providers plug in through `src/lib/ai/provider.ts` |
| `AI_API_KEY` | Key for the LLM provider. If this is empty, the app falls back to demo AI |
| `AUTH_SECRET` | Session signing secret, 32+ characters, **required in production** |
| `DEMO_MODE` | `true` shows the demo banner and role switcher |

## Project layout

```
prisma/            schema.prisma, migrations/, seed.ts
src/lib/
  ai/              language detection, demo classifier, embeddings, provider registry, pipeline
  scoring/         urgency, ranking, 30-day accountability, authority score, median stats
  duplicates/      similarity scoring (threshold 0.80)
  locality/        gazetteer resolver (aliases, landmarks, GPS)
  reference/       default departments/categories/keywords and the Bhopal gazetteer (synthetic)
  services/        complaints (intake), review (approve/reject/duplicate), issues (public listing), events
  privacy/         toPublicIssue: the only public shape of an issue
  auth/            roles + route access, HMAC session, server guards
  i18n/            English / Hinglish / Hindi UI strings
src/app/           pages (citizen, /authority, /admin) and /api routes
src/components/    IssueCard, badges, layout, empty states
```

## Deploy on Vercel
1. Push the `bhopal-tatkal` folder to GitHub, then import it in Vercel. If the repo root is a parent folder, set **Root Directory** to `bhopal-tatkal`.
2. In the Vercel project, open **Storage → Create Database → Neon (Postgres)** and connect it. This sets `DATABASE_URL` and `DATABASE_URL_UNPOOLED` automatically.
3. Under **Settings → Environment Variables**, add `AUTH_SECRET` (32+ random characters), `DEMO_MODE=true` and `AI_PROVIDER=demo`.
4. Deploy. The build runs `vercel-build`, which applies the migrations automatically.
5. Load the demo data once from your machine (PowerShell), using the Neon URLs:
   ```powershell
   $env:DATABASE_URL="<neon pooled url>"; $env:DATABASE_URL_UNPOOLED="<neon direct url>"; npm run db:seed
   ```
6. Check `https://<your-app>.vercel.app/api/health`. It should report `"database":"ok"`.
