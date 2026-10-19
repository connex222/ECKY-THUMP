# ECKEY THUMP v0.9 — Start Here

This release adds **1,200 original editorial-draft entries** to the five-challenge private games-night game. Of those, **995 are Cheeky or Adult**.

## Play the game on Windows

1. Right-click the ZIP and choose **Extract All**.
2. Open the folder `ECKEY-THUMP-Game-Night-v0.9`.
3. Double-click `START-GAME-WINDOWS.bat` (requires Node.js 20 or newer).
4. Open the game in the browser, make a private room and choose **Cheeky** or **Adult** (adults only).
5. Invite two or more friends by room code or QR. For friends in other houses, deploy to Render and share the public HTTPS game address.

## Review all the new jokes

Double-click **`CONTENT-REVIEW.html`**. Filter by humour level/challenge type and click **Keep** or **Rewrite**. Export the decisions to a JSON file. This is separate from the live game and does not automatically delete cards.

## Changes from v0.8

- Exactly 1,200 additional original text entries in `server/packs/after-dark-v09.json`.
- 720 additional response cards, plus 150 Card Clash prompts and 110 Quick Wit questions.
- 165 additional prompts across Context Collapse, Double Trouble and The Last Laugh.
- 25 finale forced words and 30 Chaos Contracts.
- Shuffle-and-discard response deck persists across repeat games in the *same* room.
- No repeat prompt, finale word or modifier until that pool is exhausted in the room.
- **One-card swap** once per Card Clash and Double Trouble round before submitting.
- Existing avatars, QR joining, TV presentations, privacy checks, scoring and private multiplayer retained.
- All material is in **draft form until human review and party playtests**.

See `docs/AFTER_DARK_CONTENT_GUIDE.md`, `docs/COMEDY_GAME_RESEARCH.md` and `docs/GAME_NIGHT_V09_TEST_PLAN.md`.
