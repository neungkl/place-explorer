import type { Place } from "../types";
import {
  formatDistanceKm,
  formatMonths,
  formatPlanBadge,
  formatTierBand,
  formatVisitBadge,
  mostRecentVisit,
} from "../lib/format";
import { resolveExperienceEmoji, resolvePlaceEmoji } from "../lib/emoji";

// Selected state's disambiguator: one row per experience at this place, per
// the design doc's "Pin tap: selection, preview, detail" — a pin can resolve
// to several cards, so the tap opens a picker rather than guessing one.
export function PlacePreview({
  place,
  distanceKm,
  onSelectExperience,
}: {
  place: Place;
  distanceKm: number;
  onSelectExperience: (experienceId: string) => void;
}) {
  return (
    <div className="preview">
      <div className="preview__summary">
        <div className="preview__tile" aria-hidden="true">
          {place.photo ? (
            <img src={place.photo.src} alt="" />
          ) : (
            <span>{resolvePlaceEmoji(place)}</span>
          )}
        </div>
        <div>
          <h2 className="preview__name">{place.name}</h2>
          <p className="preview__region">{place.region}</p>
          <p className="preview__meta">
            {formatTierBand(place.tier)} · {formatDistanceKm(distanceKm)}
          </p>
        </div>
      </div>

      {place.location.precision === "approximate" && (
        <p className="preview__approx">Approximate location</p>
      )}

      <ul className="preview__rows">
        {place.experiences.map((experience) => {
          const planBadge = formatPlanBadge(experience.plan);
          const visit = mostRecentVisit(experience.visits);
          const peak = experience.seasons.peak;

          return (
            <li key={experience.id}>
              <button
                type="button"
                className="preview__row"
                onClick={() => onSelectExperience(experience.id)}
              >
                <span className="preview__row-emoji" aria-hidden="true">
                  {resolveExperienceEmoji(experience, place)}
                </span>
                <span className="preview__row-body">
                  <span className="preview__row-title">{experience.title}</span>
                  <span className="preview__row-sub">
                    {peak ? `Peak: ${formatMonths(peak.months)}` : "No peak season set"}
                  </span>
                </span>
                {planBadge && <span className="badge badge--plan">{planBadge}</span>}
                {!planBadge && visit && (
                  <span className="badge badge--visited">Visited · {formatVisitBadge(visit)}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
