# ECKY THUMP

**Version 1.8.3 — Neon Arena + optional Game Cards, read-only TV links, SSE reconnect fixes and editorial review tooling.** A private browser-based comedy party game for 3–12 players and up to 30 audience members. Players use their phones; a separate browser tab or TV can show the shared stage. No paid services or accounts are required for local play.

**Language and branding:** All player-facing text uses UK English and the official name **ECKY THUMP**. Legacy API identifiers (such as `ECKEY_AVATARS`) remain stable to protect compatibility. See `docs/UK-ENGLISH-STYLE.md`.

## Requirements

- Node.js **20.11+** (22 LTS recommended)
- Windows, macOS or Linux, plus a current mobile browser
- A shared Wi-Fi network for local games, or a hosted HTTPS URL for different homes

## Start the game

**Windows:** extract the project and double-click `START-GAME-WINDOWS.bat`. The launcher checks Node, chooses an available port, starts the server, waits for `/api/health` and opens your browser. The URL printed by the launcher can be used on the same Wi-Fi. Never use `localhost` in an invite link for a different phone.

**macOS / Linux / manual:**

```bash
node --version          # >= 20.11
npm test
npm start               # defaults to port 3000; use PORT=3001 if needed
```

No runtime npm dependencies are used at present. Install dependencies only if future releases add a `package-lock.json`. Once the server is running, open `http://localhost:3000` on the host PC or the advertised LAN address on your other devices.

## How to play

1. **Host** creates a private room, chooses content rating (Clean, Cheeky or Adult), length (2, 4 or 6 rounds), pace, nickname and avatar.
2. **Optional:** enable **Game Cards** in the lobby to add playable disruptions, strategic bets and comeback effects. Disabled by default until playtested.
3. Invite at least two friends with the QR code or room code; open a separate read-only TV view from host controls.
4. Players complete challenges and anonymously vote Gold (2 weight) and Silver (1 weight). No self-voting.
5. Results add base points. A Game Card can apply a **separate bounded bonus or penalty**. The Last Laugh finale doubles base scoring but never Game Card bonuses.

### The five challenges

| Challenge | Format |
|---|---|
| Card Clash | Choose the funniest response from 7 private cards |
| Quick Wit | Write an original punchline |
| Context Collapse | Write an innocent line, then twist someone else's |
| Double Trouble | Choose a response card and add your own sales pitch |
| The Last Laugh | Mandatory word and double base points |

### Game Cards (optional)

Fifteen **separate playable-effect cards**, not the shared comedy-response deck. Five Chaos effects, five Tactical gambles, five Equalisers for trailing contestants. The rules are server-authoritative. Players can hold two, play one per round and two per match, and a global Chaos effect can fire at most once per round. Use the visible **quick-play bar** for immediately available powers, or open the collapsible **POWER-UPS** tray for descriptions, predictions and card replacement. Server-validated availability tells you when a card cannot be played. You may replace one held Game Card per active round if its current effect is unsuitable. Equalisers automatically activate once earned; they never change the finale. Early disruption windows are 10–12 seconds; Fast Fingers has 12 seconds (Lively) or 20 seconds (Relaxed) **after activation** to submit, and still requires a Gold vote. Host pauses freeze all power-up clocks. An activated Fast Fingers power shows its own private bonus countdown on the controller. See `docs/GAME-CARDS.md` for detailed rules.

### Hosting and security

The server uses native Node.js HTTP, REST and Server-Sent Events (SSE)—**not WebSockets or Express**. Session tokens are stored locally in each controller; refresh or reconnect restores the seat for that running room. Room state lives in memory and disappears when the server restarts. TV links are private bearer tokens; do not share them publicly. Adult mode requires affirmative 18+ confirmation and has limited content moderation. The host can hide entries and remove players between games.

## Source architecture

