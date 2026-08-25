#!/usr/bin/env python3
"""A CLI layer over data/places.json, so edits go through commands instead of
hand-editing the JSON. Every mutating command loads the file, applies one
change, saves it, then runs `npm run validate` so mistakes surface right away.

Examples:
  scripts/places.py list
  scripts/places.py show koh-tao
  scripts/places.py add-place --id ao-nang --name "Ao Nang" --region "Krabi, Thailand" \\
      --tier-min weekend --tier-max long --lat 8.0325 --lng 98.8228 --precision exact \\
      --description "Limestone cliffs, easy island-hopping."
  scripts/places.py add-experience ao-nang --id climb --title "Deep water soloing" \\
      --tags bouldering,beach
  scripts/places.py set-season ao-nang climb peak --months 11,12,1,2,3 \\
      --why "Dry season, calm seas."
  scripts/places.py set-plan ao-nang climb --year 2027 --month 1
  scripts/places.py add-visit ao-nang climb --start 2024-02-10 --end 2024-02-14
"""

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "data" / "places.json"
CONFIG_PATH = ROOT / "config.ts"

TIERS = ["quick", "day", "weekend", "long"]
BANDS = ["peak", "mid", "low", "unavailable"]


def load() -> list[dict]:
    with DATA_PATH.open(encoding="utf-8") as f:
        return json.load(f)


def save(places: list[dict]) -> None:
    with DATA_PATH.open("w", encoding="utf-8") as f:
        json.dump(places, f, indent=2, ensure_ascii=False)
        f.write("\n")


def die(message: str) -> None:
    print(f"error: {message}", file=sys.stderr)
    sys.exit(1)


def find_place(places: list[dict], place_id: str) -> dict:
    for place in places:
        if place["id"] == place_id:
            return place
    die(f"no place with id {place_id!r}")


def find_experience(place: dict, experience_id: str) -> dict:
    for exp in place["experiences"]:
        if exp["id"] == experience_id:
            return exp
    die(f"no experience {experience_id!r} on place {place['id']!r}")


def known_tags() -> set[str]:
    """Best-effort parse of the TAGS registry in config.ts, so a typo'd tag
    (e.g. "scuba" instead of "scuba-diving") gets a warning at edit time
    instead of silently splitting a filter in two — see docs/data-model.md."""
    text = CONFIG_PATH.read_text(encoding="utf-8")
    return set(re.findall(r'slug:\s*"([^"]+)"', text))


def check_tags(tags: list[str]) -> None:
    unknown = [t for t in tags if t not in known_tags()]
    if unknown:
        print(f"warning: tag(s) not in config.ts TAGS registry: {', '.join(unknown)}", file=sys.stderr)


def check_season_overlap(experience: dict) -> None:
    seen: dict[int, str] = {}
    for band in BANDS:
        entry = experience["seasons"].get(band)
        if not entry:
            continue
        for month in entry["months"]:
            if month in seen and seen[month] != band:
                print(
                    f"warning: month {month} is in both {seen[month]!r} and {band!r} bands",
                    file=sys.stderr,
                )
            seen[month] = band


def run_validate() -> None:
    result = subprocess.run(["npm", "run", "validate"], cwd=ROOT, capture_output=True, text=True)
    print(result.stdout.strip())
    if result.returncode != 0:
        print(result.stderr.strip(), file=sys.stderr)


def parse_months(raw: str) -> list[int]:
    months = [int(m) for m in raw.split(",")]
    for m in months:
        if not 1 <= m <= 12:
            die(f"month {m} out of range (1-12)")
    return months


# --- commands ---


def cmd_list(args, places: list[dict]) -> bool:
    for place in places:
        tier = place["tier"]
        tier_str = tier["min"] if tier["min"] == tier["max"] else f"{tier['min']}-{tier['max']}"
        exp_count = len(place["experiences"])
        print(f"{place['id']:<20} {place['name']:<24} {place['region']:<28} {tier_str:<12} {exp_count} exp")
    return False


def cmd_show(args, places: list[dict]) -> bool:
    place = find_place(places, args.place)
    if args.experience:
        print(json.dumps(find_experience(place, args.experience), indent=2, ensure_ascii=False))
    else:
        print(json.dumps(place, indent=2, ensure_ascii=False))
    return False


