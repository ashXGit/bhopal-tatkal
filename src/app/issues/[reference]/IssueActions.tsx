"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { postJSON } from "@/lib/client";
import { RedditUpvoteIcon, RedditDownvoteIcon } from "@/components/ui/RedditIcons";

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

  const handleUpvote = () => {
    run(`/api/issues/${reference}/upvote`, {}, (r) => {
      const next = r.upvotes as number;
      setCount(next);
      setVoted(next > count);
    });
  };

  const handleDownvote = () => {
    if (voted) {
      handleUpvote();
    }
  };

  return (
    <div className="inline-flex flex-col">
      <div
        className={`inline-flex items-center rounded-full border transition-all duration-200 select-none shadow-sm ${
          voted
            ? "bg-vote/10 border-vote/40 text-vote"
            : "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/80 dark:hover:bg-neutral-700/80"
        }`}
      >
        {/* Reddit Upvote Arrow Button */}
        <button
          type="button"
          disabled={busy}
          onClick={handleUpvote}
          aria-label={`Upvote, ${count} upvotes`}
          aria-pressed={voted}
          title={voted ? "Remove upvote" : "Upvote"}
          className={`group flex items-center justify-center p-2 rounded-full transition-all duration-150 active:scale-90 ${
            voted
              ? "text-vote hover:bg-vote/20"
              : "text-neutral-500 dark:text-neutral-400 hover:text-vote hover:bg-black/5 dark:hover:bg-white/10"
          }`}
        >
          <RedditUpvoteIcon
            filled={voted}
            className="w-5 h-5 transition-transform group-hover:-translate-y-0.5 group-active:translate-y-0"
          />
        </button>

        {/* Upvote Count */}
        <span
          className={`px-1.5 text-sm font-bold tabular-nums min-w-[20px] text-center select-none transition-colors ${
            voted ? "text-vote" : "text-neutral-800 dark:text-neutral-200"
          }`}
        >
          {count}
        </span>

        {/* Reddit Downvote Arrow Button */}
        <button
          type="button"
          disabled={busy || !voted}
          onClick={handleDownvote}
          aria-label="Downvote"
          title={voted ? "Cancel upvote" : "Civic issues can only be upvoted"}
          className={`group flex items-center justify-center p-2 rounded-full transition-all duration-150 ${
            voted
              ? "text-neutral-500 hover:text-civic-600 hover:bg-black/5 active:scale-90 cursor-pointer"
              : "text-neutral-300 dark:text-neutral-600 cursor-not-allowed opacity-50"
          }`}
        >
          <RedditDownvoteIcon
            filled={false}
            className="w-5 h-5 transition-transform group-hover:translate-y-0.5 group-active:translate-y-0"
          />
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-urgency-critical">{error}</p>}
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
