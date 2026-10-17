// Small presentational badges. Each pairs an icon with text so meaning never depends on colour alone.

const URGENCY_STYLE = {
  LOW: { icon: "🟢", label: "Low", cls: "bg-slate-100 text-urgency-low" },
  MEDIUM: { icon: "🟡", label: "Medium", cls: "bg-amber-50 text-urgency-medium" },
  HIGH: { icon: "🟠", label: "High", cls: "bg-orange-50 text-urgency-high" },
  CRITICAL: { icon: "🔴", label: "Critical", cls: "bg-red-50 text-urgency-critical" },
} as const;

export function UrgencyBadge({ level, score }: { level: keyof typeof URGENCY_STYLE; score?: number }) {
  const s = URGENCY_STYLE[level];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${s.cls}`}>
      <span aria-hidden>{s.icon}</span>
      {s.label} urgency{score != null && <span className="font-normal">· {score}/100</span>}
    </span>
  );
}

const STATUS_STYLE = {
  APPROVED: { icon: "✔️", label: "Verified", cls: "bg-civic-50 text-civic-700" },
  ASSIGNED: { icon: "📋", label: "Assigned", cls: "bg-civic-50 text-civic-700" },
  IN_PROGRESS: { icon: "🔧", label: "In Progress", cls: "bg-amber-50 text-urgency-medium" },
  RESOLVED: { icon: "✅", label: "Resolved", cls: "bg-leaf-50 text-leaf-600" },
  PENDING_REVIEW: { icon: "⏳", label: "Pending Authority Review", cls: "bg-slate-100 text-muted" },
  DUPLICATE_REVIEW: { icon: "⚠️", label: "Possible Duplicate — under review", cls: "bg-amber-50 text-urgency-medium" },
  REJECTED: { icon: "✖️", label: "Rejected by Authority", cls: "bg-red-50 text-urgency-critical" },
  MERGED_DUPLICATE: { icon: "🔗", label: "Added to existing issue", cls: "bg-civic-50 text-civic-700" },
} as const;

export function StatusBadge({ status }: { status: keyof typeof STATUS_STYLE }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${s.cls}`}>
      <span aria-hidden>{s.icon}</span>
      {s.label}
    </span>
  );
}

export function LocationBadge({ locality, ward }: { locality: string | null; ward: number | null }) {
  if (!locality && ward == null) return <span className="text-muted">📍 Location not confirmed</span>;
  return (
    <span className="text-muted">
      <span aria-hidden>📍 </span>
      {[locality, ward != null ? `Ward ${ward}` : null].filter(Boolean).join(" · ")}
    </span>
  );
}

export function UnresolvedDaysCounter({ days, resolved }: { days: number; resolved?: boolean }) {
  if (resolved) return <span className="font-semibold text-leaf-600">✅ Resolved in {days} day{days === 1 ? "" : "s"}</span>;
  const over30 = days > 30;
  return (
    <span className={`font-semibold ${over30 ? "rounded-md bg-red-50 px-2 py-0.5 text-urgency-critical" : "text-ink"}`}>
      <span aria-hidden>⏳ </span>
      {over30 && "30+ · "}Unresolved for {days} day{days === 1 ? "" : "s"}
    </span>
  );
}
