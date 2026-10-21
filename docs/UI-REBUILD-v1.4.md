# UI Rebuild v1.4 — Chosen Seaside Direction

Design reference: the user-selected four-panel Home/Lobby/TV/Phone screenshot from 20 October 2026. The playable UI is **not** that image used as an interactive background: this rebuild uses genuine accessible HTML controls, native form validation, dynamically generated room code and QR code, and adaptive layout. The donkey, hen-party and seagull art are small cropped decorative illustrations derived from the provided approved screenshot, not new avatars.

### Structure

- `public/assets/interface-v1.4.css` — final visual system with 390 px phone through 1440 px TV layout and reduced-motion support.
- `public/assets/app.js` — separate home cover, host/join forms, host lobby, score/game screens; reusable avatar rendering functions unchanged.
- `public/assets/tv.js` — distance-readable real QR and room code, TV cast and music controls, plus `clockOffset` initialization fix.
- `public/assets/ui/{donkey,hen,seagull}-poster.webp` — standalone decorative UI image clips. The original poster image remains in assets as an archived reference, but **is not loaded by the new UI**.
- No game rules, networking, avatar keys, avatars.json or asset bindings modified.

### Accessibility & functionality

- All Home CTA buttons act on real forms, with clear focus states and keyboard navigation.
- Humour buttons update the host form; the server enforces adult consent.
- Room code and QR are server-generated; they are not faked poster graphics.
- UI copy never promises 8-player limit: the actual game supports 3–12.
- Contrasting red/blue primary actions, three selectable humour tiers, three lengths, two speeds.
- Reduced-motion media query and minimum 44–50 px main button targets.
- Draft recovery and reconnect continue to use original session API.

### Verification

- `npm test` includes gameplay/integration/content, full 42-item avatar SHA-256 baseline, and new UI regressions.
- Additional Chromium screenshot snapshots use the **real UI renderer and actual server game state**, but inline assets because this environment blocks opening localhost in a browser.
- Mock snapshot QR may be substituted with an example generated SVG for illustrative screenshots. Live QR route is independently tested via HTTP.
- Device-level online multiplayer and visual QA are still outstanding.
