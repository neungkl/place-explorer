import { MONTH_NAMES } from "../lib/format";
import type { Seasons, SeasonBandName } from "../types";

const BAND_ORDER: SeasonBandName[] = ["peak", "mid", "low", "unavailable"];

function monthBand(seasons: Seasons, month: number): { band: SeasonBandName | null; why?: string } {
  for (const band of BAND_ORDER) {
    const entry = seasons[band];
    if (entry?.months.includes(month)) return { band, why: entry.why };
  }
  return { band: null };
}

// Per-experience season breakdown — see the design doc's "Detail fills the
// sheet" section. `why` rides as a title tooltip; tapping isn't wired since
// this pass has no touch-tooltip pattern yet.
export function MonthStrip({ seasons }: { seasons: Seasons }) {
  return (
    <div className="month-strip">
      {MONTH_NAMES.map((name, i) => {
        const month = i + 1;
        const { band, why } = monthBand(seasons, month);
        return (
          <div
            key={month}
            className={`month-strip__cell ${band ? `month-strip__cell--${band}` : ""}`}
            title={why ?? name}
          >
            {name}
          </div>
        );
      })}
    </div>
  );
}
