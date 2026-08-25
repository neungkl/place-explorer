# Adding places or experiences (AI agent guide)

Step-by-step recipe for adding/editing wishlist entries in `data/places.json`. Written for an AI agent to follow directly — every step is a runnable command.

## Rule 0: never hand-edit `data/places.json`

Always go through [`scripts/places.py`](../scripts/places.py). It saves the file and immediately runs `npm run validate` after every mutating command, so mistakes surface right away instead of silently corrupting the dataset.

```bash
python3 scripts/places.py --help          # full command list + examples
python3 scripts/places.py <command> --help  # flags for one command
```

## Recipe: adding a brand-new place

1. **Research the destination** — region, coordinates, why it's worth going, travel logistics from home base, and (most importantly — see step 5) its seasonal pattern: when conditions are best/worst, why, and whether the activity actually stops at any point in the year or just gets worse.
2. **Check the tag registry** before picking experience tags — a tag not in `TAGS` in [`config.ts`](../config.ts) will warn (not block) but is a typo risk:
   ```bash
   grep -A2 'slug:' config.ts
   ```
   If nothing existing fits, add a one-line entry to `TAGS` in `config.ts` rather than inventing an unregistered tag.
3. **Add the place:**
   ```bash
   python3 scripts/places.py add-place \
     --id <slug> --name "<Name>" --region "<Region, Country>" \
     --tier-min <quick|day|weekend|long> --tier-max <quick|day|weekend|long> \
     --lat <lat> --lng <lng> --precision <exact|approximate> \
     --description "<one or two sentences>" \
     --travel "<how to get there from home base>" \
     [--gmaps "<url>"] [--emoji "<emoji>"]
   ```
   - `id` is a stable slug, globally unique, kebab-case.
   - `precision` must be `exact` if `tier-min` is anything below `long` (schema-enforced).
   - This step alone will fail `npm run validate` (a place needs ≥1 experience) — expected, continue to step 4.
4. **Add at least one experience** (a place is one pin; an experience is one reason to go):
   ```bash
   python3 scripts/places.py add-experience <place-id> \
     --id <exp-id> --title "<Title>" --tags <tag1,tag2> [--gmaps "<url>"]
   ```
5. **Add season bands — the single most important, most error-prone field in the whole entry.** Everything else (description, travel, tags) is easy to get roughly right from one source; seasons are the one field the user actually plans a trip around, and it's the easiest to get subtly wrong by generalizing instead of checking the specific place. Treat it accordingly:

   - **Search specifically, not generically.** "Thailand monsoon season" is not "Samaesan diving season" — a Gulf-of-Thailand site and an Andaman-side site can have opposite calendars a few hundred km apart. Search for the site/activity by name, not just the country/region.
   - **Cross-check with at least two independent sources** before committing to a band split, and prefer sources specific to the activity (a dive shop's conditions page, a trek operator's season guide) over generic tourism-board blurbs.
   - **`unavailable` means genuinely can't happen, not just worse.** Don't reach for it because conditions are bad — check whether trips/operators actually stop running (permits close, parks close, boats stop, trails close) versus just running at reduced quality (choppier seas, lower visibility, muddier trails). Reduced-but-still-happening is `low`, not `unavailable`. Getting this wrong once already happened in this dataset: Samaesan diving was initially marked `unavailable` for six months by copying a generic "SW monsoon closes diving" assumption, when in fact the eastern seaboard is sheltered and trips run year-round at reduced quality — it should have been `low`, not `unavailable`. Confirm an `unavailable` claim explicitly before writing it.
   - **Use as many bands as the evidence actually supports** — not a template. Two bands (peak + unavailable) is fine if sources only draw a clean two-way split; four bands is fine if they describe a real shoulder season and a real-but-diminished low season. Don't force a fixed number of bands, and don't invent a `mid`/`low` distinction sources don't support — but don't collapse a real distinction into two bands for tidiness either.
   - `months` (1–12) across all bands present must together cover all 12 months exactly, no gaps or overlaps — `npm run validate` and `check-season-overlap` warnings will catch this. Always include a one-line `why`; it's required for `unavailable` and shown to the user in the UI, so make it specific and factual (what actually changes — visibility numbers, rainfall, closures — not just "bad weather").
   ```bash
   python3 scripts/places.py set-season <place-id> <exp-id> peak \
     --months 11,12,1,2,3 --why "Dry season: calm seas, 20m+ visibility."
   python3 scripts/places.py set-season <place-id> <exp-id> low \
     --months 6,7,8,9 --why "SW monsoon: choppier seas, 5-10m visibility, but boats still run."
   ```
   If you later learn a season claim was wrong (the user corrects it, or your own research turns up a conflict), fix it immediately with `set-season`/`remove-season` — don't leave a known-wrong season band in place for a "later cleanup."
6. **Leave `plan` and `visits` alone** unless the user explicitly says this trip is booked or already happened — a freshly-researched place is a wishlist entry, nothing more. (`set-plan` / `add-visit` exist for when the user does say so.)
7. **Verify:**
   ```bash
   python3 scripts/places.py show <place-id>
   npm run validate
   ```
8. **Do not commit** unless the user asked you to — leave the change staged/uncommitted and report what you added so they can review it first, same as any other code change.

## Recipe: adding an experience to an existing place

Same as steps 4–7 above, targeting the existing `<place-id>`.

## Editing or removing

```bash
python3 scripts/places.py set-place <place-id> --description "..." [...]
python3 scripts/places.py set-experience <place-id> <exp-id> --title "..." [...]
python3 scripts/places.py remove-season <place-id> <exp-id> <band>
python3 scripts/places.py remove-experience <place-id> <exp-id>
python3 scripts/places.py remove-place <place-id>
```

## Field reference

See [Data model](./data-model.md) for the full schema, field-by-field rationale, and an annotated example entry.

## Researching a real place

Prefer running the research yourself with web search/fetch tools available in this session. For a large or open-ended research task, spawning a background agent with a fully self-contained prompt (place name, what to research, which `scripts/places.py` commands to use, explicit instruction not to call `set-plan`/`add-visit`/`git commit`) works well — review its diff before committing either way.
