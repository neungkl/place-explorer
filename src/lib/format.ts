import type { Plan, TierBand, Visit } from "../types";

export const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const TIER_LABELS: Record<TierBand["min"], string> = {
  quick: "Quick",
  day: "Day",
  weekend: "Weekend",
  long: "Long",
};

export function formatTierBand(tier: TierBand): string {
  if (tier.min === tier.max) return TIER_LABELS[tier.min];
  return `${TIER_LABELS[tier.min]}–${TIER_LABELS[tier.max]}`;
}

export function formatDistanceKm(km: number): string {
  return `${Math.round(km).toLocaleString()} km`;
}

// Per the design doc's commitment ladder: committed > year > month intent > someday.
export function formatPlanBadge(plan: Plan | null): string | null {
  if (!plan) return null;
  if (plan.year != null && plan.month != null) {
    return `${MONTH_NAMES[plan.month - 1]} ${plan.year}`;
  }
  if (plan.year != null) return String(plan.year);
  if (plan.month != null) return `${MONTH_NAMES[plan.month - 1]} · any year`;
  return null;
}

export function planRank(plan: Plan | null): number {
  if (!plan) return 3; // someday
  if (plan.year != null && plan.month != null) return 0; // committed
  if (plan.year != null) return 1; // year
  if (plan.month != null) return 2; // month intent
  return 3;
}

export function formatVisitDate(date: string): string {
  // Accepts full dates ("2026-08-15") or reduced precision ("2026-08").
  const [year, month, day] = date.split("-").map(Number);
  if (!day) return `${MONTH_NAMES[month - 1]} ${year}`;
  return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
}

export function formatVisit(visit: Visit): string {
  if (!visit.end || visit.end === visit.start) return formatVisitDate(visit.start);
  return `${formatVisitDate(visit.start)} – ${formatVisitDate(visit.end)}`;
}

// Compact "MMM YYYY" form for the visited badge — see the design doc's
// "Planned vs. someday" card-treatment table (`Visited · Aug 2026`).
export function formatVisitBadge(visit: Visit): string {
  const [year, month] = visit.start.split("-").map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function formatMonths(months: number[]): string {
  const sorted = [...months].sort((a, b) => a - b);
  const ranges: [number, number][] = [];
  for (const m of sorted) {
    const last = ranges.at(-1);
    if (last && last[1] === m - 1) {
      last[1] = m;
    } else {
      ranges.push([m, m]);
    }
  }
  return ranges
    .map(([start, end]) =>
      start === end
        ? MONTH_NAMES[start - 1]
        : `${MONTH_NAMES[start - 1]}–${MONTH_NAMES[end - 1]}`,
    )
    .join(", ");
}

export function mostRecentVisit(visits: Visit[]): Visit | null {
  if (visits.length === 0) return null;
  return [...visits].sort((a, b) => b.start.localeCompare(a.start))[0];
}
