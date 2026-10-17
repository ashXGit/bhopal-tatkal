"use client";

import { useState } from "react";
import { RedditUpvoteIcon } from "@/components/ui/RedditIcons";
import { postJSON } from "@/lib/client";

export function CardUpvoteButton({
  reference,
  initialUpvotes,
}: {
  reference: string;
  initialUpvotes: number;
}) {
  const [count, setCount] = useState(initialUpvotes);
  const [voted, setVoted] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;

    // Optimistic toggle
    const nextVoted = !voted;
    setVoted(nextVoted);
    setCount((c) => (nextVoted ? c + 1 : Math.max(0, c - 1)));
    setBusy(true);

    try {
      const res = await postJSON<{ upvoted: boolean; upvotes: number }>(
        `/api/issues/${reference}/upvote`,
        {}
      );
      if (res && typeof res.upvotes === "number") {
        setCount(res.upvotes);
        setVoted(res.upvoted);
      }
    } catch (err) {
      // Revert optimistic update on failure
      setVoted(!nextVoted);
      setCount((c) => (nextVoted ? Math.max(0, c - 1) : c + 1));
      console.error("Failed to upvote:", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={`Upvote issue #${reference}, ${count} upvotes`}
      aria-pressed={voted}
      title={voted ? "Remove upvote" : "Upvote"}
      className={`group inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-bold transition-all duration-150 select-none cursor-pointer active:scale-95 ${
        voted
          ? "border-vote bg-vote/10 text-vote shadow-sm"
          : "border-ink/30 bg-white text-ink shadow-sm hover:border-vote hover:text-vote"
      }`}
    >
      <RedditUpvoteIcon
        filled={voted}
        className={`w-4 h-4 shrink-0 transition-transform duration-150 group-hover:-translate-y-0.5 group-active:translate-y-0 ${
          voted ? "text-vote" : "text-ink group-hover:text-vote"
        }`}
      />
      <span className="tabular-nums font-extrabold">{count}</span>
    </button>
  );
}
