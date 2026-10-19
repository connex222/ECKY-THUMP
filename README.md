# ECKEY THUMP Game Night v0.9 — After Dark

**New:** 1,200 original editorial-draft comedy entries (995 Cheeky or Adult), a no-repeat shuffle deck across repeat matches within one room, a one-card swap per card-based round, and `CONTENT-REVIEW.html` for editorial evaluation.

**Start here:** `START-HERE-v0.9.md`. See `docs/AFTER_DARK_CONTENT_GUIDE.md` for counts, limitations and content ratings.

---

# ECKEY THUMP — Game Night v0.9

An original private multiplayer comedy games-night prototype for 3–12 friends in one or several locations.

## What changed in v0.9

Three new playable challenges have been added, plus new content, multiphase gameplay and finale scoring. Existing character art, QR joining, television display, host controls, avatar selection and private rooms have been preserved.

### Playlists

| Length | Sequence |
| --- | --- |
| 2 rounds | Card Clash → Quick Wit |
| 4 rounds | Card Clash → Quick Wit → Context Collapse → The Last Laugh |
| 6 rounds | Card Clash → Quick Wit → Context Collapse → Double Trouble → Card Clash → The Last Laugh |

See `READ-ME-FIRST.md` and `docs/GAMEPLAY-v0.9.md` for gameplay rules and running instructions.

## Windows

Extract, open the project folder, and double-click `START-GAME-WINDOWS.bat`.

## Development

Requires Node.js 20.11 or later; **no npm install step**.

```sh
node server/index.js
npm test
```

Run at `http://localhost:3000`. The game uses Node's built-in HTTP server and server-sent events rather than external multiplayer dependencies.

## Hosting

The included `render.yaml` is a starting point for deployment. Keep the same game instance alive for all players: rooms are stored in memory. Do not run multiple independent replicas against this prototype.

## Constraints

This is a private prototype. No accounts, payment processing or public matchmaking. Original starter content; not licensed third-party card decks. The in-game filter is not comprehensive content moderation. Do not assume that the Adult-mode confirmation is verified age assurance.

## Test coverage

`npm test` includes engine integration, player privacy, QR and avatar assets, room security, vote weighting, Context Collapse assignment and fallback, Double Trouble validation, finale restrictions and full six-round match completion.
