# ECKY THUMP — 200 additional cards (approved and released)

**Status: APPROVED — 23 October 2026.** The original `candidates.json` and source CSVs
are retained **unchanged** as evidence of the submitted draft. `candidates.json` still
contains `draft` / `published:false` because it is the historical review snapshot.
The current live wording is in `server/packs/social-club-approved-v1.json`.

All 200 source IDs are approved. Nine flagged entries were replaced with the
proposed alternatives in `EDITORIAL-SUMMARY.md`; the final decisions appear in
`approved-ledger.csv` and `approved-summary.json`.

- `party_more_cards.csv`: 75 answers and 25 one-blank prompts.
- `party_more_modes.csv`: 40 writing prompts, 35 Last Orders words, 25 contracts.
- `candidates.json`: immutable historical 200-item draft review.
- `approved-ledger.csv`: 200-row source-to-approved map, showing nine changes.
- `approved-summary.json`: aggregated release counts and rights status.

`npm run audit:more-cards` ensures the preserved CSVs reproduce their original
review snapshots without self-collisions; `npm run audit:approved-content`
validates 850 approved entries. The old 1,200-card expansion remains unchanged.

**Permissions:** User editorial approval was received. The original CSVs do not
record external copyright provenance, so redistribution and possible commercial
usage rights have not been independently verified. Do not assert otherwise.
