// Department performance score (0..100). A performance indicator for a department —
// never a ranking of individual employees.

export type DepartmentMetrics = {
  received: number;
  resolved: number;
  pending: number;
  overdue: number;
  over30Days: number;
  repeatComplaints: number; // complaints merged into an existing issue
  medianResolutionHours: number | null;
  slaHours: number;
};

export const AUTHORITY_SCORE_WEIGHTS = {
  resolutionRate: 35,
  speed: 25, // median vs SLA
  backlog: 15,
  overdue: 15,
  over30: 10,
  repeatPenaltyMax: 5,
};

export function authorityScore(m: DepartmentMetrics) {
  const W = AUTHORITY_SCORE_WEIGHTS;
  const total = m.resolved + m.pending;
  const resolutionRate = total === 0 ? 1 : m.resolved / total;
  const speed = m.medianResolutionHours == null ? 0.5 : Math.max(0, Math.min(1, 1.5 - m.medianResolutionHours / m.slaHours / 2));
  const backlog = total === 0 ? 1 : 1 - m.pending / total;
  const overdue = m.pending === 0 ? 1 : 1 - m.overdue / m.pending;
  const over30 = m.pending === 0 ? 1 : Math.max(0, 1 - (m.over30Days / m.pending) * 3);
  const repeatRatio = m.received === 0 ? 0 : m.repeatComplaints / m.received;

  const breakdown = {
    resolutionRate: resolutionRate * W.resolutionRate,
    speed: speed * W.speed,
    backlog: backlog * W.backlog,
    overdue: overdue * W.overdue,
    over30: over30 * W.over30,
    repeatPenalty: -Math.min(W.repeatPenaltyMax, repeatRatio * 20),
  };
  const score = Math.round(Math.max(0, Math.min(100, Object.values(breakdown).reduce((a, b) => a + b, 0))));
  return { score, resolutionRate, breakdown };
}