def cmd_add_place(args, places: list[dict]) -> bool:
    if any(p["id"] == args.id for p in places):
        die(f"place {args.id!r} already exists")

    place = {
        "id": args.id,
        "name": args.name,
        "region": args.region,
        "tier": {"min": args.tier_min, "max": args.tier_max},
        "location": {"lat": args.lat, "lng": args.lng, "precision": args.precision},
    }
    if args.gmaps:
        place["gmaps"] = args.gmaps
    place["description"] = args.description
    if args.travel:
        place["travel"] = args.travel
    if args.emoji:
        place["emoji"] = args.emoji
    place["experiences"] = []

    places.append(place)
    print(f"added place {args.id!r} (no experiences yet — a place needs at least one to validate)")
    return True


def cmd_remove_place(args, places: list[dict]) -> bool:
    place = find_place(places, args.place)
    places.remove(place)
    print(f"removed place {args.place!r}")
    return True


def cmd_set_place(args, places: list[dict]) -> bool:
    place = find_place(places, args.place)
    changed = False
    for field in ["name", "region", "description", "travel", "gmaps", "emoji"]:
        value = getattr(args, field)
        if value is not None:
            place[field] = value
            changed = True
    if args.tier_min or args.tier_max:
        place["tier"] = {
            "min": args.tier_min or place["tier"]["min"],
            "max": args.tier_max or place["tier"]["max"],
        }
        changed = True
    if not changed:
        die("no fields given to update")
    print(f"updated place {args.place!r}")
    return True


def cmd_add_experience(args, places: list[dict]) -> bool:
    place = find_place(places, args.place)
    if any(e["id"] == args.id for e in place["experiences"]):
        die(f"experience {args.id!r} already exists on {args.place!r}")

    tags = [t.strip() for t in args.tags.split(",") if t.strip()]
    check_tags(tags)

    experience = {
        "id": args.id,
        "title": args.title,
        "tags": tags,
        "seasons": {},
        "plan": None,
        "visits": [],
    }
    if args.gmaps:
        experience["gmaps"] = args.gmaps

    place["experiences"].append(experience)
    print(f"added experience {args.id!r} to {args.place!r} (no seasons yet — use set-season)")
    return True


def cmd_remove_experience(args, places: list[dict]) -> bool:
    place = find_place(places, args.place)
    experience = find_experience(place, args.experience)
    place["experiences"].remove(experience)
    print(f"removed experience {args.experience!r} from {args.place!r}")
    return True


def cmd_set_experience(args, places: list[dict]) -> bool:
    place = find_place(places, args.place)
    experience = find_experience(place, args.experience)
    changed = False
    if args.title is not None:
        experience["title"] = args.title
        changed = True
    if args.tags is not None:
        tags = [t.strip() for t in args.tags.split(",") if t.strip()]
        check_tags(tags)
        experience["tags"] = tags
        changed = True
    if args.gmaps is not None:
        experience["gmaps"] = args.gmaps
        changed = True
    if not changed:
        die("no fields given to update")
    print(f"updated experience {args.experience!r} on {args.place!r}")
    return True


def cmd_set_season(args, places: list[dict]) -> bool:
    place = find_place(places, args.place)
    experience = find_experience(place, args.experience)
    band = {"months": sorted(set(parse_months(args.months)))}
    if args.why:
        band["why"] = args.why
    experience["seasons"][args.band] = band
    check_season_overlap(experience)
    print(f"set {args.band!r} season on {args.place}/{args.experience}")
    return True


def cmd_remove_season(args, places: list[dict]) -> bool:
    place = find_place(places, args.place)
    experience = find_experience(place, args.experience)
    if experience["seasons"].pop(args.band, None) is None:
        die(f"experience {args.experience!r} has no {args.band!r} band")
    print(f"removed {args.band!r} season from {args.place}/{args.experience}")
    return True


def cmd_set_plan(args, places: list[dict]) -> bool:
    place = find_place(places, args.place)
    experience = find_experience(place, args.experience)
    if args.clear:
        experience["plan"] = None
    else:
        current = experience["plan"] or {"year": None, "month": None}
        experience["plan"] = {
            "year": args.year if args.year is not None else current["year"],
            "month": args.month if args.month is not None else current["month"],
        }
    print(f"set plan on {args.place}/{args.experience}: {experience['plan']}")
    return True


def cmd_add_visit(args, places: list[dict]) -> bool:
    place = find_place(places, args.place)
    experience = find_experience(place, args.experience)
    visit = {"start": args.start}
    if args.end:
        visit["end"] = args.end
    if args.note:
        visit["note"] = args.note
    if args.log:
        visit["log"] = args.log
    experience["visits"].append(visit)
    print(f"added visit to {args.place}/{args.experience}: {args.start}")
    return True


