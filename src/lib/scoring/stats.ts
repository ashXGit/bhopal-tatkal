export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function resolutionHours(reportedAt: Date, resolvedAt: Date): number {
  return (resolvedAt.getTime() - reportedAt.getTime()) / 3_600_000;
}

/** Median resolution hours grouped by a key (department / category / ward). */
export function medianBy<T>(rows: T[], key: (r: T) => string | number | null | undefined, hours: (r: T) => number | null) {
  const groups = new Map<string | number, number[]>();
  for (const r of rows) {
    const k = key(r);
    const h = hours(r);
    if (k == null || h == null) continue;
    groups.set(k, [...(groups.get(k) ?? []), h]);
  }
  return new Map([...groups].map(([k, v]) => [k, Math.round((median(v) ?? 0) * 10) / 10]));
}

/** Week-over-week growth used by the Emerging Cluster alert. */
export function growthPercent(current: number, baseline: number): number | null {
  if (baseline === 0) return current > 0 ? null : 0;
  return Math.round(((current - baseline) / baseline) * 100);
}

export const EMERGING_CLUSTER_RULE = { minReports: 5, minGrowthPercent: 40 };
