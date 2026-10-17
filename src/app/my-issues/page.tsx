import Link from "next/link";
import { getSession } from "@/lib/auth/current-user";
import { getMyComplaints } from "@/lib/services/queries";
import { StatusBadge } from "@/components/issue/badges";
import { EmptyState } from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function MyIssues() {
  const s = await getSession();
  const items = s ? await getMyComplaints(s.userId) : [];
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">My Issues</h1>
      <div className="mt-6 space-y-3">
        {items.length === 0 && <EmptyState title="No issues here yet." hint="Report a problem to see it here." />}
        {items.map((c) => (
          <article key={c.reference} className="rounded-3xl border border-line bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-muted">{c.reference} · {c.createdAt.toLocaleDateString("en-IN")}</span>
              <StatusBadge status={c.status} />
            </div>
            <p className="mt-2 font-semibold">“{c.text}”</p>
            <p className="text-sm text-muted">{c.category?.name}</p>
            {c.rejectionReason && (
              <div className="mt-3 rounded-2xl bg-page p-3 text-sm">
                <b>{c.status === "REJECTED" ? "Why was this rejected?" : "Note from authority"}</b>
                <p>{c.rejectionReason}</p>
              </div>
            )}
            {c.issue && <Link href={`/issues/${c.issue.reference}`} className="mt-3 inline-block font-semibold text-civic-600">View issue #{c.issue.reference} →</Link>}
          </article>
        ))}
      </div>
    </div>
  );
}
