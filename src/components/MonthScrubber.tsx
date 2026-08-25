import { MONTH_NAMES } from "../lib/format";
import { YEARS } from "../lib/filters";

// The headline filter — never hides behind the Filters button, per the
// design doc. Tapping a month selects it; tapping the pill resets to Any.
// Year sits right before it: both are "when" questions, so they share a
// row instead of year being buried a tap away in the filter panel.
export function MonthScrubber({
  month,
  onChange,
  year,
  onYearChange,
}: {
  month: number | null;
  onChange: (month: number | null) => void;
  year: string;
  onYearChange: (year: string) => void;
}) {
  return (
    <div className="month-scrubber">
      <div className="month-scrubber__row">
        <select
          className={`month-scrubber__year ${year !== "Any" ? "month-scrubber__year--active" : ""}`}
          value={year}
          onChange={(e) => onYearChange(e.target.value)}
          aria-label="Year"
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={`month-scrubber__pill ${month == null ? "month-scrubber__pill--active" : ""}`}
          onClick={() => onChange(null)}
        >
          {month == null ? "Any" : MONTH_NAMES[month]}
        </button>
      </div>
      <div className="month-scrubber__track">
        {MONTH_NAMES.map((m, i) => (
          <button
            key={m}
            type="button"
            className={`month-scrubber__tick ${month === i ? "month-scrubber__tick--active" : ""}`}
            aria-pressed={month === i}
            onClick={() => onChange(i)}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}
