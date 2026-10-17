import Link from "next/link";
import type { PublicIssue } from "@/lib/privacy/public-issue";
import { StatusBadge, UrgencyBadge } from "./badges";
import { CardUpvoteButton } from "./CardUpvoteButton";

// Public issue card. Accepts only PublicIssue, which by construction carries no reporter identity.
export function IssueCard({ issue }: { issue: PublicIssue }) {
  const resolved = issue.status === "RESOLVED";
  const over30 = !resolved && issue.daysUnresolved > 30;
  return (
    <article className="rounded-3xl border border-line bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <span aria-hidden className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-civic-50 text-2xl">{issue.department.icon}</span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold leading-snug">{issue.title}</h3>
          <p className="text-sm text-muted">{issue.department.name} · #{issue.reference}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full border border-line px-3 py-1">📍 {issue.locality ?? "Location pending"}{issue.ward != null && ` · Ward ${issue.ward}`}</span>
        <UrgencyBadge level={issue.urgency} />
        <StatusBadge status={issue.status} />
        {issue.explanationRequired && <span className="rounded-full bg-red-50 px-3 py-1 font-semibold text-urgency-critical">⚠️ Explanation Required</span>}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4 font-bold">
          <CardUpvoteButton reference={issue.reference} initialUpvotes={issue.upvotes} />
          <span className={over30 ? "text-urgency-critical" : resolved ? "text-leaf-600" : ""}>
            ⏳ {issue.daysUnresolved}d {resolved ? "to resolve" : "unresolved"}
          </span>
          <span className="hidden text-muted sm:inline">👥 {issue.reports}</span>
        </div>
        <Link href={`/issues/${issue.reference}`} className="font-semibold text-civic-600 hover:underline">View →</Link>
      </div>
    </article>
  );
}
