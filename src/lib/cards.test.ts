import { describe, expect, it } from "vitest";
import { buildCards } from "./cards";
import type { Experience, Place, Plan, Visit } from "../types";

const HOME = { lat: 13.7563, lng: 100.5018 }; // Bangkok

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

function visit(start: string): Visit {
  return { start };
}

describe("buildCards — grouping", () => {
  it("groups an experience with a plan as planned, even if also visited", () => {
    const plan: Plan = { year: 2027, month: 3 };
    const place = makePlace({ experiences: [makeExperience({ plan, visits: [visit("2020-01-01")] })] });
    const [card] = buildCards([place], HOME);
    expect(card.group).toBe("planned");
    expect(card.beenBefore).toBe(true);
  });

  it("groups an unplanned, visited experience as visited", () => {
    const place = makePlace({ experiences: [makeExperience({ visits: [visit("2020-01-01")] })] });
    const [card] = buildCards([place], HOME);
    expect(card.group).toBe("visited");
    expect(card.beenBefore).toBe(true);
  });

  it("groups an unplanned, unvisited experience as someday", () => {
    const place = makePlace({ experiences: [makeExperience()] });
    const [card] = buildCards([place], HOME);
    expect(card.group).toBe("someday");
    expect(card.beenBefore).toBe(false);
  });

  it("emits one card per experience, not per place", () => {
    const place = makePlace({ experiences: [makeExperience(), makeExperience()] });
    expect(buildCards([place], HOME)).toHaveLength(2);
  });
});

describe("buildCards — group order", () => {
  it("always orders planned, then someday, then visited", () => {
    const visitedPlace = makePlace({ experiences: [makeExperience({ visits: [visit("2020-01-01")] })] });
    const somedayPlace = makePlace({ experiences: [makeExperience()] });
    const plannedPlace = makePlace({ experiences: [makeExperience({ plan: { year: 2027, month: 3 } })] });

    const cards = buildCards([visitedPlace, somedayPlace, plannedPlace], HOME);

    expect(cards.map((c) => c.group)).toEqual(["planned", "someday", "visited"]);
  });
});

// The commitment ladder governs sort order within Planned: committed (soonest
// date first), then year-only (soonest year first), then month intent.
describe("buildCards — planned sort order", () => {
  it("sorts by commitment rung, then by soonest date within a rung", () => {
    const monthIntent = makePlace({
      name: "Month intent",
      experiences: [makeExperience({ plan: { year: null, month: 6 } })],
    });
    const yearLater = makePlace({
      name: "Year 2028",
      experiences: [makeExperience({ plan: { year: 2028, month: null } })],
    });
    const yearSooner = makePlace({
      name: "Year 2027",
      experiences: [makeExperience({ plan: { year: 2027, month: null } })],
    });
    const committedLater = makePlace({
      name: "Committed Aug 2027",
      experiences: [makeExperience({ plan: { year: 2027, month: 8 } })],
    });
    const committedSooner = makePlace({
      name: "Committed Mar 2027",
      experiences: [makeExperience({ plan: { year: 2027, month: 3 } })],
    });

    const cards = buildCards(
      [monthIntent, yearLater, yearSooner, committedLater, committedSooner],
      HOME,
    );

    expect(cards.map((c) => c.place.name)).toEqual([
      "Committed Mar 2027",
      "Committed Aug 2027",
      "Year 2027",
      "Year 2028",
      "Month intent",
    ]);
  });
});

describe("buildCards — someday sort order", () => {
  it("sorts nearest-first by distance from home base", () => {
    const far = makePlace({
      name: "Far",
      location: { lat: 64.9631, lng: -19.0208, precision: "approximate" }, // Iceland
      experiences: [makeExperience()],
    });
    const near = makePlace({
      name: "Near",
      location: { lat: 10.0956, lng: 99.8403, precision: "exact" }, // Koh Tao
      experiences: [makeExperience()],
    });

    const cards = buildCards([far, near], HOME);

    expect(cards.map((c) => c.place.name)).toEqual(["Near", "Far"]);
  });
});
