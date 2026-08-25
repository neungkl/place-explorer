import { describe, expect, it } from "vitest";
import { buildCards } from "./cards";
import { activeChips, defaultFilters, filterCards } from "./filters";
import type { Experience, Place, Seasons, Tier } from "../types";

const HOME = { lat: 13.7563, lng: 100.5018 };

let experienceCounter = 0;
function makeExperience(overrides: Partial<Experience> = {}): Experience {
  experienceCounter += 1;
  return {
    id: `exp-${experienceCounter}`,
    title: "Experience",
    tags: [],
    seasons: {},
    plan: null,
    visits: [],
    ...overrides,
  };
}

let placeCounter = 0;
function makePlace(overrides: Partial<Place> = {}): Place {
  placeCounter += 1;
  return {
    id: `place-${placeCounter}`,
    name: `Place ${placeCounter}`,
    region: "Somewhere",
    tier: { min: "day", max: "day" },
    location: { lat: 0, lng: 0, precision: "exact" },
    description: "",
    experiences: [],
    ...overrides,
  };
}

// Peak Mar–Aug, mid Feb & Sep, low Jan & Oct, unavailable Nov–Dec — mirrors
// the design doc's Koh Tao diving example.
const DIVE_SEASONS: Seasons = {
  peak: { months: [3, 4, 5, 6, 7, 8] },
  mid: { months: [2, 9] },
  low: { months: [1, 10] },
  unavailable: { months: [11, 12] },
};

describe("filterCards — trip tier", () => {
  it("keeps a place whose band includes a selected tier", () => {
    const place = makePlace({ tier: { min: "weekend", max: "long" }, experiences: [makeExperience()] });
    const cards = buildCards([place], HOME);
    const filters = { ...defaultFilters(), tiers: new Set<"weekend">(["weekend"]) };
    expect(filterCards(cards, filters)).toHaveLength(1);
  });

  it("drops a place whose band excludes every selected tier", () => {
    const place = makePlace({ tier: { min: "quick", max: "day" }, experiences: [makeExperience()] });
    const cards = buildCards([place], HOME);
    const filters = { ...defaultFilters(), tiers: new Set<"weekend">(["weekend"]) };
    expect(filterCards(cards, filters)).toHaveLength(0);
  });

  it("keeps everything when no tier is selected (the default)", () => {
    const place = makePlace({ experiences: [makeExperience()] });
    const cards = buildCards([place], HOME);
    const filters = { ...defaultFilters(), tiers: new Set<Tier>() };
    expect(filterCards(cards, filters)).toHaveLength(1);
  });
});

describe("filterCards — tags (OR within tags)", () => {
  it("keeps an experience matching any selected tag", () => {
    const place = makePlace({ experiences: [makeExperience({ tags: ["scuba-diving", "beach"] })] });
    const cards = buildCards([place], HOME);
    const filters = { ...defaultFilters(), tags: new Set(["beach"]) };
    expect(filterCards(cards, filters)).toHaveLength(1);
  });

  it("drops an experience matching none of the selected tags", () => {
    const place = makePlace({ experiences: [makeExperience({ tags: ["hiking"] })] });
    const cards = buildCards([place], HOME);
    const filters = { ...defaultFilters(), tags: new Set(["beach"]) };
    expect(filterCards(cards, filters)).toHaveLength(0);
  });

  it("keeps everything when no tag is selected", () => {
    const place = makePlace({ experiences: [makeExperience({ tags: ["hiking"] })] });
    const cards = buildCards([place], HOME);
    expect(filterCards(cards, defaultFilters())).toHaveLength(1);
  });
});

describe("filterCards — month", () => {
  it("Any (null) keeps everything regardless of season", () => {
    const place = makePlace({ experiences: [makeExperience({ seasons: DIVE_SEASONS })] });
    const cards = buildCards([place], HOME);
    expect(filterCards(cards, defaultFilters())).toHaveLength(1);
  });

  it("keeps a peak month", () => {
    const place = makePlace({ experiences: [makeExperience({ seasons: DIVE_SEASONS })] });
    const cards = buildCards([place], HOME);
    const filters = { ...defaultFilters(), month: 2 }; // March
    expect(filterCards(cards, filters)).toHaveLength(1);
  });

  it("keeps a mid month", () => {
    const place = makePlace({ experiences: [makeExperience({ seasons: DIVE_SEASONS })] });
    const cards = buildCards([place], HOME);
    const filters = { ...defaultFilters(), month: 1 }; // February
    expect(filterCards(cards, filters)).toHaveLength(1);
  });

  it("drops a low month when the low-season toggle is off", () => {
    const place = makePlace({ experiences: [makeExperience({ seasons: DIVE_SEASONS })] });
    const cards = buildCards([place], HOME);
    const filters = { ...defaultFilters(), month: 0 }; // January
    expect(filterCards(cards, filters)).toHaveLength(0);
  });

  it("keeps a low month when the low-season toggle is on", () => {
    const place = makePlace({ experiences: [makeExperience({ seasons: DIVE_SEASONS })] });
    const cards = buildCards([place], HOME);
    const filters = { ...defaultFilters(), month: 0, lowSeason: true }; // January
    expect(filterCards(cards, filters)).toHaveLength(1);
  });

  it("always drops an unavailable month", () => {
    const place = makePlace({ experiences: [makeExperience({ seasons: DIVE_SEASONS })] });
    const cards = buildCards([place], HOME);
    const filters = { ...defaultFilters(), month: 10, lowSeason: true }; // November
    expect(filterCards(cards, filters)).toHaveLength(0);
  });

  // "A place committed to May is hidden under m=3 even where March is peak
  // there" — the design doc's note under Month/year independence.
  it("hides an experience planned for a different month, even if this month is peak", () => {
    const place = makePlace({
      experiences: [makeExperience({ seasons: DIVE_SEASONS, plan: { year: null, month: 5 } })],
    });
    const cards = buildCards([place], HOME);
    const filters = { ...defaultFilters(), month: 2 }; // March, plan says May
    expect(filterCards(cards, filters)).toHaveLength(0);
  });

  it("keeps an experience whose plan month matches the selected month", () => {
    const place = makePlace({
      experiences: [makeExperience({ seasons: DIVE_SEASONS, plan: { year: null, month: 3 } })],
    });
    const cards = buildCards([place], HOME);
    const filters = { ...defaultFilters(), month: 2 }; // March
    expect(filterCards(cards, filters)).toHaveLength(1);
  });
});

