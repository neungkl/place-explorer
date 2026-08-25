import type { Card } from "../lib/cards";
import { PlaceCard } from "./PlaceCard";

function section(
  title: string,
  cards: Card[],
  month: number | null,
  onSelectCard: (placeId: string, experienceId: string) => void,
) {
  if (cards.length === 0) return null;
  return (
    <section className="list-section" key={title}>
      <h2 className="list-section__title">
        {title} <span className="list-section__count">· {cards.length}</span>
      </h2>
      <div className="list-section__cards">
        {cards.map((card) => (
          <PlaceCard
            key={`${card.place.id}/${card.experience.id}`}
            card={card}
            month={month}
            onSelect={() => onSelectCard(card.place.id, card.experience.id)}
          />
        ))}
      </div>
    </section>
  );
}

export function PlaceList({
  cards,
  month,
  onSelectCard,
}: {
  cards: Card[];
  month: number | null;
  onSelectCard: (placeId: string, experienceId: string) => void;
}) {
  const planned = cards.filter((c) => c.group === "planned");
  const someday = cards.filter((c) => c.group === "someday");
  const visited = cards.filter((c) => c.group === "visited");
  const placeCount = new Set(cards.map((c) => c.place.id)).size;

  // An always-visible count matters — easy to filter yourself into an empty
  // map/list and not realize why. Lives at the top of the list rather than
  // in the floating bar over the map, per the design doc's Filters section.
  const count = (
    <p className="place-list__count">
      {cards.length} ways to go · {placeCount} places
    </p>
  );

  if (cards.length === 0) {
    return (
      <div className="place-list place-list--empty">
        {count}
        <p>Nothing matches your filters.</p>
      </div>
    );
  }

  return (
    <div className="place-list">
      {count}
      {section("Planned", planned, month, onSelectCard)}
      {section("Someday", someday, month, onSelectCard)}
      {section("Visited", visited, month, onSelectCard)}
    </div>
  );
}
