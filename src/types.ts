// Core data types for places.json. See ../docs/data-model.md for the full model.

export type Tier = "quick" | "day" | "weekend" | "long";

export interface TierBand {
  min: Tier;
  max: Tier;
}

export type LocationPrecision = "exact" | "approximate";

export interface Location {
  lat: number;
  lng: number;
  precision: LocationPrecision;
}

export type SeasonBandName = "peak" | "mid" | "low" | "unavailable";

export interface SeasonBand {
  months: number[];
  why?: string;
}

export interface Seasons {
  peak?: SeasonBand;
  mid?: SeasonBand;
  low?: SeasonBand;
  unavailable?: SeasonBand;
}

export interface Plan {
  year: number | null;
  month: number | null;
}

export interface Visit {
  start: string;
  end?: string;
  note?: string;
  log?: string;
}

export interface Experience {
  id: string;
  title: string;
  tags: string[];
  seasons: Seasons;
  plan: Plan | null;
  visits: Visit[];
  gmaps?: string;
}

export interface Photo {
  src: string;
  credit?: string;
}

export interface Place {
  id: string;
  name: string;
  region: string;
  tier: TierBand;
  location: Location;
  gmaps?: string;
  description: string;
  travel?: string;
  photo?: Photo;
  emoji?: string | null;
  experiences: Experience[];
}
