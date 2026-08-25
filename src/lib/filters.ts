import { TAGS } from "../../config";
import { MONTH_NAMES } from "./format";
import type { Card, CardGroup } from "./cards";
import type { Experience, Plan, SeasonBandName, Seasons, Tier, TierBand } from "../types";

export type VisitedControl = "Hide" | "Show" | "Only";

export const ALL_TIERS: Tier[] = ["quick", "day", "weekend", "long"];

export const YEARS = ["Any", "Someday", "2026", "2027", "2028"];

export interface Filters {
  tiers: Set<Tier>;
  tags: Set<string>;
  month: number | null; // 0-11 (Jan-Dec), null = Any
  year: string; // "Any" | "Someday" | a year like "2027"
  lowSeason: boolean;
  visited: VisitedControl;
}

// A fresh mutable object each call — Filters holds Sets, so a shared default
// object would let one reset's edits leak into the next.
export function defaultFilters(): Filters {
  return {
    tiers: new Set(),
    tags: new Set(),
    month: null,
    year: "Any",
    lowSeason: false,
    visited: "Hide",
  };
}

// No tier selected means no filtering — everything matches. Once at least
// one is selected, a place matches if its band includes any of them — see
// the design doc's "A place spans a range of tiers, not one".
function matchesTier(tier: TierBand, selected: Set<Tier>): boolean {
  if (selected.size === 0) return true;
  const minIdx = ALL_TIERS.indexOf(tier.min);
  const maxIdx = ALL_TIERS.indexOf(tier.max);
  for (let i = minIdx; i <= maxIdx; i++) {
    if (selected.has(ALL_TIERS[i])) return true;
  }
  return false;
}

// OR within tags — see the design doc's Filters table.
function matchesTags(tags: string[], selected: Set<string>): boolean {
  if (selected.size === 0) return true;
  return tags.some((t) => selected.has(t));
}

export function bandForMonth(seasons: Seasons, month1to12: number): SeasonBandName | null {
  for (const name of ["peak", "mid", "low", "unavailable"] as const) {
    if (seasons[name]?.months.includes(month1to12)) return name;
  }
  return null;
}

// Keeps experiences whose band for that month is peak or mid (low only with
// the toggle on, unavailable never), and whose plan doesn't name a different
// month — see the design doc's "Month and year are tested independently".
function matchesMonth(experience: Experience, monthIndex: number | null, lowSeasonOn: boolean): boolean {
  if (monthIndex == null) return true;
  const month = monthIndex + 1;
  const band = bandForMonth(experience.seasons, month);
  if (band === null || band === "unavailable") return false;
  if (band === "low" && !lowSeasonOn) return false;
  if (experience.plan?.month != null && experience.plan.month !== month) return false;
  return true;
}

// "Someday" keeps only unplanned experiences. A numeric year keeps that
// year's plans plus everything not pinned to a year — see the design doc's
// Month/year table (a null plan.year, or no plan at all, matches any year).
function matchesYear(plan: Plan | null, yearFilter: string): boolean {
  if (yearFilter === "Any") return true;
  if (yearFilter === "Someday") return plan === null;
  if (plan === null) return true;
  return plan.year === null || plan.year === Number(yearFilter);
}

function matchesFilters(card: Card, filters: Filters): boolean {
  return (
    matchesTier(card.place.tier, filters.tiers) &&
    matchesTags(card.experience.tags, filters.tags) &&
    matchesMonth(card.experience, filters.month, filters.lowSeason) &&
    matchesYear(card.experience.plan, filters.year)
  );
}

// Visited operates per card, not per place — see the design doc's "Visits".
function applyVisitedControl(cards: Card[], visited: VisitedControl): Card[] {
  if (visited === "Hide") return cards.filter((c) => c.group !== "visited");
  if (visited === "Only") return cards.filter((c) => c.group === "visited");
  return cards;
}

const BAND_SORT_RANK: Partial<Record<SeasonBandName, number>> = { peak: 0, mid: 1, low: 2 };

// A tiebreak within each group, never a regrouping — see "peak sorts above
// mid inside every group" in the design doc's Filters table.
function sortPeakFirst(cards: Card[], monthIndex: number): Card[] {
  const month = monthIndex + 1;
  const groups: Record<CardGroup, Card[]> = { planned: [], someday: [], visited: [] };
  for (const card of cards) groups[card.group].push(card);

  const rank = (card: Card) => BAND_SORT_RANK[bandForMonth(card.experience.seasons, month) ?? "unavailable"] ?? 3;

  return (Object.keys(groups) as CardGroup[]).flatMap((group) =>
    [...groups[group]].sort((a, b) => rank(a) - rank(b)),
  );
}

export function filterCards(cards: Card[], filters: Filters): Card[] {
  const matched = cards.filter((c) => matchesFilters(c, filters));
  const visible = applyVisitedControl(matched, filters.visited);
  return filters.month != null ? sortPeakFirst(visible, filters.month) : visible;
}

const TIER_LABELS: Record<Tier, string> = {
  quick: "Quick",
  day: "Day",
  weekend: "Weekend",
  long: "Long",
};

export interface ActiveChip {
  key: string;
  label: string;
  clear: (filters: Filters) => Filters;
}

// Every filter that is doing something, each with its own undo — see the
// design doc's "No Clear all": active filters undo themselves individually.
export function activeChips(filters: Filters): ActiveChip[] {
  const chips: ActiveChip[] = [];

  if (filters.tiers.size > 0) {
    const label = ALL_TIERS.filter((t) => filters.tiers.has(t))
      .map((t) => TIER_LABELS[t])
      .join(", ");
    chips.push({ key: "tiers", label, clear: (f) => ({ ...f, tiers: new Set() }) });
  }

  if (filters.tags.size > 0) {
    const label =
      filters.tags.size === 1
        ? (TAGS.find((t) => filters.tags.has(t.slug))?.label ?? [...filters.tags][0])
        : `${filters.tags.size} tags`;
    chips.push({ key: "tags", label, clear: (f) => ({ ...f, tags: new Set() }) });
  }

  if (filters.year !== "Any") {
    chips.push({ key: "year", label: filters.year, clear: (f) => ({ ...f, year: "Any" }) });
  }

  if (filters.month != null) {
    chips.push({ key: "month", label: MONTH_NAMES[filters.month], clear: (f) => ({ ...f, month: null }) });
  }

  if (filters.lowSeason) {
    chips.push({ key: "lowSeason", label: "low season: on", clear: (f) => ({ ...f, lowSeason: false }) });
  }

  if (filters.visited !== "Hide") {
    chips.push({
      key: "visited",
      label: `visited: ${filters.visited.toLowerCase()}`,
      clear: (f) => ({ ...f, visited: "Hide" }),
    });
  }

  return chips;
}