describe("filterCards — year", () => {
  it("Any keeps every plan state", () => {
    const committed = makePlace({ experiences: [makeExperience({ plan: { year: 2027, month: 3 } })] });
    const someday = makePlace({ experiences: [makeExperience()] });
    const cards = buildCards([committed, someday], HOME);
    expect(filterCards(cards, defaultFilters())).toHaveLength(2);
  });

  it("Someday keeps only unplanned experiences", () => {
    const committed = makePlace({ experiences: [makeExperience({ plan: { year: 2027, month: 3 } })] });
    const someday = makePlace({ experiences: [makeExperience()] });
    const cards = buildCards([committed, someday], HOME);
    const filters = { ...defaultFilters(), year: "Someday" };
    const result = filterCards(cards, filters);
    expect(result).toHaveLength(1);
    expect(result[0].place.id).toBe(someday.id);
  });

  it("a numeric year keeps that year's plans plus everything unpinned to a year", () => {
    const year2027 = makePlace({ name: "2027", experiences: [makeExperience({ plan: { year: 2027, month: 3 } })] });
    const year2028 = makePlace({ name: "2028", experiences: [makeExperience({ plan: { year: 2028, month: 3 } })] });
    const monthOnly = makePlace({ name: "month-only", experiences: [makeExperience({ plan: { year: null, month: 3 } })] });
    const someday = makePlace({ name: "someday", experiences: [makeExperience()] });

    const cards = buildCards([year2027, year2028, monthOnly, someday], HOME);
    const filters = { ...defaultFilters(), year: "2027" };
    const result = filterCards(cards, filters);

    expect(result.map((c) => c.place.name).sort()).toEqual(["2027", "month-only", "someday"]);
  });
});

describe("filterCards — visited control", () => {
  function setup() {
    const planned = makePlace({ name: "planned", experiences: [makeExperience({ plan: { year: 2027, month: 3 } })] });
    const someday = makePlace({ name: "someday", experiences: [makeExperience()] });
    const visited = makePlace({ name: "visited", experiences: [makeExperience({ visits: [{ start: "2020-01-01" }] })] });
    return buildCards([planned, someday, visited], HOME);
  }

  it("Hide (default) excludes visited-and-unplanned cards", () => {
    const result = filterCards(setup(), defaultFilters());
    expect(result.map((c) => c.place.name)).toEqual(["planned", "someday"]);
  });

  it("Show includes everything", () => {
    const filters = { ...defaultFilters(), visited: "Show" as const };
    const result = filterCards(setup(), filters);
    expect(result.map((c) => c.place.name)).toEqual(["planned", "someday", "visited"]);
  });

  it("Only keeps just visited-and-unplanned cards", () => {
    const filters = { ...defaultFilters(), visited: "Only" as const };
    const result = filterCards(setup(), filters);
    expect(result.map((c) => c.place.name)).toEqual(["visited"]);
  });
});

describe("filterCards — peak sorts above mid within a group, with a month selected", () => {
  it("reorders someday cards by band without disturbing distance order otherwise tied", () => {
    const midOnly: Seasons = { mid: { months: [3] }, peak: { months: [6] } };
    const peakOnly: Seasons = { peak: { months: [3] }, mid: { months: [6] } };

    const midPlace = makePlace({
      name: "mid-in-march",
      location: { lat: 20, lng: 100, precision: "exact" },
      experiences: [makeExperience({ seasons: midOnly })],
    });
    const peakPlace = makePlace({
      name: "peak-in-march",
      location: { lat: 5, lng: 100, precision: "exact" }, // nearer, would sort first without the tiebreak
      experiences: [makeExperience({ seasons: peakOnly })],
    });

    const cards = buildCards([midPlace, peakPlace], HOME);
    const filters = { ...defaultFilters(), month: 2 }; // March
    const result = filterCards(cards, filters);

    expect(result.map((c) => c.place.name)).toEqual(["peak-in-march", "mid-in-march"]);
  });
});

describe("activeChips", () => {
  it("is empty for the default filters", () => {
    expect(activeChips(defaultFilters())).toEqual([]);
  });

  it("reports one chip per deviation from default, and clear() undoes just that one", () => {
    const filters = { ...defaultFilters(), month: 2, lowSeason: true };
    const chips = activeChips(filters);
    expect(chips.map((c) => c.key).sort()).toEqual(["lowSeason", "month"]);

    const monthChip = chips.find((c) => c.key === "month")!;
    const cleared = monthChip.clear(filters);
    expect(cleared.month).toBeNull();
    expect(cleared.lowSeason).toBe(true); // untouched
  });
});
