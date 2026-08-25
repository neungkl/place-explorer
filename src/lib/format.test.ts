import { describe, expect, it } from "vitest";
import {
  formatDistanceKm,
  formatMonths,
  formatPlanBadge,
  formatVisit,
  formatVisitBadge,
  formatVisitDate,
  formatTierBand,
  mostRecentVisit,
  planRank,
} from "./format";

describe("formatTierBand", () => {
  it("collapses to one label when min equals max", () => {
    expect(formatTierBand({ min: "weekend", max: "weekend" })).toBe("Weekend");
  });

  it("shows a range when min and max differ", () => {
    expect(formatTierBand({ min: "weekend", max: "long" })).toBe("Weekend–Long");
  });
});

describe("formatDistanceKm", () => {
  it("rounds to the nearest whole km", () => {
    expect(formatDistanceKm(4496.6)).toBe("4,497 km");
  });

  it("adds thousands separators", () => {
    expect(formatDistanceKm(12345)).toBe("12,345 km");
  });
});

// Per the design doc's commitment ladder: committed > year > month intent > someday.
describe("formatPlanBadge / planRank — the commitment ladder", () => {
  it("someday (null) has no badge and the lowest rank", () => {
    expect(formatPlanBadge(null)).toBeNull();
    expect(planRank(null)).toBe(3);
  });

  it("committed (year + month) outranks everything", () => {
    const plan = { year: 2027, month: 3 };
    expect(formatPlanBadge(plan)).toBe("Mar 2027");
    expect(planRank(plan)).toBe(0);
  });

  it("year-only ranks above month-only", () => {
    const yearOnly = { year: 2027, month: null };
    const monthOnly = { year: null, month: 3 };
    expect(formatPlanBadge(yearOnly)).toBe("2027");
    expect(formatPlanBadge(monthOnly)).toBe("Mar · any year");
    expect(planRank(yearOnly)).toBeLessThan(planRank(monthOnly));
  });

  it("ranks strictly increase down the ladder", () => {
    const ranks = [
      planRank({ year: 2027, month: 3 }),
      planRank({ year: 2027, month: null }),
      planRank({ year: null, month: 3 }),
      planRank(null),
    ];
    expect(ranks).toEqual([0, 1, 2, 3]);
  });
});

describe("formatVisitDate", () => {
  it("renders a full date with day", () => {
    expect(formatVisitDate("2026-08-15")).toBe("15 Aug 2026");
  });

  it("renders a reduced-precision (month-only) date without a day", () => {
    expect(formatVisitDate("2021-07")).toBe("Jul 2021");
  });
});

describe("formatVisit", () => {
  it("collapses to one date when start and end match", () => {
    expect(formatVisit({ start: "2026-08-15", end: "2026-08-15" })).toBe("15 Aug 2026");
  });

  it("collapses to one date when end is omitted", () => {
    expect(formatVisit({ start: "2026-08-15" })).toBe("15 Aug 2026");
  });

  it("renders a range when start and end differ", () => {
    expect(formatVisit({ start: "2026-08-15", end: "2026-08-17" })).toBe("15 Aug 2026 – 17 Aug 2026");
  });

  it("handles a reduced-precision start alongside a full-precision end", () => {
    expect(formatVisit({ start: "2021-07", end: "2021-07-15" })).toBe("Jul 2021 – 15 Jul 2021");
  });
});

describe("formatVisitBadge", () => {
  it("renders a compact 'MMM YYYY' form from the start date", () => {
    expect(formatVisitBadge({ start: "2026-08-15", end: "2026-08-17" })).toBe("Aug 2026");
  });
});

describe("formatMonths", () => {
  it("renders a single month", () => {
    expect(formatMonths([3])).toBe("Mar");
  });

  it("collapses a contiguous run into a range", () => {
    expect(formatMonths([3, 4, 5, 6, 7, 8])).toBe("Mar–Aug");
  });

  it("keeps non-contiguous runs as separate, comma-joined ranges", () => {
    expect(formatMonths([1, 2, 11, 12])).toBe("Jan–Feb, Nov–Dec");
  });

  it("sorts unordered input before collapsing", () => {
    expect(formatMonths([8, 3, 4, 7, 6, 5])).toBe("Mar–Aug");
  });
});

describe("mostRecentVisit", () => {
  it("returns null for no visits", () => {
    expect(mostRecentVisit([])).toBeNull();
  });

  it("picks the visit with the latest start date", () => {
    const older = { start: "2024-01-10" };
    const newer = { start: "2026-08-15" };
    expect(mostRecentVisit([older, newer])).toBe(newer);
  });

  it("does not depend on input order", () => {
    const older = { start: "2024-01-10" };
    const newer = { start: "2026-08-15" };
    expect(mostRecentVisit([newer, older])).toBe(newer);
  });
});
