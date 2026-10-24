# Architecture and authoritative state

ECKY THUMP is a dependency-light native-Node.js server rather than an Express/WebSocket application.

`server/index.js` authenticates room actions with long random Bearer session tokens. SSE pushes role-filtered snapshots. `game.js` is the source of truth for phases, scoring and hidden responses. `game-cards.js` applies optional effects via game engine hooks, never directly from user-supplied score fields. `telemetry.js` collects bounded, non-identifying diagnostics in room memory only.

**Gameplay lifecycle:** `LOBBY → SEED (Context only) → SUBMIT → VOTE → RESULTS → next round / COMPLETE`. Timers use server deadlines. Lively results advance after ~4.5 seconds; Relaxed results require the host. Room state persists only while the server is running.

**Authority:** Client requests carry only action type, a card ID and narrowly validated choices. Only the server draws cards, generates IDs, selects Chaos targets, changes global deadlines, scores ballots, distributes equaliser offers, limits bonus totals, and creates TV snapshots. Private hands and extra-card options go solely to their authenticated player; spectators and the TV cannot see them.

**Diagnostics:** host-only `GET /api/rooms/{code}/telemetry`; bearer token required. Deliberately does not store answers, chat, IP addresses or nicknames. It isn't an external analytics service. Events disappear with the room.

**Potential next improvements:** browser-driven end-to-end tests with physical devices, stress tests with 12 players and audiences, better exact reconnect-duration attribution and seeded statistical card balancing.
