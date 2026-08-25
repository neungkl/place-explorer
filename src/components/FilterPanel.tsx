import { TAGS } from "../../config";
import { ALL_TIERS, type Filters, type VisitedControl } from "../lib/filters";
import type { Tier } from "../types";

const TIER_LABELS: Record<Tier, string> = {
  quick: "Quick",
  day: "Day",
  weekend: "Weekend",
  long: "Long",
};

const VISITED_OPTIONS: VisitedControl[] = ["Hide", "Show", "Only"];

const TAG_GROUPS = [...new Set(TAGS.map((t) => t.group))];

// The Full-detent filter panel — every control from the design doc's
// "Filters" table except month and year, which live permanently in the
// sheet header instead (both are "when" questions). Controlled by the
// parent so the same state drives both this panel and the active-filter
// chips in the bar over the map.
export function FilterPanel({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
}) {
  function toggleTier(tier: Tier) {
    const next = new Set(filters.tiers);
    if (next.has(tier)) next.delete(tier);
    else next.add(tier);
    onChange({ ...filters, tiers: next });
  }

  function toggleTag(slug: string) {
    const next = new Set(filters.tags);
    if (next.has(slug)) next.delete(slug);
    else next.add(slug);
    onChange({ ...filters, tags: next });
  }

  return (
    <div className="filter-panel">
      <section className="filter-panel__section">
        <h3>Trip length</h3>
        <div className="filter-panel__chips">
          {ALL_TIERS.map((tier) => (
            <button
              key={tier}
              type="button"
              className={`chip chip--button chip--toggle ${filters.tiers.has(tier) ? "chip--active" : ""}`}
              aria-pressed={filters.tiers.has(tier)}
              onClick={() => toggleTier(tier)}
            >
              {TIER_LABELS[tier]}
            </button>
          ))}
        </div>
      </section>

      <section className="filter-panel__section">
        <h3>Tags</h3>
        {TAG_GROUPS.map((group) => (
          <div key={group} className="filter-panel__tag-group">
            <h4>{group}</h4>
            <div className="filter-panel__chips">
              {TAGS.filter((t) => t.group === group).map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  className={`chip chip--button chip--toggle ${filters.tags.has(t.slug) ? "chip--active" : ""}`}
                  aria-pressed={filters.tags.has(t.slug)}
                  onClick={() => toggleTag(t.slug)}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="filter-panel__section">
        <h3>Low season</h3>
        <button
          type="button"
          className={`filter-panel__toggle ${filters.lowSeason ? "filter-panel__toggle--on" : ""}`}
          role="switch"
          aria-checked={filters.lowSeason}
          onClick={() => onChange({ ...filters, lowSeason: !filters.lowSeason })}
        >
          <span className="filter-panel__toggle-knob" />
        </button>
        <span className="filter-panel__toggle-label">{filters.lowSeason ? "Shown" : "Hidden"}</span>
      </section>

      <section className="filter-panel__section">
        <h3>Visited</h3>
        <div className="filter-panel__segmented" role="group" aria-label="Visited">
          {VISITED_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={`filter-panel__segment ${filters.visited === option ? "filter-panel__segment--active" : ""}`}
              aria-pressed={filters.visited === option}
              onClick={() => onChange({ ...filters, visited: option })}
            >
              {option}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
