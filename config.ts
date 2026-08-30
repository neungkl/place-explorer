// Site-wide config: home base default and the tag vocabulary registry.
// See docs/data-model.md#tag-vocabulary for the rules around this.

export interface TagDefinition {
  slug: string;
  label: string;
  emoji: string;
  group: string;
  aliases?: string[];
}

export const HOME_BASE_DEFAULT = {
  name: "Bangkok",
  lat: 13.7563,
  lng: 100.5018,
};

// Vector tile style — kept here so swapping providers is a one-line change.
// See docs/data-model.md#map-provider.
export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

export const TAGS: TagDefinition[] = [
  { slug: "scuba-diving", label: "Scuba diving", emoji: "🤿", group: "Water", aliases: ["scuba"] },
  { slug: "snorkeling", label: "Snorkeling", emoji: "🐠", group: "Water" },
  { slug: "surfing", label: "Surfing", emoji: "🏄", group: "Water" },
  { slug: "beach", label: "Beach", emoji: "🏖️", group: "Water" },
  { slug: "swimming", label: "Swimming", emoji: "🏊", group: "Water" },
  { slug: "waterfall", label: "Waterfall", emoji: "💦", group: "Water" },
  { slug: "canyoneering", label: "Canyoneering", emoji: "🪢", group: "Water", aliases: ["canyoning"] },

  { slug: "hiking", label: "Hiking", emoji: "🥾", group: "Mountain & snow" },
  { slug: "mountain", label: "Mountain", emoji: "🏔️", group: "Mountain & snow" },
  { slug: "bouldering", label: "Bouldering", emoji: "🧗", group: "Mountain & snow" },
  { slug: "snowboarding", label: "Snowboarding", emoji: "🏂", group: "Mountain & snow" },
  { slug: "skiing", label: "Skiing", emoji: "⛷️", group: "Mountain & snow" },
  { slug: "viewpoint", label: "Viewpoint", emoji: "🏞️", group: "Mountain & snow" },

  { slug: "city", label: "City", emoji: "🏙️", group: "Urban" },
  { slug: "nightlife", label: "Nightlife", emoji: "🍸", group: "Urban" },
  { slug: "food", label: "Food", emoji: "🍜", group: "Urban" },
  { slug: "cafe", label: "Cafe", emoji: "☕", group: "Urban" },

  { slug: "temple", label: "Temple", emoji: "⛩️", group: "Culture" },
  { slug: "museum", label: "Museum", emoji: "🖼️", group: "Culture" },
  { slug: "history", label: "History", emoji: "🏛️", group: "Culture" },
  { slug: "festival", label: "Festival", emoji: "🎉", group: "Culture" },

  { slug: "onsen", label: "Onsen", emoji: "♨️", group: "Rest" },
  { slug: "nature", label: "Nature", emoji: "🌿", group: "Rest" },
  { slug: "scenic-transit", label: "Scenic transit", emoji: "🚋", group: "Rest" },
  { slug: "hot-air-balloon", label: "Hot-air balloon", emoji: "🎈", group: "Rest", aliases: ["ballooning"] },
  { slug: "road-trip", label: "Road trip", emoji: "🚗", group: "Rest", aliases: ["self-drive"] },
];
