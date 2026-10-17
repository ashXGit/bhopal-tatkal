"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJSON } from "@/lib/client";

function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run(url: string, body: unknown, after?: (r: Record<string, unknown>) => void) {
    setBusy(true);
    setError(null);
    try {
      const r = await postJSON<Record<string, unknown>>(url, body);
      after?.(r);
      router.refresh();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, run };
}

export function UpvoteButton({ reference, upvotes }: { reference: string; upvotes: number }) {
  const { busy, error, run } = useAction();
  const [count, setCount] = useState(upvotes);
  const [voted, setVoted] = useState(false);
  return (
    <div>
      <button
        disabled={busy}
        onClick={() => run(`/api/issues/${reference}/upvote`, {}, (r) => {
          const next = r.upvotes as number;
          setCount(next);
          setVoted(next > count);
        })}
        aria-label={`Upvote, ${count} upvotes`}
        aria-pressed={voted}
        className={`group flex flex-col items-center rounded-lg border-2 px-4 py-2 font-bold transition-all select-none
          ${
            voted
              ? "border-orange-500 bg-orange-50 text-orange-500"
              : "border-line bg-surface text-muted hover:border-orange-400 hover:text-orange-400"
          } disabled:opacity-50`}
      >
        {/* Reddit-style upvote arrow */}
        <svg
          viewBox="0 0 24 24"
          width="22" height="22"
          fill={voted ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform group-hover:scale-110 group-active:scale-95"
          aria-hidden
        >
          <path d="M12 4L3 13h5v7h8v-7h5L12 4z" />
        </svg>
        <span className="mt-0.5 text-sm font-bold tabular-nums">{count}</span>
      </button>
      {error && <p className="mt-1 text-sm text-urgency-critical">{error}</p>}
    </div>
  );
}

export function MessageForm({ reference }: { reference: string }) {
  const { busy, error, run } = useAction();
  const [body, setBody] = useState("");
  return (
    <form onSubmit={async (e) => { e.preventDefault(); if (await run(`/api/issues/${reference}/messages`, { body })) setBody(""); }} className="mt-3 flex gap-2">
      <input value={body} onChange={(e) => setBody(e.target.value)} required placeholder="Write a message…" aria-label="Message"
        className="min-h-12 flex-1 rounded-full border border-line bg-surface px-4" />
      <button disabled={busy} className="rounded-full bg-ink px-5 font-bold text-white">Send</button>
      {error && <p className="text-sm text-urgency-critical">{error}</p>}
    </form>
  );
}

export function AuthorityPanel({ reference, status, explanationDue }: { reference: string; status: string; explanationDue: boolean }) {
  const { busy, error, run } = useAction();
  const [next, setNext] = useState(status === "RESOLVED" ? "RESOLVED" : "IN_PROGRESS");
  const [note, setNote] = useState("");
  const [exp, setExp] = useState("");
  const [date, setDate] = useState("");
  const [action, setAction] = useState("");
  const input = "w-full rounded-xl border border-line bg-white p-3";

  return (
    <section className="rounded-3xl border border-civic-100 bg-civic-50 p-5">
      <h2 className="font-bold">🏛️ Authority actions</h2>

      {explanationDue && (
        <form className="mt-3 space-y-2 rounded-2xl border border-red-200 bg-white p-4"
          onSubmit={(e) => { e.preventDefault(); run(`/api/issues/${reference}/explanation`, { explanation: exp, expectedResolution: date, actionNote: action || undefined }); }}>
          <p className="font-bold text-urgency-critical">⚠️ Formal explanation required: unresolved for over 30 days.</p>
          <textarea value={exp} onChange={(e) => setExp(e.target.value)} required rows={3} placeholder="Explain why this is still unresolved…" aria-label="Explanation" className={input} />
          <label className="block text-sm font-semibold">Expected resolution date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={input} />
          </label>
          <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="Optional: action taken / update" aria-label="Action update" className={input} />
          <button disabled={busy} className="rounded-full bg-ink px-5 py-2.5 font-bold text-white">Publish Explanation</button>
        </form>
      )}

      {status !== "RESOLVED" && (
        <form className="mt-3 space-y-2" onSubmit={(e) => { e.preventDefault(); run(`/api/issues/${reference}/status`, { status: next, note }); }}>
          <div className="flex flex-wrap gap-2">
            {["ASSIGNED", "IN_PROGRESS", "RESOLVED"].map((s) => (
              <button type="button" key={s} onClick={() => setNext(s)} aria-pressed={next === s}
                className={`rounded-full border px-4 py-2 text-sm font-semibold ${next === s ? "border-ink bg-ink text-white" : "border-line bg-white"}`}>
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} required={next === "RESOLVED"} aria-label="Update note"
            placeholder={next === "RESOLVED" ? "Resolution note (required)" : "Update note (public)"} className={input} />
          <button disabled={busy} className="rounded-full bg-ink px-5 py-2.5 font-bold text-white">Update Status</button>
        </form>
      )}
      {error && <p role="alert" className="mt-2 text-urgency-critical">{error}</p>}
    </section>
  );
}
