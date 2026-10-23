# ECKY THUMP — 200 incoming cards, Stage 6 editorial review

**Status: DRAFT — not approved, not published, not loaded into the game.**

The files received on 23 October 2026 contain exactly 200 entries:

- `party_more_cards.csv`: 75 response cards (60 Family, 15 Cheeky), 25 Family one-blank prompts.
- `party_more_modes.csv`: 10 Family `witPrompts`, 10 Family `contextPrompts`, 10 Family `doublePrompts`, 10 Family `finalPrompts`, 35 `finalWords` across three ratings, and 25 `contracts` across three ratings.

`candidates.json` preserves the original texts and unique source IDs; each entry has `editorialStatus: draft`, `readyToPublish: false`, `approval: pending` and `licence: unverified`. No wording is automatically altered. The new internal IDs begin `etsc-more-`.

`review.html` is a searchable, self-contained document. `editorial-ledger.csv` includes a blank `editor_decision` field. `summary.json` records rating and issue counts.

**9 entries have automatic flags:** one repeated Family prompt, three duplicate older Last Orders words (*scone*, *snog*, *hangover*), four overused four-word openings and one Family-rated reference to a cocktail. The flagged entries require human editorial decisions; 191 others have no *automatic* flags but still need quality, age-rating and permission checks. These are **not nine necessarily unacceptable cards**.

Run `npm run audit:more-cards` to verify exact reproducibility from the two CSVs; `npm test` validates invariants. No stage script modifies `server/packs/social-club-approved-v1.json` or production assets. After approval, resolve the flagged 9 first, preserve an old→new ledger, deduplicate against the live and draft catalogues and only then add approved entries to the runtime approved pack.

## Reuse rights

The uploaded CSVs contain no third-party provenance/rights statement. Confirm original authorship or a licence that permits adaptation, public hosting and potential paid distribution before commercial publication.
