import type { Experience, Place } from "../types";
import { haversineKm } from "./distance";
import { planRank } from "./format";

export type CardGroup = "planned" | "someday" | "visited";

export interface Card {
  place: Place;
  experience: Experience;
  group: CardGroup;
  distanceKm: number;
  beenBefore: boolean;
}

// Grouping and sort order per the design doc's "Place list" section:
// planned (by commitment ladder) -> someday (nearest first) -> visited (last).
export function buildCards(places: Place[], homeBase: { lat: number; lng: number }): Card[] {
  const cards: Card[] = places.flatMap((place) => {
    const distanceKm = haversineKm(homeBase, place.location);
    return place.experiences.map((experience) => {
      const group: CardGroup =
        experience.plan !== null
          ? "planned"
          : experience.visits.length > 0
            ? "visited"
            : "someday";
      return {
        place,
        experience,
        group,
        distanceKm,
        beenBefore: experience.visits.length > 0,
      };
    });
  });

  const planned = cards
    .filter((c) => c.group === "planned")
    .sort((a, b) => {
      const rankDiff = planRank(a.experience.plan) - planRank(b.experience.plan);
      if (rankDiff !== 0) return rankDiff;
      const yearDiff = (a.experience.plan?.year ?? Infinity) - (b.experience.plan?.year ?? Infinity);
      if (yearDiff !== 0) return yearDiff;
      return (a.experience.plan?.month ?? Infinity) - (b.experience.plan?.month ?? Infinity);
    });

  const someday = cards
    .filter((c) => c.group === "someday")
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const visited = cards.filter((c) => c.group === "visited");

  return [...planned, ...someday, ...visited];
}
