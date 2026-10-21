# ECKY THUMP v1.7.1 — Verified Fixes

- Added power-up tray to the main `SUBMIT` path; original v1.7 rendered the tray only during Context's innocent-line stage and results.
- Game Cards remain opt-in, with server-authoritative validated power-up rerolls (one per round) and an initially collapsed phone drawer.
- Single feedback reaction per player per effect; client feedback accepted for 30 seconds after the effect.
- Anonymous telemetry now groups finished-round durations by challenge, and counts discarded Game Cards.
- Existing avatar assets, data, keys and rendering functions remain unchanged.
- Local automated tests: **111/111 passed** (baseline 102/102).
- Mechanical simulation: **1,080 synthetic matches / 4,320 rounds**; 4,274 Game Card activations, 2,460 rerolls, 0 rejected attempts, and 0 negative scores. Synthetic voting cannot establish player fun or real balance.
- Browser UI test: blocked by environment's browser URL policy; mobile layout needs a live-device check.
- Deployment: this package is not pushed to GitHub or Render.
