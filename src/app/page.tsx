import Link from "next/link";
import { getDict } from "@/lib/i18n/server";
import { publicStats } from "@/lib/services/issues";

export const dynamic = "force-dynamic";

async function safeStats() {
  try {
    return await publicStats();
  } catch (err) {
    console.error("[home] stats unavailable", err);
    return null;
  }
}

export default async function HomePage() {
  const [{ t }, stats] = await Promise.all([getDict(), safeStats()]);

  const statCards = [
    { label: t.statReported,  value: stats?.reported,  suffix: "" },
    { label: t.statResolved,  value: stats?.resolved,  suffix: "" },
    { label: t.statPending,   value: stats?.pending,   suffix: "" },
    { label: t.statAttention, value: stats?.attention, suffix: "" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4">

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-start gap-6 pt-14 pb-12 sm:flex-row sm:items-center sm:gap-12 sm:pt-20">

        {/* Left copy */}
        <div className="flex-1">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
            Fastest way to fix<br />
            <span className="text-civic-600">Bhopal&rsquo;s civic issues</span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-muted">
            {t.subtext}
          </p>

          {/* CTA row */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/report"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-base font-bold text-white shadow-sm hover:bg-civic-700 active:scale-95"
            >
              📢 {t.report}
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-7 py-3.5 text-base font-semibold text-ink hover:bg-civic-50 active:scale-95"
            >
              🗺️ {t.explore}
            </Link>
          </div>

          <p className="mt-4 text-sm text-muted">
            <Link href="/my-issues" className="underline underline-offset-2 hover:text-ink">
              {t.track}
            </Link>{" "}
            — track your submitted complaints
          </p>
        </div>

        {/* Right — floating issue cards (visual accent blob) */}
        <div className="relative hidden sm:flex items-center justify-center flex-shrink-0 w-72 h-64">
          {/* Lavender blob background */}
          <div className="absolute inset-0 rounded-3xl bg-accent-blob" />

          {/* Floating issue card 1 */}
          <div className="absolute top-6 right-4 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-md text-sm font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-base">🚧</span>
            <div>
              <div className="text-xs text-muted">Road Damage</div>
              <div className="text-xs font-bold text-urgency-medium">In Progress</div>
            </div>
          </div>

          {/* Floating issue card 2 */}
          <div className="absolute bottom-10 left-4 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 shadow-md text-sm font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-leaf-100 text-base">✅</span>
            <div>
              <div className="text-xs text-muted">Streetlight</div>
              <div className="text-xs font-bold text-leaf-600">Resolved</div>
            </div>
          </div>

          {/* Floating tag */}
          <div className="absolute top-20 left-6 rounded-full bg-civic-600 px-3 py-1 text-xs font-bold text-white shadow">
            AI Triaged
          </div>
        </div>
      </section>

      {/* ── Trusted by strip ── */}
      <div className="border-y border-line py-4 text-center text-xs font-semibold uppercase tracking-widest text-muted">
        Prototype · Demo data only · Not connected to any government system
      </div>

      {/* ── Stats ── */}
      <section
        aria-label="City statistics"
        className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {statCards.map((s) => (
          <div
            key={s.label}
            className="rounded-3xl border-2 border-leaf-100 bg-gradient-to-b from-white to-leaf-50 p-5 text-center"
          >
            <div className="text-3xl font-extrabold text-ink">
              {s.value ?? "—"}
              {s.value != null && s.suffix}
            </div>
            <div className="mt-1 text-sm text-muted">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── Why choose us ── */}
      <section className="mt-12">
        <h2 className="text-2xl font-extrabold text-ink">Why Bhopal Tatkal?</h2>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { icon: "🤖", title: "AI-Assisted Triage",      desc: "Every report is instantly categorised, prioritised and routed to the right authority." },
            { icon: "📍", title: "Location-Aware",           desc: "Geo-pin your issue on the map so ward officers can find it in seconds." },
            { icon: "🔔", title: "Real-Time Updates",         desc: "Get notified at every status change — no more wondering if anyone cares." },
            { icon: "🏛️", title: "Authority Accountability", desc: "All responses are logged publicly. Officials are held to resolution timelines." },
          ].map((f) => (
            <div key={f.title} className="flex gap-3 rounded-2xl border border-line bg-surface p-5 hover:shadow-sm transition-shadow">
              <span className="mt-0.5 text-2xl flex-shrink-0">{f.icon}</span>
              <div>
                <div className="font-bold text-ink">+ {f.title}</div>
                <div className="mt-1 text-sm text-muted">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="mt-12 mb-16 rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <h2 className="text-2xl font-extrabold text-ink">{t.howItWorks}</h2>
        <p className="mt-1 text-sm text-muted font-medium">{t.promise}</p>

        <ol className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {t.flow.map((step, i) => (
            <li key={step} className="flex gap-3 items-start">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-ink text-white text-sm font-black">
                {i + 1}
              </span>
              <span className="text-sm font-medium text-ink leading-snug pt-1">{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
