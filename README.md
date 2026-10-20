# ECKEY THUMP v1.4 — Clean Chaos UI Rebuild

**Play with 3–12 contestants on phones, with an optional TV screen and up to 30 cosmetic hecklers.**

### Run

- **Windows:** extract this package and double-click `START-GAME-WINDOWS.bat`. Requires Node.js 20.11+.
- **Other systems:** run `node server/index.js`, then open `http://localhost:3000`.
- **Tests:** `npm test`. No third-party npm dependencies required.
- **Across houses:** deploy the complete folder to one Node.js hosting service (e.g. Render) and use the common HTTPS URL.

### What changed

- Home: simplified, high-contrast seaside game cover with active Host / Join controls; proper Family / Cheeky / Adult, length and pace choices in the host form.
- Lobby: enormous room code, real server-generated join QR, legible player grid, consolidated settings and a single clear Start Game button. Avatars remain the original user-selected images.
- TV lobby: readable code / QR and cast at distance; music and SFX remain opt-in.
- Gameplay: unified cream/navy/red/yellow treatment on questions, cards, voting, result reveals and phone screens; no artwork behind the answer cards.
- Corrected the TV timer initialization (`clockOffset`) discovered in the browser-state test.

**Avatar preservation:** no changes to the avatar registry, avatar IDs, mappings, rendering functions, original images or celebration artwork. The automated avatar baseline test verifies all 42 assets and mappings byte-for-byte against v1.1. The new decorative donkey, hen and seagull art is entirely separate from selectable avatars.

**Technical architecture remains Node.js HTTP + Server-Sent Events**, not WebSockets; localStorage session rejoin, scoring, five modes, content packs, audience features and age confirmations remain intact.

**Limitations:** Screenshots shipped as previews use simulated states; the browser sandbox could not directly browse the locally running HTTP service. Live multi-phone/TV QA is still necessary. Room state is in memory and resets when the server redeploys. An adult checkbox is not formal age verification.

See `docs/UI-REBUILD-v1.4.md` for design and verification.

---

# ECKEY THUMP — v1.3 Seaside Poster UI

The front page, phone waiting room and TV lobby now follow the chosen chaotic British seaside postcard reference. The new poster illustration is served locally as optimised WebP, with responsive postcard colours, readable host/join controls and a bold text wordmark. Existing avatars and game engine logic are preserved.

The original `avatarPicker()` initialization, selected Clean/Cheeky/Adult humour rating, game length and pace settings, QR joining, optional audio, session rejoin and spectator Chaos Mode remain operational.

See [`docs/POSTER-UI-v1.3.md`](docs/POSTER-UI-v1.3.md) for details. Run `npm test` before deployment. This repository is designed for one running Node.js service and 3–12 active players.

---

# ECKEY THUMP v1.2 — Saucy Seaside Postcard Edition

A private browser-based comedy game for 3–12 active contestants, with an overflow audience of up to 30 spectators. Players use their phones; a TV can display the shared stage.

## Quick start

- Windows: double-click `START-GAME-WINDOWS.bat` (Node.js 20.11+).
- Other systems: `node server/index.js` and open `http://localhost:3000`.
- Run the full suite: `npm test` (63 tests passing at packaging).
- All game content, sounds, 32 avatars, score rules and five existing challenges have been retained.
- Private matches can be hosted as one Node.js Render web service (the included `render.yaml` is only a suggested starting point). A new deploy does not preserve in-memory rooms.

## What's new in v1.2

1. **Saucy seaside postcards**: original 1970s-style visual language, new `public/assets/seaside-postcard.css` on TV and phones; red/navy/yellow palette, printed halftone paper and postcard borders. No existing avatar source files, IDs, bindings or renderer logic have been changed.
2. **Lobby pack switch**: Family Friendly (Clean) or After Dark (Adult). Host and trusted TV display tokens may switch *before a match*, but every participant must individually confirm 18+ first. The original Cheeky option remains on the create-game screen.
3. **Audience / Chaos Mode**: after 12 contestants, or if joining an already-started match, extra people join the balcony. They can cast purely cosmetic atmosphere votes, shake the TV screen and lob virtual black puddings or wrenches. All inputs are authenticated, validated and throttled. Spectators never change score or game timers.
4. **Rejoin resilience**: the existing server-sent event (SSE) session authentication and local-storage token recovery remain in place; connection retries now back off, and the current unsubmitted draft is restored after a phone reload on the same device. No Express or WebSocket dependency is introduced.
5. **Haptics**: optional short taps, win pattern and thump feedback when supported by the device and reduced-motion setting.
6. **Pacing**: Lively-mode result reveals advance after ~4.5 seconds unless the host advances sooner; Relaxed mode remains host-controlled.

## Limits and safety

- Age consent is a user assertion, not formal age verification. Do not treat it as a public-site age gate.
- Chaos actions are **visual only** and deliberately cannot alter answer deadlines, private cards or leaderboard points. The game has no elimination system, so elimination-based audience transitions do not apply yet.
- The live game uses Node.js HTTP + SSE, not Express or WebSockets. Session tokens are bearer credentials; don't post TV links publicly. Rooms are in memory and are lost on server restart or redeployment.
- The current profanity filter is not comprehensive moderation. The host can hide answers in voting.
- Automated regression tests passed; manual phone / TV browser checks and real games-night testing remain outstanding.

See `START-HERE-v1.2.md` and `docs/SEASIDE-CHANGELOG-v1.2.md`.
