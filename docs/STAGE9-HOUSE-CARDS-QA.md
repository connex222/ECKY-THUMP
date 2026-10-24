# ECKY THUMP — Stage 9 House Cards delivery and QA

**24 October 2026.** Social Club preview only; Classic game unchanged.

## Delivered

- Optional host-controlled House Cards mode, **off by default**.
- Each player writes up to five response cards before a match; validation follows the current humour setting, uses grapheme counts for the 45-character limit, and rejects links, contact details and duplicate catalogue text.
- Only an author or the host can remove a card. Host sees an editorial list with owners. Other contestants and television see a count, not the private text. No House Card texts are disclosed in active-game lobby metadata; as in ordinary response-card play, selected cards become visible through their game answers.
- House Cards stay in that room's memory and private room snapshot; they do **not** enter global `server/content.js` packs or another room. Up to one House Card per contestant is shuffled into The Meat Raffle and The Hard Sell hands. They are not used in Last Orders.
- Removing a participant removes their unpublished House Cards. Changing the room's humour rating rejects cards inappropriate for the new level. Other players cannot toggle the feature.
- Fixed Social Club lobby recovery from private `ROOM_DATA_DIR` files. Room expiration removes the room snapshot. Production free Render has **not** been upgraded; a private persistent disk is necessary for restart durability.
- Phone forms use existing accessible controls and the single Social Club stylesheet; all modified assets are cache-busted.

## Verification

- `npm test`: **238 passed, 0 failed** (228 Stage 8 plus ten new tests).
- `npm run audit:content`: passed.
- `npm run audit:approved-content`: passed.
- `npm run audit:more-cards`: passed.
- `npm run simulate:smoke`: passed.
- Covered: host and player actions, authentication, per-player limits, input filtering, moderation and ownership, source isolation, 3/6/12-player dealing, rating changes, pre-match recovery, phone rendering and escaping.

## Outstanding November and release gates

- Real phones/TVs and multi-home networking remain untested with physical players; use `docs/NOVEMBER-ACCEPTANCE.md`.
- User-written material needs human host moderation; simple automatic word filters cannot guarantee safety or detect every abusive or identifying statement.
- Render free-plan filesystem is ephemeral; persistence cannot be guaranteed without paid private persistent storage.
- Our Maureen spoken audio is still absent; optional captions and sound effects remain functional.
- Uploaded third-party comedy-card distribution rights were not independently verified; do not announce commercial launch.
