# ECKY THUMP — user-supplied CSV card import

This importer accepts `id,deck,card_type,text,pick` CSV files and prepares **offline, unapproved** review artefacts. It never changes the live game, sets editorialStatus to `approved`, or distributes the imported text.

## Import locally

```bash
node scripts/stage-party-csv.js /path/to/party_cards.csv /path/to/review-folder \
  --compare /path/to/family-responses-batch-01.json \
  --compare /path/to/family-responses-batch-02.json
```

`--compare` flags exact text overlap with other **unapproved** editorial proposals; the importer also compares against the installed game content. The output directory should remain **outside the public Git repository** and should not be uploaded to GitHub until reuse rights are verified.

Four output files:
- `party-cards-review.html` — searchable review of every card and flag, including 18+ content.
- `party-cards-editorial-review.csv` — original/proposed wording, content rating, outstanding flags and a blank approval column.
- `party-cards-staging.json` — machine-readable, all `draft`, `readyToPublish:false`.
- `import-report.json` — tier totals and review flags.

## Interpretation and editorial policy

Input `Family-friendly`, `Cheeky`, `Very adult` map to the game’s internal `clean`, `cheeky`, `adult`. `Start (black)` maps to `cardPrompts`; `Answer (white)` maps to `responses`. IDs are namespaced (`etsc-csv-0001`, etc.) and original IDs are retained separately. Four consecutive `_` are normalised to the five-underscore placeholder without changing the number of blanks. A trailing full stop is trimmed from answers only, preserving the original in `originalText`.

Prompts requiring **two picks** are flagged for rewriting because ECKY THUMP Social Club uses one blank and one response per card. Answers beyond 45 characters and prompts beyond 90 are flagged. Selected brand or entertainment references, overlaps with established content and repeated response openings are also flagged. Automated format checks cannot prove grammar, originality, comic quality, safety or licence permission.

**Rights:** A file being available on the internet does not establish permission to republish its jokes and other text. Before exposing cards in the public repo, private game or paid product, verify ownership, publication permission, licence terms (including commercial use and attribution) and whether derivative edits are permitted. Until then, preserve the imported text only in the user’s private review pack. Review 18+ cards separately; never mix them into Family lobbies.

The existing Stage 6 plan requires human approval in batches of 100. This import is an extra *source of proposals*, not an approval of either Stage 6 batches or a bypass of the review process. After rights verification, move selected cards into new 100-card review batches, run the editorial/content audits and only then publish.
