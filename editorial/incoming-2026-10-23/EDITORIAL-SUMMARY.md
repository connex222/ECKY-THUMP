# ECKY THUMP — additional cards received 23 October 2026

**200 new items staged as drafts only. Nothing added to the live game's playable decks.** The CSV files are preserved without text edits, and each item has a unique six-digit numeric source ID mapped to a stable `etsc-more-` internal ID.

## Summary

| Input | Family | Cheeky | After Dark | Total |
|---|---:|---:|---:|---:|
| Ordinary answers | 60 | 15 | 0 | 75 |
| Ordinary one-blank prompts | 25 | 0 | 0 | 25 |
| Free-text game prompts (WIT, CONTEXT, DOUBLE, FINAL) | 40 | 0 | 0 | 40 |
| Compulsory words | 15 | 10 | 10 | 35 |
| Answer-style instructions | 10 | 8 | 7 | 25 |
| **Total** | **150** | **33** | **17** | **200** |

**191 clear of automated flags; 9 require a targeted editorial check.** The original 650-item approved overlay remains unchanged. Format-clear does not guarantee good humour or suitable permissions.

## Nine flagged entries and optional replacements

These are **suggestions only** and have NOT been substituted in `candidates.json` or either original CSV.

| Source ID | Reason | Original | Possible alternative |
|---|---|---|---|
| 100063 | Duplicate existing Family fill-in prompt | The village fête was cancelled because of _____. | The village fête lost its marquee because of _____. |
| 100072 | Four-word opening overused | The brass band's new number is a tribute to _____. | Tonight's brass-band number celebrates _____. |
| 200001 | Family-rated drink reference | Name the social club's new signature cocktail. | Name the social club's new signature mocktail. |
| 200011 | Overused opening | Write an innocent line overheard at the village fête. | Give a harmless remark heard at the village fête. |
| 200015 | Overused opening | Write an innocent line from a vicar's sermon. | Quote a harmless line from the vicar's sermon. |
| 200017 | Overused opening | Write an innocent line said while building flatpack furniture. | What innocent thing was said during flatpack assembly? |
| 200049 | Duplicate older draft compulsory word | scone | flapjack |
| 200058 | Duplicate older draft compulsory word | snog | lovebite |
| 200067 | Duplicate older draft compulsory word | hangover | afterparty |

All suggestions should be checked for uniqueness, age rating and comedy quality again before publication.

## Exact flow for approval and publication

1. Review `review.html` or fill out `editorial-ledger.csv` (use `approve`, `revise` or `reject`).
2. Confirm that you wrote the material or have permission for redistribution, adaptation and possible paid distribution.
3. Approve the 200 cards, including final decisions on the nine flagged entries (or approve a subset explicitly).
4. Resolve duplicates, update the original-versus-approved audit ledger, rerun automated and editorial checks.
5. Promote only the approved entries into `server/packs/social-club-approved-v1.json` and update the approved content count assertion and release notes; do not change game rules.
6. Deploy and verify Render, then conduct physical-device multiplayer tests in November.

## Validation

`npm test`: **206 passing** (201 existing + five tests for this staged import).

`npm run audit:more-cards`: all 200 are drafts and source files exactly match the review JSON.

`npm run audit:approved-content`, `npm run audit:content`, and `npm run simulate:smoke` also completed successfully.