- `server/index.js`: HTTP router, static file delivery, authentication, SSE connections, room lifetime
- `server/game.js`: gameplay phases, scoring, question/response decks, snapshots
- `server/content.js` + `server/packs/`: comedy content and optional Game Card catalogue
- `server/game-cards.js`: validation, draw limits, effects and Equaliser grants
- `server/telemetry.js`: bounded in-memory anonymous gameplay diagnostics
- `public/index.html` + `public/assets/app.js`: mobile controller
- `public/tv/index.html` + `public/assets/tv.js`: TV/stage UI
- `test/`: Node built-in unit/integration tests, including avatar integrity checks

All existing avatar files, IDs, bindings and rendering functions are preserved by the v1.7 expansion.

## Tests, telemetry and troubleshooting

```bash
npm test
node --check server/game-cards.js
node --check server/index.js
```

The room host can request telemetry with `GET /api/rooms/ROOMCODE/telemetry` using their Bearer session token. It contains only event types, card IDs, durations and predefined error categories; no jokes, IPs or player names. Events are deleted on restart or room expiration. Use it for local playtests, not persistent user tracking.

If another device cannot join, check that all local devices are on the same LAN, that Windows Firewall permits Node, and that you shared the LAN URL instead of `localhost`. If the port is occupied, the Windows launcher chooses another port automatically; otherwise set `PORT`. Render hosting uses `npm start` and a persistent Node process; verify the Render build/deploy status separately after pushing updates.

## Further reading

- `CHANGELOG.md`: consolidated version history
- `docs/ARCHITECTURE.md`: lifecycle, endpoints and authority rules
- `docs/GAME-CARDS.md`: mechanics, risks, limits and tester checklist
- `docs/SIMULATION-v1.7.1.md`: earlier 1,080-match smoke test and caveats
- `docs/SIMULATION-v1.8.md`: follow-up mechanical comparison of games with and without powers
- `docs/archive/`: historical version guides and design notes

## v1.8.2 testing limits

The game has automated engine, route and content-lint checks. Real-phone multiplayer, living-room TV readability and human-perceived Game Card fairness still need physical playtesting. Do not interpret passing simulated tests as proof of a good games-night experience. Ballots are locked on submission; users can retry the *same* ballot but cannot change it. Game Cards remain opt-in for hosts.

## v1.8.3 pre-November readiness

- TV access tokens cannot mutate the lobby. Each distinct TV token has an independent SSE stream (up to the existing display-token limit); a reconnect replaces only a stream for the same TV token or participant seat.
- Run npm run audit:content for structural failures and npm run review:content for an editorial triage summary (node scripts/review-content.js --all prints the full queue). **All 1,200 draft entries still require human approval.** This tool never publishes or rewrites jokes.
- Run npm run simulate:smoke for a repeatable synthetic Game Card run, or node scripts/simulate-game-cards.js 12 20261021 for a larger sample. Synthetic results do not establish enjoyment or fairness.
- The current Render deploy remains in-memory and cannot recover active matches from a restart. Durable storage requires a privacy and hosting decision, not an unreviewed file dump of adult game answers.
- See docs/NOVEMBER-PLAYTEST-HANDOFF.md for deferred physical-device tests and launch gates.


## Social Club v2 engine preview — work in progress

The premium rewrite is being developed in stages. **This is not the finished v2 game**, and the default v1.8.3 experience is unchanged. The Stage 2 engine adds serial TV-answer-reveal states, head-to-head assignments, server-locked A/B ballots, moderated entries, capped audience voting, and private JSON room recovery. It is gated behind an explicit environment setting and has **no public phone/TV controls yet**.

For technical testing only, set `SOCIAL_CLUB_PREVIEW=1` and `ROOM_DATA_DIR` to a private writable directory, run `npm start`, and create an API room with `socialClub: true`. Complete instructions, scoring and caveats are in `DESIGN.md`. **Never commit files from `data/rooms/`**: they contain names and player-written answers, although session secrets remain hashed.

Run `npm test` for both current-game and Social Club tests. Real-phone multiplayer sign-off remains deferred until November 2026. The existing Render service does not automatically acquire durable room storage just because this source includes persistence.
