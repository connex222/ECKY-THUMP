# ECKY THUMP — November 2026 physical-device acceptance

**Status:** Deferred by project owner until November. No physical-phone tests are claimed as passed in v1.8.3. Game Cards remain **off by default**.

## Before inviting testers

- Verify the Render dashboard service ECKY-THUMP deploys the latest main commit. Changing render.yaml does not necessarily update an existing, dashboard-managed service. Set its build command to npm test && npm run audit:content and HTTP health check to /api/health if they are not configured.
- Use one active server instance and avoid deployments while anyone is mid-game: rooms currently exist only in process memory. Confirm the chosen hosting plan's sleep/idle behaviour.
- Ask players not to enter actual personal data in joke answers. Use private rooms and invitation links.

## Test matrix (record device/browser, pass/fail and notes)

- [ ] Three-, six- and twelve-player rooms; physical iOS and Android handsets where available.
- [ ] QR join, avatars and room ownership; host removal invalidates session and stream.
- [ ] Multiple TVs in different homes using different tokens simultaneously; one TV reconnect must not kick out another.
- [ ] Gold and Silver ballots remain private, immutable and never permit self-voting.
- [ ] Answer/vote/TV clocks, Fast Fingers and host pause/resume transitions.
- [ ] Airplane-mode recovery, browser tab sleep/backgrounding and temporary Wi-Fi loss.
- [ ] Low bandwidth or older handsets never create duplicate points or an irrecoverable room.
- [ ] A six-round match with Game Cards **off**, followed by an opt-in six-round match with cards **on**.
- [ ] Voluntary ratings of laughter, frustration and pace, plus timeouts and score spread, recorded separately for both conditions. No storing private jokes in telemetry.
- [ ] Reduced-motion, keyboard navigation, small-screen portrait, high-contrast and TV readability at viewing distance.

## Stop/go and remaining product gates

- **Stop** for leaked private answers, unauthorised lobby edits, duplicate scoring, reliably lost connections or content-safety faults.
- Keep Game Cards off by default if feedback is ambiguous or leader advantage increases. Synthetic scoring never changes this decision on its own.
- A room cannot survive a Render restart. Persistent recovery needs an approved durable store, retention limit, consent/privacy controls and a migration strategy.
- Commercial launch additionally requires human approval of all draft expansion content and applicable UK legal, safety and payment checks. These are separate from the November game-night test.

## Comparing synthetic card balance meanwhile

Run npm run simulate:smoke. For a larger repeatable benchmark run node scripts/simulate-game-cards.js 12 20261021 and compare corresponding normal/card groups. Simulation models joke preferences, not real humans.
