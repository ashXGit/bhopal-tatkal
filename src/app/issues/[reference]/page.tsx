import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/current-user";
import { getIssueDetail } from "@/lib/services/queries";
import { LocationBadge, StatusBadge, UrgencyBadge } from "@/components/issue/badges";
import { AuthorityPanel, MessageForm, UpvoteButton } from "./IssueActions";

export const dynamic = "force-dynamic";

const STEPS = ["Reported", "AI Triaged", "Authority Review", "Approved", "Ticket Created", "Assigned", "In Progress", "Resolved"];
const STEP_INDEX: Record<string, number> = { APPROVED: 4, ASSIGNED: 5, IN_PROGRESS: 6, RESOLVED: 7 };
const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default async function IssuePage({ params }: { params: Promise<{ reference: string }> }) {
  const [{ reference }, session] = await Promise.all([params, getSession()]);
  const d = await getIssueDetail(reference);
  if (!d) notFound();
  const i = d.pub;
  const staff = session && session.role !== "CITIZEN";
  const reached = STEP_INDEX[i.status] ?? 4;

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-8">
      <Link href="/explore" className="text-sm text-muted hover:underline">← All issues</Link>

      <header className="rounded-3xl border border-line bg-surface p-6 shadow-sm">
        <p className="text-sm font-semibold text-muted">Issue #{i.reference}</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{i.department.icon} {i.title}</h1>
        <p className="mt-1"><LocationBadge locality={i.locality} ward={i.ward} /></p>
        <div className="mt-3 flex flex-wrap gap-2">
          <UrgencyBadge level={i.urgency} score={i.urgencyScore} />
          <StatusBadge status={i.status} />
          <span className="rounded-full border border-line px-3 py-1 text-sm">{i.department.name} · {i.category.name}</span>
        </div>

        {i.explanationRequired && (
          <p className="mt-4 rounded-2xl bg-red-50 p-3 font-semibold text-urgency-critical">
            ⚠️ Explanation Required: this issue has remained unresolved for over 30 days. An explanation is required.
          </p>
        )}

        {/* USP: the two core signals */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-leaf-100 bg-leaf-50 p-4">
            <div className="flex items-center gap-2 text-3xl font-extrabold text-orange-500">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" aria-hidden><path d="M12 4L3 13h5v7h8v-7h5L12 4z"/></svg>
              {i.upvotes}
            </div>
            <div className="text-sm text-muted">Upvotes</div>
          </div>
          <div className={`rounded-2xl border p-4 ${i.daysUnresolved > 30 ? "border-red-200 bg-red-50" : "border-leaf-100 bg-leaf-50"}`}>
            <div className="text-3xl font-extrabold">⏳ {i.daysUnresolved}</div>
            <div className="text-sm text-muted">{i.status === "RESOLVED" ? "days to resolve" : "days unresolved"}</div>
          </div>
        </div>
        <p className="mt-3 rounded-2xl bg-page p-3 text-center font-semibold">
          👥 {i.reports} citizen report{i.reports === 1 ? "" : "s"} → 1 civic incident
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {i.status !== "RESOLVED" && <UpvoteButton reference={i.reference} upvotes={i.upvotes} />}
          <span className="text-sm text-muted">Reported by {i.reportedBy}</span>
        </div>
      </header>

      {staff && <AuthorityPanel reference={i.reference} status={i.status} explanationDue={i.explanationRequired} />}

      {d.ticket && (
        <section className="rounded-3xl border border-line bg-surface p-5 text-sm">
          <h2 className="text-base font-bold">🎫 Internal ticket {d.ticket.reference}</h2>
          <p className="mt-1 text-muted">
            Assigned to {i.department.name} · Expected by {fmt(d.ticket.expectedResolution)}
            {d.ticket.medianHoursAtCreate != null && <> · Department median {d.ticket.medianHoursAtCreate} hrs</>}
          </p>
          <p className="mt-1 text-xs text-muted">Prototype ticket: exists only inside Bhopal Tatkal.</p>
        </section>
      )}

      <section className="rounded-3xl border border-line bg-surface p-5">
        <h2 className="font-bold">Progress Timeline</h2>
        <ol className="mt-3 flex flex-wrap gap-2">
          {STEPS.map((s, idx) => (
            <li key={s} className={`rounded-full px-3 py-1 text-sm font-semibold ${idx <= reached ? "bg-ink text-white" : "border border-line text-muted"}`}>
              {idx <= reached ? "✓ " : ""}{s}
            </li>
          ))}
        </ol>
        <ul className="mt-4 space-y-2 border-l-2 border-line pl-4 text-sm">
          {d.updates.map((u) => (
            <li key={u.id}><b>{fmt(u.createdAt)}</b>: {u.note}</li>
          ))}
        </ul>
      </section>

      {d.explanations.length > 0 && (
        <section className="rounded-3xl border border-line bg-surface p-5">
          <h2 className="font-bold">📄 Authority Explanation</h2>
          {d.explanations.map((e) => (
            <div key={e.id} className="mt-2 rounded-2xl bg-page p-3 text-sm">
              <p>{e.explanation}</p>
              {e.actionNote && <p className="mt-1">Action: {e.actionNote}</p>}
              <p className="mt-1 text-muted">Expected resolution: {fmt(e.expectedResolution)} · Published {fmt(e.createdAt)} by {i.department.name}</p>
            </div>
          ))}
        </section>
      )}

      {d.resolution && (
        <section className="rounded-3xl border border-leaf-100 bg-leaf-50 p-5">
          <h2 className="font-bold text-leaf-600">✅ Issue Resolved</h2>
          <p className="mt-1">{d.resolution.note}</p>
          <p className="text-sm text-muted">Resolved on {fmt(d.resolution.resolvedAt)}</p>
        </section>
      )}

      <section className="rounded-3xl border border-line bg-surface p-5">
        <h2 className="font-bold">💬 Messages</h2>
        {d.messages.length === 0 ? <p className="mt-2 text-muted">No messages yet.</p> : (
          <ul className="mt-3 space-y-2">
            {d.messages.map((m) => (
              <li key={m.id} className={`max-w-[85%] rounded-2xl p-3 text-sm ${m.sender === "AUTHORITY" ? "bg-civic-50" : "ml-auto bg-page"}`}>
                <b>{m.sender === "AUTHORITY" ? i.department.name : "Anonymous Citizen"}</b>
                <p>{m.body}</p>
              </li>
            ))}
          </ul>
        )}
        {session ? <MessageForm reference={i.reference} /> : <p className="mt-3 text-sm text-muted"><Link href="/login" className="underline">Log in</Link> to send a message.</p>}
      </section>
    </div>
  );
}
