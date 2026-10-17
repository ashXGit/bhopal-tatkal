"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJSON } from "@/lib/client";
import type { ReviewItem } from "@/lib/services/queries";

type Cat = { id: string; name: string; departmentId: string };
const pct = (x: number) => `${Math.round(x * 100)}%`;

export function ReviewCard({ c, categories }: { c: ReviewItem; categories: Cat[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "reject" | "correct">("idle");
  const [reason, setReason] = useState("");
  const [title, setTitle] = useState(c.category?.name ?? "Civic issue");
  const [categoryId, setCategoryId] = useState(c.categoryId ?? "other");
  const [urgency, setUrgency] = useState(c.urgency ?? "MEDIUM");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const dup = c.duplicates[0];
  const ai = (c.aiExplanation ?? {}) as { department?: string; urgency?: string };

  async function act(url: string, body: unknown, msg: (r: Record<string, string>) => string) {
    setBusy(true);
    setError(null);
    try {
      const r = await postJSON<Record<string, string>>(url, body);
      setDone(msg(r));
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const base = `/api/authority/complaints/${c.id}`;
  const approve = (corrected: boolean) =>
    act(`${base}/approve`, corrected ? { title, categoryId, departmentId: categories.find((x) => x.id === categoryId)?.departmentId, urgency } : { title },
      (r) => `✅ Published as ${r.issue} · Ticket ${r.ticket} created`);

  if (done) return <div className="rounded-3xl border border-leaf-100 bg-leaf-50 p-5 font-semibold text-leaf-600">{done}</div>;

  return (
    <article className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-muted">NEW COMPLAINT · {c.reference} · {c.inputMode === "VOICE" ? "🎙️ Voice" : c.inputMode === "IMAGE" ? "📷 Image" : "✍️ Text"}</span>
        {c.aiIsDemo && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">Demo AI</span>}
      </div>
      <p className="mt-2 text-lg font-semibold">“{c.text}”</p>
      {c.imageCaption && <p className="text-sm text-muted">📷 Caption: {c.imageCaption}</p>}

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {[
          `🏢 ${c.aiDepartmentId} → ${c.category?.name ?? "—"}`,
          `⚠️ ${c.urgency} · ${c.urgencyScore}/100`,
          `📍 ${c.locality?.name ?? "Unknown"}${c.wardId ? ` · Ward ${c.wardId}` : ""}`,
          `🤖 AI Confidence ${c.aiConfidence != null ? pct(c.aiConfidence) : "—"}`,
          `🗣️ ${c.language}`,
        ].map((t) => <span key={t} className="rounded-full border border-line px-3 py-1">{t}</span>)}
      </div>
      <p className="mt-3 text-sm"><b>AI Reason:</b> {ai.department}</p>
      {c.urgencyReasons.length > 0 && <p className="text-sm"><b>Urgency:</b> {c.urgencyReasons.join(" · ")}</p>}
      <p className="text-sm text-muted">Key terms: {c.keyTerms.join(", ")}</p>

      {dup && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-bold text-amber-900">⚠️ POSSIBLE DUPLICATE · {pct(dup.similarity)} similarity with #{dup.issue.reference}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-white p-3 text-sm"><b>New complaint</b><p className="mt-1">{c.text}</p></div>
            <div className="rounded-xl bg-white p-3 text-sm">
              <b>Existing live issue #{dup.issue.reference}</b>
              <p className="mt-1">{dup.issue.title}: {dup.issue.summary}</p>
              <p className="mt-1 text-muted">👥 {dup.issue.reportCount} reports · 👍 {dup.issue.upvoteCount}</p>
            </div>
          </div>
          <ul className="mt-3 flex flex-wrap gap-2 text-sm">
            <li className="rounded-full bg-white px-3 py-1">Text {pct(dup.textScore)}</li>
            <li className="rounded-full bg-white px-3 py-1">Same locality {dup.locationScore === 1 ? "✓" : pct(dup.locationScore)}</li>
            <li className="rounded-full bg-white px-3 py-1">Same category {dup.categoryScore === 1 ? "✓" : "✗"}</li>
            <li className="rounded-full bg-white px-3 py-1">Still open {dup.timeScore === 1 ? "✓" : "✗"}</li>
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <button disabled={busy} onClick={() => act(`${base}/duplicate`, { decision: "SAME_ISSUE", issueId: dup.issue.id }, () => `🔗 Merged into #${dup.issue.reference}. Reporter notified, report count +1.`)}
              className="rounded-full bg-ink px-5 py-2.5 font-bold text-white">Same Issue</button>
            <button disabled={busy} onClick={() => act(`${base}/duplicate`, { decision: "DIFFERENT_ISSUE" }, () => "Marked as different issue. Moved to normal review.")}
              className="rounded-full border border-line bg-white px-5 py-2.5 font-semibold">Different Issue</button>
          </div>
        </div>
      )}

      {!dup && mode === "idle" && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button disabled={busy} onClick={() => approve(false)} className="rounded-full bg-ink px-6 py-2.5 font-bold text-white">Approve</button>
          <button onClick={() => setMode("correct")} className="rounded-full border border-line px-5 py-2.5 font-semibold">Correct &amp; Approve</button>
          <button onClick={() => setMode("reject")} className="rounded-full border border-red-200 px-5 py-2.5 font-semibold text-urgency-critical">Reject</button>
        </div>
      )}

      {!dup && mode !== "idle" && (
        <div className="mt-4 space-y-2 rounded-2xl bg-page p-4">
          {mode === "reject" ? (
            <>
              <label className="font-semibold" htmlFor={`r-${c.id}`}>Why are you rejecting this? (shown to the citizen)</label>
              <textarea id={`r-${c.id}`} value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="w-full rounded-xl border border-line p-3"
                placeholder="This complaint does not contain enough information to verify the location." />
              <button disabled={busy} onClick={() => act(`${base}/reject`, { reason }, () => "Rejected. The citizen can see your reason.")} className="rounded-full bg-urgency-critical px-5 py-2.5 font-bold text-white">Confirm Reject</button>
            </>
          ) : (
            <>
              <input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Public title" className="w-full rounded-xl border border-line p-3" />
              <div className="flex flex-wrap gap-2">
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} aria-label="Category" className="rounded-xl border border-line p-3">
                  {categories.map((x) => <option key={x.id} value={x.id}>{x.departmentId} → {x.name}</option>)}
                </select>
                <select value={urgency} onChange={(e) => setUrgency(e.target.value as typeof urgency)} aria-label="Urgency" className="rounded-xl border border-line p-3">
                  {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
              <button disabled={busy} onClick={() => approve(true)} className="rounded-full bg-ink px-5 py-2.5 font-bold text-white">Save &amp; Approve</button>
            </>
          )}
          <button onClick={() => setMode("idle")} className="ml-2 text-sm text-muted underline">Cancel</button>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-urgency-critical">{error}</p>}
    </article>
  );
}