def cmd_remove_visit(args, places: list[dict]) -> bool:
    place = find_place(places, args.place)
    experience = find_experience(place, args.experience)
    if not 0 <= args.index < len(experience["visits"]):
        die(f"visit index {args.index} out of range (0-{len(experience['visits']) - 1})")
    removed = experience["visits"].pop(args.index)
    print(f"removed visit from {args.place}/{args.experience}: {removed}")
    return True


def cmd_validate(args, places: list[dict]) -> bool:
    run_validate()
    return False


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("list", help="list all places").set_defaults(func=cmd_list)

    p = sub.add_parser("show", help="print a place (or one of its experiences) as JSON")
    p.add_argument("place")
    p.add_argument("experience", nargs="?")
    p.set_defaults(func=cmd_show)

    p = sub.add_parser("add-place", help="add a new place")
    p.add_argument("--id", required=True)
    p.add_argument("--name", required=True)
    p.add_argument("--region", required=True)
    p.add_argument("--tier-min", required=True, choices=TIERS)
    p.add_argument("--tier-max", required=True, choices=TIERS)
    p.add_argument("--lat", required=True, type=float)
    p.add_argument("--lng", required=True, type=float)
    p.add_argument("--precision", required=True, choices=["exact", "approximate"])
    p.add_argument("--description", required=True)
    p.add_argument("--gmaps")
    p.add_argument("--travel")
    p.add_argument("--emoji")
    p.set_defaults(func=cmd_add_place)

    p = sub.add_parser("remove-place", help="remove a place")
    p.add_argument("place")
    p.set_defaults(func=cmd_remove_place)

    p = sub.add_parser("set-place", help="edit a place's fields")
    p.add_argument("place")
    p.add_argument("--name")
    p.add_argument("--region")
    p.add_argument("--description")
    p.add_argument("--travel")
    p.add_argument("--gmaps")
    p.add_argument("--emoji")
    p.add_argument("--tier-min", choices=TIERS)
    p.add_argument("--tier-max", choices=TIERS)
    p.set_defaults(func=cmd_set_place)

    p = sub.add_parser("add-experience", help="add an experience to a place")
    p.add_argument("place")
    p.add_argument("--id", required=True)
    p.add_argument("--title", required=True)
    p.add_argument("--tags", required=True, help="comma-separated, e.g. scuba-diving,beach")
    p.add_argument("--gmaps")
    p.set_defaults(func=cmd_add_experience)

    p = sub.add_parser("remove-experience", help="remove an experience from a place")
    p.add_argument("place")
    p.add_argument("experience")
    p.set_defaults(func=cmd_remove_experience)

    p = sub.add_parser("set-experience", help="edit an experience's fields")
    p.add_argument("place")
    p.add_argument("experience")
    p.add_argument("--title")
    p.add_argument("--tags", help="comma-separated, replaces the full tag list")
    p.add_argument("--gmaps")
    p.set_defaults(func=cmd_set_experience)

    p = sub.add_parser("set-season", help="set (or replace) a season band on an experience")
    p.add_argument("place")
    p.add_argument("experience")
    p.add_argument("band", choices=BANDS)
    p.add_argument("--months", required=True, help="comma-separated 1-12, e.g. 3,4,5")
    p.add_argument("--why")
    p.set_defaults(func=cmd_set_season)

    p = sub.add_parser("remove-season", help="remove a season band from an experience")
    p.add_argument("place")
    p.add_argument("experience")
    p.add_argument("band", choices=BANDS)
    p.set_defaults(func=cmd_remove_season)

    p = sub.add_parser("set-plan", help="set or clear an experience's plan")
    p.add_argument("place")
    p.add_argument("experience")
    p.add_argument("--year", type=int)
    p.add_argument("--month", type=int, choices=range(1, 13))
    p.add_argument("--clear", action="store_true", help="clear the plan entirely (plan: null)")
    p.set_defaults(func=cmd_set_plan)

    p = sub.add_parser("add-visit", help="add a visit to an experience")
    p.add_argument("place")
    p.add_argument("experience")
    p.add_argument("--start", required=True, help="YYYY-MM-DD or YYYY-MM")
    p.add_argument("--end")
    p.add_argument("--note")
    p.add_argument("--log")
    p.set_defaults(func=cmd_add_visit)

    p = sub.add_parser("remove-visit", help="remove a visit by its index (see `show`)")
    p.add_argument("place")
    p.add_argument("experience")
    p.add_argument("index", type=int)
    p.set_defaults(func=cmd_remove_visit)

    sub.add_parser("validate", help="run npm run validate against places.json").set_defaults(func=cmd_validate)

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    places = load()
    changed = args.func(args, places)
    if changed:
        save(places)
        run_validate()


if __name__ == "__main__":
    main()
