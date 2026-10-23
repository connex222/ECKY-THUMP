# ECKY THUMP — Stage 6 editorial review

**Batch 01 is DRAFT, unapproved, and deliberately not loaded by the game.** The 100 candidates replace the first 100 Family (`clean`) response entries in the legacy pack by *stable ID* if and only if the user approves this batch in a subsequent stage.

- `family-responses-batch-01-review.html`: mobile-friendly side-by-side review; text search, print support, and unchanged IDs.
- `family-responses-batch-01.csv`: old text → proposed new text ledger (UTF-8 with BOM for Excel); action REWRITE.
- `family-responses-batch-01.json`: canonical machine-checkable draft proposals.
- `npm run audit:premium-batch`: check exactly 100 stable IDs, original text, Family-only tier, max 45 characters, no colons, UK spelling, duplicate text, opening repetition and draft-only state.

The content rules are design constraints, not proof that a joke is funny. Existing live `server/packs/after-dark-v09.json` remains untouched; all 1,200 entries are still drafts. After explicit sign-off, copy approved replacements into the source pack without changing IDs, ratings or gameplay mechanics, update editorialStatus **only for approved replacements**, rerun all tests and content audits, and deploy behind an approved-only policy. Do not merge this review as if it were a released premium pack. Continue with Batch 02 only after approval.
