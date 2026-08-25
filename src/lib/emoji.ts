import { TAGS } from "../../config";
import type { Experience, Place } from "../types";

const TAG_EMOJI = new Map(TAGS.map((t) => [t.slug, t.emoji]));

function tagEmoji(tag: string | undefined): string | undefined {
  return tag ? TAG_EMOJI.get(tag) : undefined;
}

// Resolution order per the design doc's "Emoji on pins" section:
// place override wins outright, then the first tag of the first experience.
// Shared by both functions below so the pin and every other surface that
// shows an emoji for a place agree once place.emoji is set.
export function resolvePlaceEmoji(place: Place): string {
  const firstExperience: Experience | undefined = place.experiences[0];
  return place.emoji ?? tagEmoji(firstExperience?.tags[0]) ?? "📍";
}

// Same override-first rule, but falls back to the given experience's own
// first tag rather than the place's first experience — pass the place
// whenever it's available so an explicit place.emoji stays consistent
// everywhere the place appears (pin, cards, detail, preview).
export function resolveExperienceEmoji(experience: Experience, place?: Place): string {
  return place?.emoji ?? tagEmoji(experience.tags[0]) ?? "📍";
}
