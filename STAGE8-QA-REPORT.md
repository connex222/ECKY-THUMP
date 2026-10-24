# ECKY THUMP v2.0.0 — Stage 8 QA and release handoff

Date: 24 October 2026

## Automated results

- Node.js v22.16.0: **228/228 tests passed**, zero failed.
- `npm run audit:content`: passed. This validates the legacy catalogue; it does not approve every legacy draft joke.
- `npm run audit:approved-content`: passed; 850 approved overlay entries remain intact.
- `npm run audit:more-cards`: passed for the two submitted 100-entry files.
- `npm run simulate:smoke`: passed, deterministic mechanics only, not a human fun test.
- CSS: parsed by tinycss2, 767 top-level nodes, zero syntax errors.
- An isolated Chromium content-injection smoke test rendered the phone landing page at 390px, 1280px and 1920px widths without JavaScript errors or horizontal overflow. Local images were intentionally unavailable in that browser environment; these screenshots do not validate artwork rendering. The avatar SHA-256 baseline regression remained green. Direct HTTP browser navigation was blocked by the sandbox's network policy, so full real-host browser rendering and genuine multi-device testing remain outstanding.

## Delivered

- ECKY THUMP version `2.0.0` from `package.json`; client fetches `/api/health` to display it, not hardcoded duplicated release strings.
- One combined CSS loaded by each entrypoint. The six legacy source stylesheets are flattened into a low-priority `@layer legacy` in the original ordering. Remaining source CSS files are kept at their former URLs for backwards-compatible clients and pre-v2 regression tests, but are no longer loaded by the new pages.
- Shared native `shared.mjs` helpers for escaping, server clock offset, clock formatting and avatar identity resolution; both classic controller files import it dynamically. A more extensive future internal splitting of the 65KB classic phone controller remains a technical debt item.
- Clearer keyboard focus, forced-colours / extra-contrast preferences, reduced motion, and phase-change announcements on phones.
- Historical project documents moved to `docs/archive/stage8-history/`, with the four core documents retained as README, CHANGELOG, DESIGN and VOICE-LINES.
- Optional paid Render blueprint `render.persistent.example.yaml` with `/data` storage. NOT applied to the live Render plan. Room JSON is private but unencrypted; do not mount in public storage.

## Open acceptance gates — NOT claims of completed testing

- Full in-person multiplayer testing in **November 2026**, including phones, 720p/1080p living-room TV, game timing, 3–12 players, score fairness and laughter.
- The House Cards feature (maximum five per player, pre-game host moderation) remains incomplete; do not claim full original design spec completion.
- Classic rooms remain memory-only; Social Club JSON recovery depends on a paid attached persistent disk and environment configuration.
- No new recorded Maureen voice files have been provided; captions and sound effects work without them.
- Uploaded comedy card source copyright/commercial redistribution permissions remain unverified independently.
- WCAG 2.2 AA requires real accessibility assessment; automated CSS assertions alone are not a full audit.
- CSS source compat files are preserved; only the loading path is consolidated. The classic 65KB controller needs a cautious future modular decomposition.

## November test order

1. Confirm the existing Classic game boots and can complete one match without regression.
2. Social Club 3-, 6-, 8- and 12-player rooms, QR joining and phone-only fallback.
3. Head-to-head assignment, no self-voting, repeated venue rounds, reveals and champion scoring.
4. All six optional Game Cards, including host approval and Last Orders exclusion.
5. Stop/restart server mid-match on *persistently provisioned* storage, reconnect and continue.
6. Test audio opt-in, captions, TV overscan, mobile sunlight readability, focus order, high contrast and reduced motion.
7. Report real laughter/silence per prompt, improve weak content, and obtain rights/legal approvals before paid distribution.
