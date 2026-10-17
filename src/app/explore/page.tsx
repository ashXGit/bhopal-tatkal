import Link from "next/link";
import { IssueCard } from "@/components/issue/IssueCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { listPublicIssues } from "@/lib/services/issues";

export const dynamic = "force-dynamic";

const SORTS = [
  { key: "priority", label: "⭐ High Priority" },
  { key: "upvotes", label: "👍 Most Upvoted" },
  { key: "oldest", label: "⏳ Longest Unresolved" },
  { key: "urgency", label: "🔴 Most Urgent" },
  { key: "recent", label: "🆕 New" },
] as const;

const DAY_FILTERS = ["<3", "3-7", "7-15", "15-30", "30+"] as const;

type SP = Record<string, string | undefined>;

function hrefWith(sp: SP, patch: SP) {
  const merged: SP = { ...sp, ...patch, page: undefined };
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
  return `/explore?${next.toString()}`;
}

export default async function ExplorePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const sort = sp.sort ?? "priority";

  let data: Awaited<ReturnType<typeof listPublicIssues>> | null = null;
  try {
    data = await listPublicIssues({ ...sp, sort, status: sp.status ?? "OPEN" });
  } catch (err) {
    console.error("[explore]", err);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-bold">Explore Issues</h1>

      <form action="/explore" className="mt-4 flex gap-2" role="search">
        <label htmlFor="q" className="sr-only">Search issues</label>
        <input id="q" name="q" defaultValue={sp.q} placeholder="Search: TR-1024, MP Nagar, pothole, pani…" className="min-h-12 flex-1 rounded-xl border border-line bg-white px-4" />
        <input type="hidden" name="sort" value={sort} />
        <button className="min-h-12 rounded-xl bg-civic-600 px-5 font-semibold text-white">Search</button>
      </form>

      <nav aria-label="Sort issues" className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {SORTS.map((s) => (
          <Link key={s.key} href={hrefWith(sp, { sort: s.key })} aria-current={sort === s.key ? "page" : undefined}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold ${sort === s.key ? "border-civic-600 bg-civic-600 text-white" : "border-line bg-white"}`}>
            {s.label}
          </Link>
        ))}
      </nav>

      <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Days unresolved">
        <span className="text-sm text-muted">Unresolved:</span>
        {DAY_FILTERS.map((d) => (
          <Link key={d} href={hrefWith(sp, { days: sp.days === d ? undefined : d })} aria-current={sp.days === d ? "true" : undefined}
            className={`rounded-full border px-3 py-1 text-sm ${sp.days === d ? "border-civic-600 bg-civic-50 font-semibold text-civic-700" : "border-line bg-white"} ${d === "30+" ? "border-red-300 font-semibold text-urgency-critical" : ""}`}>
            {d === "30+" ? "⚠️ 30+ days" : `${d} days`}
          </Link>
        ))}
      </div>

      <div className="mt-5 grid gap-4">
        {data === null ? (
          <EmptyState icon="⚠️" title="Issues could not be loaded right now." hint="Please refresh the page in a moment." />
        ) : data.items.length === 0 ? (
          <EmptyState title="No issues here yet." />
        ) : (
          data.items.map((i) => <IssueCard key={i.reference} issue={i} />)
        )}
      </div>
    </div>
  );
}
