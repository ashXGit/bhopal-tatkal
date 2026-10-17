import Link from "next/link";
import { getSession } from "@/lib/auth/current-user";
import { getDashboard } from "@/lib/services/queries";
import { daysUnresolved } from "@/lib/scoring/accountability";

const card = "rounded-3xl border border-line bg-surface p-5";

export async function Dashboard({ cityWide = false }: { cityWide?: boolean }) {
  const s = await getSession();
  const dept = !cityWide && s?.role === "AUTHORITY" ? s.departmentId : undefined;
  const d = await getDashboard(dept);
  const mine = d.perDept.find((x) => x.dept.id === dept);
  const fmtDate = (x: Date) => x.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const weekStart = new Date(Date.now() - 6 * 86_400_000);

  const counters = [
    { label: "Pending Review", value: d.pendingReview, href: "/authority/review" },
    { label: "Resolved This Week", value: d.resolvedThisWeek },
    { label: "Overdue", value: d.overdue },
    { label: "30+ Day Issues", value: d.over30.length, alert: d.over30.length > 0 },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">{cityWide ? "City Overview" : "Authority Dashboard"}</h1>
        <p className="text-muted">{mine ? `${mine.dept.name} Department` : "All departments"} · demo data</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {counters.map((c) => {
          const body = (
            <div className={`h-full rounded-3xl border-2 p-5 text-center ${c.alert ? "border-red-200 bg-red-50" : "border-leaf-100 bg-gradient-to-b from-white to-leaf-50"}`}>
              <div className="text-4xl font-extrabold">{c.value}</div>
              <div className="mt-1 text-sm text-muted">{c.label}</div>
            </div>
          );
          return c.href ? <Link key={c.label} href={c.href}>{body}</Link> : <div key={c.label}>{body}</div>;
        })}
      </div>

      {d.explanationDue.length > 0 && (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-5">
          <h2 className="font-bold text-urgency-critical">⚠️ Formal explanation required</h2>
          <ul className="mt-2 space-y-1">
            {d.explanationDue.map((i) => (
              <li key={i.reference}>
                <Link href={`/issues/${i.reference}`} className="font-semibold underline">#{i.reference} {i.title}</Link>: unresolved for {daysUnresolved(i.firstReportedAt)} days
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={card} id="digest">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">Weekly Digest · {fmtDate(weekStart)} – {fmtDate(new Date())}</p>
          <h2 className="mt-1 text-xl font-extrabold">{mine ? mine.dept.name : "All Departments"}</h2>
          <dl className="mt-3 divide-y divide-line text-sm">
            {[
              ["Complaints Received", d.week.received],
              ["Approved", d.week.approved],
              ["Rejected", d.week.rejected],
              ["Repeat complaints (merged)", d.week.merged],
              ["Pending review", d.week.pending],
              ["Resolved", d.resolvedThisWeek],
              ["Median Resolution", mine?.metrics.medianResolutionHours != null ? `${mine.metrics.medianResolutionHours} hrs` : "see leaderboard"],
              ["Top Locality", d.topLocality],
              ["30+ Day Issues", d.over30.length],
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between py-2"><dt className="text-muted">{k}</dt><dd className="font-bold">{v}</dd></div>
            ))}
          </dl>
        </section>

        <section className={card}>
          <h2 className="text-xl font-extrabold">{mine ? "Authority Performance" : "Department Performance"}</h2>
          {mine ? (
            <>
              <p className="mt-2 text-5xl font-extrabold">{mine.score}<span className="text-xl text-muted"> / 100</span></p>
              <dl className="mt-3 divide-y divide-line text-sm">
                {[
                  ["Resolution Rate", `${Math.round(mine.resolutionRate * 100)}%`],
                  ["Median Resolution", mine.metrics.medianResolutionHours != null ? `${mine.metrics.medianResolutionHours} hrs` : "—"],
                  ["Pending", mine.metrics.pending],
                  ["Overdue", mine.metrics.overdue],
                  ["30+ Days", mine.metrics.over30Days],
                ].map(([k, v]) => <div key={k as string} className="flex justify-between py-2"><dt className="text-muted">{k}</dt><dd className="font-bold">{v}</dd></div>)}
              </dl>
              <p className="mt-2 text-xs text-muted">A department indicator, not a ranking of individual employees.</p>
            </>
          ) : (
            <ol className="mt-3 space-y-2">
              {d.perDept.map((x, idx) => (
                <li key={x.dept.id} className="flex items-center gap-3 rounded-2xl bg-page p-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm font-black text-white">{idx + 1}</span>
                  <span className="flex-1 font-semibold">{x.dept.icon} {x.dept.name}</span>
                  <span className="text-xs text-muted">{Math.round(x.resolutionRate * 100)}% · {x.metrics.medianResolutionHours ?? "—"}h · {x.metrics.pending} pending</span>
                  <span className="text-lg font-extrabold">{x.score}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
