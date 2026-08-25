import type { Card } from "../lib/cards";
import {
  formatDistanceKm,
  formatMonths,
  formatPlanBadge,
  formatVisitBadge,
  mostRecentVisit,
  MONTH_NAMES,
} from "../lib/format";
import { bandForMonth } from "../lib/filters";
import { resolveExperienceEmoji } from "../lib/emoji";
import type { SeasonBandName } from "../types";

const RUNG_CLASS: Record<string, string> = {
  committed: "card--committed",
  year: "card--year",
  month: "card--month",
};

function planRungClass(plan: Card["experience"]["plan"]): string {
  if (!plan) return "";
  if (plan.year != null && plan.month != null) return RUNG_CLASS.committed;
  if (plan.year != null) return RUNG_CLASS.year;
  if (plan.month != null) return RUNG_CLASS.month;
  return "";
}

const BAND_LABEL: Record<SeasonBandName, string> = {
  peak: "Peak",
  mid: "Mid",
  low: "Low season",
  unavailable: "Unavailable",
};

export function PlaceCard({
  card,
  month,
  onSelect,
}: {
  card: Card;
  month: number | null;
  onSelect: () => void;
}) {
  const { place, experience, group, distanceKm, beenBefore } = card;
  const planBadge = formatPlanBadge(experience.plan);
  const visit = mostRecentVisit(experience.visits);
  const emoji = resolveExperienceEmoji(experience, place);
  const peak = experience.seasons.peak;

  // With a month selected, the card answers "is this any good in March?"
  // directly — band + why, colored the same as the pin's fill. With no
  // month selected there's no single band to show, so it falls back to the
  // static peak-months line it always had.
  const band = month != null ? bandForMonth(experience.seasons, month + 1) : null;
  const bandWhy = band ? experience.seasons[band]?.why : undefined;

  return (
    <article
      className={`card ${group === "planned" ? planRungClass(experience.plan) : ""} ${
        group === "visited" ? "card--visited" : ""
      } ${band === "low" ? "card--low-season" : ""}`}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="card__tile" aria-hidden="true">
        {place.photo ? (
          <img src={place.photo.src} alt="" loading="lazy" />
        ) : (
          <span className="card__tile-emoji">{emoji}</span>
        )}
      </div>

      <div className="card__body">
        <header className="card__header">
          <h3 className="card__title">
            {place.name} <span className="card__experience">· {experience.title}</span>
          </h3>
          {planBadge && group === "planned" && (
            <span className="badge badge--plan">{planBadge}</span>
          )}
          {group === "visited" && visit && (
            <span className="badge badge--visited">Visited · {formatVisitBadge(visit)}</span>
          )}
        </header>

        <p className="card__region">{place.region}</p>
        <p className="card__description">{place.description}</p>

        <ul className="card__tags">
          {experience.tags.map((tag) => (
            <li key={tag} className="chip chip--tag">
              {tag}
            </li>
          ))}
        </ul>

        {band && month != null ? (
          <p className={`card__season card__season--${band}`}>
            <span className="card__season-badge">
              {MONTH_NAMES[month]} · {BAND_LABEL[band]}
            </span>
            {bandWhy && <span className="card__season-why"> — {bandWhy}</span>}
          </p>
        ) : (
          peak && <p className="card__season card__season--static">Peak: {formatMonths(peak.months)}</p>
        )}

        <dl className="card__meta">
          <div>
            <dt>Distance</dt>
            <dd>{formatDistanceKm(distanceKm)}</dd>
          </div>
        </dl>

        <footer className="card__footer">
          {beenBefore && group === "planned" && <span className="badge badge--been-before">Been before</span>}
          {place.gmaps && (
            <a
              className="card__gmaps"
              href={place.gmaps}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              Google Maps ↗
            </a>
          )}
        </footer>
      </div>
    </article>
  );
}
