import type { Experience, Place } from "../types";
import { formatDistanceKm, formatPlanBadge, formatTierBand, formatVisit } from "../lib/format";
import { resolveExperienceEmoji } from "../lib/emoji";
import { MonthStrip } from "./MonthStrip";
import { SeasonNotes } from "./SeasonNotes";

// Detail state: full description, month strip, plan, visits, travel note,
// Google Maps link — the sheet's Full content per the design doc.
export function PlaceDetail({
  place,
  experience,
  distanceKm,
  onBackToPlace,
}: {
  place: Place;
  experience: Experience;
  distanceKm: number;
  onBackToPlace: () => void;
}) {
  const planBadge = formatPlanBadge(experience.plan);
  const gmaps = experience.gmaps ?? place.gmaps;

  return (
    <div className="detail">
      <header className="detail__header">
        <span className="detail__emoji" aria-hidden="true">
          {resolveExperienceEmoji(experience, place)}
        </span>
        <div className="detail__heading">
          <button
            type="button"
            className="detail__place-link"
            onClick={onBackToPlace}
            aria-label={`Back to ${place.name}`}
          >
            <span aria-hidden="true">‹</span> {place.name}
          </button>
          <p className="detail__experience">{experience.title}</p>
        </div>
        {planBadge && <span className="badge badge--plan">{planBadge}</span>}
      </header>

      <p className="detail__region">
        {place.region} · {formatTierBand(place.tier)} · {formatDistanceKm(distanceKm)}
      </p>

      <p className="detail__description">{place.description}</p>

      <ul className="detail__tags">
        {experience.tags.map((tag) => (
          <li key={tag} className="chip chip--tag">
            {tag}
          </li>
        ))}
      </ul>

      <section className="detail__section">
        <h3>Months</h3>
        <MonthStrip seasons={experience.seasons} />
        <SeasonNotes seasons={experience.seasons} />
      </section>

      {experience.visits.length > 0 && (
        <section className="detail__section">
          <h3>Visits</h3>
          <ul className="detail__visits">
            {experience.visits.map((visit, i) => (
              <li key={i}>
                {formatVisit(visit)}
                {visit.note && <span className="detail__visit-note"> — {visit.note}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {place.travel && (
        <section className="detail__section">
          <h3>Getting there</h3>
          <p className="detail__travel">{place.travel}</p>
        </section>
      )}

      {gmaps && (
        <a className="detail__gmaps" href={gmaps} target="_blank" rel="noreferrer">
          Open in Google Maps ↗
        </a>
      )}
    </div>
  );
}
