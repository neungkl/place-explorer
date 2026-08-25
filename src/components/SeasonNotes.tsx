import type { Seasons, SeasonBandName } from "../types";

const BAND_ORDER: SeasonBandName[] = ["peak", "mid", "low", "unavailable"];

const BAND_LABELS: Record<SeasonBandName, string> = {
  peak: "Peak",
  mid: "Mid",
  low: "Low",
  unavailable: "Unavailable",
};

// The data model carries a `why` per season band, but the month strip only
// surfaces it as a hover title — unreachable on touch. This lists it
// permanently below the strip instead.
export function SeasonNotes({ seasons }: { seasons: Seasons }) {
  const bands = BAND_ORDER.flatMap((band) => {
    const entry = seasons[band];
    return entry ? [{ band, entry }] : [];
  });

  if (bands.length === 0) return null;

  return (
    <ul className="season-notes">
      {bands.map(({ band, entry }) => (
        <li key={band} className="season-notes__row">
          <span className={`season-notes__dot season-notes__dot--${band}`} aria-hidden="true" />
          <div>
            <p className="season-notes__label">{BAND_LABELS[band]}</p>
            {entry.why && <p className="season-notes__why">{entry.why}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
