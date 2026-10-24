# ECKY THUMP v1.8.2 — Quality review

## Scope and release boundaries

Automated review and code improvements built on the uploaded v1.8.1 project. **Real-device multiplayer and gameplay enjoyment tests were expressly deferred**. GitHub/Render were **not changed** during this release.

## Verification matrix

| Area | Work and evidence | Remaining risk |
|---|---|---|
| Engine authority | Server verifies active phase deadline on starter lines, normal answers, card swaps and votes | Unknown network conditions on real phones |
| Ballots | Same-ballot retries are safe; changing a locked vote is rejected; UI disables choices after voting | Human understanding of rules remains untested |
| Power-ups | Paused effects and Extra Helping remain visible; one global Chaos card and +40 positive match cap remain intact | Human balance and subjective frustration not measured |
| Equalisers | Fixed three-player Lifebuoy second-place eligibility; original opt-in card economy retained | Synthetic win spreads still do not prove catch-up benefit |
| Error handling | Oversized JSON returns 413, malformed JSON returns 400; streaming assets handle read errors | Network packet loss and physical device reconnections untested |
| Room lifetime | Idle rooms expire after 6 hours when disconnected; active streams retain rooms until maximum 24-hour lifetime | Server restarts still lose in-memory games |
| SSE updates | Bound to at most 100 per room; trim duplicate streams for one controller | Multiple physical devices and flaky Wi-Fi untested |
| UK English and brand | Existing live-copy regression test, `en-GB`, correct SVG and neon artwork | Historical internal `ECKEY` identifiers deliberately retained |
| Visual accessibility | Focus-visible, 44–48px controls, high-contrast and reduced-motion CSS | Sandboxed Chromium blocks local HTTP navigation; no new browser visual sign-off |
| Content catalogue | Unique IDs and exact text, UK spelling scan, positive-length entries | All 1,200 expansion entries remain tagged `draft` and require human editorial review |
| Avatar integrity | SHA-256 baseline test for all 42 protected asset/code files | None changed |

## Automated tests

Run `npm test`, `npm run audit:content`, and `node scripts/simulate-game-cards.js 12`. Existing 128 tests and newly introduced regression cases are required to pass. Confirm the final run totals before publishing.

## Intentional non-changes

No avatar artwork, rendering functions, avatar IDs or mapping files were modified. No third-party packages, advertising, user accounts or external analytics were added. Game Cards remain **disabled by default**. No scoring buffs are claimed based on synthetic tests alone. Server rooms still live in memory; durable storage and recovery require a separate product/privacy decision.

## Deferred hands-on checklist

1. On a computer and at least two phones, verify join QR, answer submission, tally, anonymous Gold/Silver voting and final scores.
2. Disable Wi-Fi for a phone during each phase; confirm clean reconnection and no duplicated votes.
3. Open the TV stage, check captions/avatars at a distance, and use host pause/resume with an active Game Card.
4. Compare 4–6-player games with Game Cards off/on, including Equaliser offers, Early Bell timeouts and player feedback.
5. Confirm the launcher on Windows, real browser reduced-motion settings and microphone/audio permissions as applicable.
