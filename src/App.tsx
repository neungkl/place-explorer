import { useMemo, useState } from "react";
import placesData from "../data/places.json";
import type { Place } from "./types";
import "./App.css";
import { HOME_BASE_DEFAULT } from "../config";
import { buildCards } from "./lib/cards";
import { haversineKm } from "./lib/distance";
import { bandForMonth, defaultFilters, filterCards } from "./lib/filters";
import type { SeasonBandName } from "./types";
import { Map as PlaceMap } from "./components/Map";
import { FilterBar } from "./components/FilterBar";
import { Sheet, type SheetMode } from "./components/Sheet";
import { PlaceList } from "./components/PlaceList";
import { PlacePreview } from "./components/PlacePreview";
import { PlaceDetail } from "./components/PlaceDetail";
import { FilterPanel } from "./components/FilterPanel";

const places = placesData as Place[];

interface Selection {
  placeId: string;
  experienceId?: string;
}

function App() {
  const cards = buildCards(places, HOME_BASE_DEFAULT);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);

  const filteredCards = useMemo(() => filterCards(cards, filters), [cards, filters]);
  // A place shows a pin if any experience matches — see the design doc's
  // "The map only ever shows what the filters show."
  const visiblePlaceIds = useMemo(
    () => new Set(filteredCards.map((c) => c.place.id)),
    [filteredCards],
  );

  // A place's pin gets the fill/size of the first matching experience's
  // season band, same "first match wins" rule as the emoji. Empty when no
  // month is selected — there's no single band to show for "Any".
  const pinSeasonBands = useMemo(() => {
    const bands = new Map<string, SeasonBandName>();
    if (filters.month == null) return bands;
    for (const card of filteredCards) {
      if (bands.has(card.place.id)) continue;
      const band = bandForMonth(card.experience.seasons, filters.month + 1);
      if (band) bands.set(card.place.id, band);
    }
    return bands;
  }, [filteredCards, filters.month]);

  const selectedPlace = useMemo(
    () => (selection ? (places.find((p) => p.id === selection.placeId) ?? null) : null),
    [selection],
  );
  const selectedExperience = useMemo(
    () =>
      selectedPlace && selection?.experienceId
        ? (selectedPlace.experiences.find((e) => e.id === selection.experienceId) ?? null)
        : null,
    [selectedPlace, selection],
  );

  const baseMode: SheetMode = !selectedPlace ? "list" : selectedExperience ? "detail" : "preview";
  // Filters is a mode of the one sheet, not a second sheet — it swaps the
  // content at the Full detent and never touches the selection underneath.
  const mode: SheetMode = filtersOpen ? "filters" : baseMode;
  const distanceKm = selectedPlace ? haversineKm(HOME_BASE_DEFAULT, selectedPlace.location) : 0;

  const dismiss = () => (filtersOpen ? setFiltersOpen(false) : setSelection(null));
  const backToPreview = () => selection && setSelection({ placeId: selection.placeId });

  return (
    <div className="app">
      <PlaceMap
        places={places}
        selectedPlaceId={selectedPlace?.id ?? null}
        sheetMode={baseMode}
        visiblePlaceIds={visiblePlaceIds}
        seasonBands={pinSeasonBands}
        onSelectPlace={(placeId) => setSelection({ placeId })}
        onDismiss={dismiss}
      />
      <FilterBar
        filters={filters}
        onOpenFilters={() => setFiltersOpen(true)}
        onChangeFilters={setFilters}
      />
      <Sheet
        mode={mode}
        onDismiss={dismiss}
        month={filters.month}
        onMonthChange={(month) => setFilters({ ...filters, month })}
        year={filters.year}
        onYearChange={(year) => setFilters({ ...filters, year })}
      >
        {mode === "list" && (
          <PlaceList
            cards={filteredCards}
            month={filters.month}
            onSelectCard={(placeId, experienceId) => setSelection({ placeId, experienceId })}
          />
        )}
        {mode === "preview" && selectedPlace && (
          <PlacePreview
            place={selectedPlace}
            distanceKm={distanceKm}
            onSelectExperience={(experienceId) =>
              setSelection({ placeId: selectedPlace.id, experienceId })
            }
          />
        )}
        {mode === "detail" && selectedPlace && selectedExperience && (
          <PlaceDetail
            place={selectedPlace}
            experience={selectedExperience}
            distanceKm={distanceKm}
            onBackToPlace={backToPreview}
          />
        )}
        {mode === "filters" && <FilterPanel filters={filters} onChange={setFilters} />}
      </Sheet>
    </div>
  );
}

export default App;
