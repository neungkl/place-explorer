import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_STYLE_URL } from "../../config";

// maplibre-gl resolves its render worker via a runtime `import.meta.url`
// lookup Vite can't statically analyze, so the worker chunk never lands in
// the production build (it only works in dev, served straight from
// node_modules) and tiles/markers silently fail to render. The worker's own
// source also does a plain relative `import` of a sibling chunk
// (maplibre-gl-shared.mjs), so it can't be pulled in as a single hashed
// Vite asset either - both files need to keep their original names and sit
// next to each other. vite.config.ts's copyMaplibreWorker plugin copies both
// straight from the installed package into the build output unhashed; this
// points the library at that path.
maplibregl.setWorkerUrl(`${import.meta.env.BASE_URL}maplibre-gl-worker.mjs`);
import type { Place } from "../types";
import { resolvePlaceEmoji } from "../lib/emoji";
import { planRank } from "../lib/format";
import type { SheetMode } from "./Sheet";
import type { SeasonBandName } from "../types";

const SEASON_CLASSES = ["pin--season-peak", "pin--season-mid", "pin--season-low", "pin--season-unavailable"];

function applySeasonClass(el: HTMLDivElement, band?: SeasonBandName) {
  el.classList.remove(...SEASON_CLASSES);
  if (band) el.classList.add(`pin--season-${band}`);
}

// Strongest commitment across a place's experiences, for the pin's outer ring.
// Static mock — real ring encoding would react to whichever experience matches
// the current filters, per the design doc's "Emoji on pins" section.
function commitmentClass(place: Place): string {
  const ranks = place.experiences.map((e) => planRank(e.plan));
  const best = Math.min(...ranks);
  if (best === 0) return "pin--committed"; // solid ring
  if (best <= 2) return "pin--intent"; // solid ring
  return ""; // someday, no ring
}

// Every experience already visited and none of them planned again — nothing
// left to decide here, so the pin recedes rather than competing for attention.
function isVisitedOnly(place: Place): boolean {
  return place.experiences.every((e) => e.plan === null && e.visits.length > 0);
}

// Bottom padding matches the sheet's current detent, per the design doc's
// camera rule — the pin settles into the live band of map above the sheet.
function bottomPaddingFor(mode: SheetMode, containerHeight: number): number {
  if (mode === "preview") return Math.min(300, containerHeight * 0.46) + 24;
  if (mode === "detail") return containerHeight * 0.9;
  return containerHeight * 0.55 + 20;
}

interface MarkerEntry {
  marker: maplibregl.Marker;
  el: HTMLDivElement;
}

export function Map({
  places,
  selectedPlaceId,
  sheetMode,
  visiblePlaceIds,
  seasonBands,
  onSelectPlace,
  onDismiss,
}: {
  places: Place[];
  selectedPlaceId: string | null;
  sheetMode: SheetMode;
  visiblePlaceIds: Set<string>;
  seasonBands: Map<string, SeasonBandName>;
  onSelectPlace: (placeId: string) => void;
  onDismiss: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Record<string, MarkerEntry>>({});
  const hasFitRef = useRef(false);

  // Latest callbacks via refs so marker creation doesn't depend on (and
  // doesn't tear down on) every render — only `places` should rebuild pins.
  const onSelectPlaceRef = useRef(onSelectPlace);
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onSelectPlaceRef.current = onSelectPlace;
    onDismissRef.current = onDismiss;
  }, [onSelectPlace, onDismiss]);

  // Latest filtered set via ref so the async marker-creation callback below
  // (fires on the map's "load" event) can apply the current filters even if
  // they changed between mount and load, without depending on it directly.
  const visiblePlaceIdsRef = useRef(visiblePlaceIds);
  useEffect(() => {
    visiblePlaceIdsRef.current = visiblePlaceIds;
    for (const [placeId, { el }] of Object.entries(markersRef.current)) {
      el.classList.toggle("pin--hidden", !visiblePlaceIds.has(placeId));
    }
  }, [visiblePlaceIds]);

  // Same ref-for-async-load, live-toggle-on-change pattern as
  // visiblePlaceIds — the pin's fill/size encodes the matched experience's
  // season band for the selected month (empty map when month is "Any").
  const seasonBandsRef = useRef(seasonBands);
  useEffect(() => {
    seasonBandsRef.current = seasonBands;
    for (const [placeId, { el }] of Object.entries(markersRef.current)) {
      applySeasonClass(el, seasonBands.get(placeId));
    }
  }, [seasonBands]);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: [101, 15],
      zoom: 5,
      attributionControl: false,
    });
    mapRef.current = map;

    // Tapping empty map dismisses selection, per "Dismiss to None". Marker
    // elements sit above the canvas and stop their own click from bubbling
    // here, so this only fires for genuinely empty map taps.
    map.on("click", () => onDismissRef.current());

    map.on("load", () => {
      const bounds = new maplibregl.LngLatBounds();

      for (const place of places) {
        const el = document.createElement("div");
        const hidden = !visiblePlaceIdsRef.current.has(place.id);
        el.className = `pin ${commitmentClass(place)} ${isVisitedOnly(place) ? "pin--visited" : ""} ${hidden ? "pin--hidden" : ""}`;
        el.innerHTML = `<span class="pin__emoji">${resolvePlaceEmoji(place)}</span>`;
        applySeasonClass(el, seasonBandsRef.current.get(place.id));
        el.addEventListener("click", (event) => {
          event.stopPropagation();
          onSelectPlaceRef.current(place.id);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([place.location.lng, place.location.lat])
          .addTo(map);

        markersRef.current[place.id] = { marker, el };
        bounds.extend([place.location.lng, place.location.lat]);
      }

      if (!bounds.isEmpty() && !hasFitRef.current) {
        hasFitRef.current = true;
        const containerHeight = containerRef.current?.clientHeight ?? 0;
        map.fitBounds(bounds, {
          padding: { top: 70, bottom: containerHeight * 0.55 + 20, left: 40, right: 40 },
          maxZoom: 8,
          duration: 0,
        });
      }
    });

    return () => {
      for (const { marker } of Object.values(markersRef.current)) marker.remove();
      markersRef.current = {};
      map.remove();
      mapRef.current = null;
      hasFitRef.current = false;
    };
  }, [places]);

  // Selection: elevate the picked pin and ease the camera toward it, padded
  // for whatever the sheet currently covers. Never rebuilds markers, never
  // touches zoom — see "Camera" in the design doc.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    for (const [placeId, { el }] of Object.entries(markersRef.current)) {
      el.classList.toggle("pin--selected", placeId === selectedPlaceId);
    }

    if (!selectedPlaceId) return;
    const entry = markersRef.current[selectedPlaceId];
    if (!entry) return;

    const containerHeight = containerRef.current?.clientHeight ?? 0;
    map.easeTo({
      center: entry.marker.getLngLat(),
      padding: { top: 40, bottom: bottomPaddingFor(sheetMode, containerHeight), left: 40, right: 40 },
      duration: 400,
    });
  }, [selectedPlaceId, sheetMode]);

  // MapLibre stamps its own `maplibregl-map` class (position: relative) onto
  // the container it's given, so it can't also be the positioned element —
  // give it a plain child inside our absolutely-positioned wrapper instead.
  return (
    <div className="map">
      <div ref={containerRef} className="map__canvas" />
    </div>
  );
}
