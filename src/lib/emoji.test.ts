import { describe, expect, it } from "vitest";
import { resolveExperienceEmoji, resolvePlaceEmoji } from "./emoji";
import type { Experience, Place } from "../types";

function makeExperience(overrides: Partial<Experience> = {}): Experience {
  return {
    id: "exp",
    title: "Experience",
    tags: [],
    seasons: {},
    plan: null,
    visits: [],
    ...overrides,
  };
}

function makePlace(overrides: Partial<Place> = {}): Place {
  return {
    id: "place",
    name: "Place",
    region: "Somewhere",
    tier: { min: "day", max: "day" },
    location: { lat: 0, lng: 0, precision: "exact" },
    description: "",
    experiences: [],
    ...overrides,
  };
}

// Resolution order per the design doc's "Emoji on pins": place override wins
// outright, then the registry emoji for the first experience's first tag,
// then a neutral default.
describe("resolvePlaceEmoji", () => {
  it("uses the place's explicit override when set", () => {
    const place = makePlace({
      emoji: "🗼",
      experiences: [makeExperience({ tags: ["scuba-diving"] })],
    });
    expect(resolvePlaceEmoji(place)).toBe("🗼");
  });

  it("falls back to the registry emoji for the first experience's first tag", () => {
    const place = makePlace({
      experiences: [makeExperience({ tags: ["scuba-diving", "beach"] })],
    });
    expect(resolvePlaceEmoji(place)).toBe("🤿");
  });

  it("leads with the first tag, not any other tag in the list", () => {
    const place = makePlace({
      experiences: [makeExperience({ tags: ["beach", "scuba-diving"] })],
    });
    expect(resolvePlaceEmoji(place)).toBe("🏖️");
  });

  it("falls back to the neutral pin when there are no experiences", () => {
    expect(resolvePlaceEmoji(makePlace())).toBe("📍");
  });

  it("falls back to the neutral pin for an unregistered tag", () => {
    const place = makePlace({
      experiences: [makeExperience({ tags: ["not-a-real-tag"] })],
    });
    expect(resolvePlaceEmoji(place)).toBe("📍");
  });
});

describe("resolveExperienceEmoji", () => {
  it("uses the registry emoji for the first tag", () => {
    expect(resolveExperienceEmoji(makeExperience({ tags: ["hiking"] }))).toBe("🥾");
  });

  it("falls back to the neutral pin with no tags", () => {
    expect(resolveExperienceEmoji(makeExperience())).toBe("📍");
  });

  it("uses the place's explicit override when a place is given, same as resolvePlaceEmoji", () => {
    const experience = makeExperience({ tags: ["hiking"] });
    const place = makePlace({ emoji: "🗼", experiences: [experience] });
    expect(resolveExperienceEmoji(experience, place)).toBe("🗼");
  });

  it("ignores a place with no override and falls back to the experience's own tag", () => {
    const experience = makeExperience({ tags: ["hiking"] });
    const place = makePlace({ experiences: [experience] });
    expect(resolveExperienceEmoji(experience, place)).toBe("🥾");
  });
});
