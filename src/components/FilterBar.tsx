import { activeChips, type Filters } from "../lib/filters";

// "Filters" opens the panel; each active-filter chip undoes just itself —
// see the design doc's "No Clear all". The result count lives at the top of
// the list instead of here, keeping this floating bar to just the controls.
export function FilterBar({
  filters,
  onOpenFilters,
  onChangeFilters,
}: {
  filters: Filters;
  onOpenFilters: () => void;
  onChangeFilters: (next: Filters) => void;
}) {
  const chips = activeChips(filters);

  return (
    <div className="filter-bar">
      <div className="filter-bar__row">
        <button
          type="button"
          className="chip chip--button chip--filters-button"
          onClick={onOpenFilters}
        >
          {chips.length > 0 ? `Filters (${chips.length})` : "Filters"}
        </button>
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            className="chip chip--button chip--active"
            onClick={() => onChangeFilters(chip.clear(filters))}
          >
            {chip.label} ×
          </button>
        ))}
      </div>
    </div>
  );
}
