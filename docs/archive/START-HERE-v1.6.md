# ECKY THUMP v1.6 — Neon Arena

This is the playable private-party game with the **approved white/lime/magenta ECKY THUMP logo** and a neon-stage interface. The previous seaside artwork has been removed from the active screens.

## Run it locally

1. Extract the ZIP.
2. On Windows, double-click `START-GAME-WINDOWS.bat` (requires Node.js 20.11+).
3. Alternatively run `npm start` from the extracted folder.
4. Visit the URL shown in the terminal, or the hosted game after deployment.
5. Choose **PLAY NOW** to create a private room, or **JOIN GAME** to enter a room code. Use **OPEN TV DISPLAY** in the host lobby for a large-screen view.

Phones and TVs in a different home need the public HTTPS deployment URL; `localhost` only addresses one computer.

## UI implementation

- The **chosen logo** is stored as a transparent WebP at `public/assets/branding/ecky-thump-logo.webp`.
- `public/assets/neon-arena-v1.6.css` is the new presentation stylesheet, loaded after the v1.5 compatibility style. CSS alone increases avatar sizes; the existing avatar registry, artwork, IDs and rendering helpers were not changed.
- `public/assets/app.js` retains the existing authenticated flows, but presents the new home screen, contestant stage, lobby, compact mobile room header, host/join settings, submissions, voting and scoring.
- `public/assets/tv.js` now has a dedicated code/QR/large-avatar waiting layout and neon TV gameplay presentation.
- Lobby music, sound controls, Chaos Mode, private hands, answer restrictions and rejoining remain.

## Test commands

Run `npm test`. The suite covers game mechanics, content ratings, connection/spectator flows, avatars, static asset delivery, and v1.6 UI integration. Screenshots inside `previews/` are **simulated-state browser renders**, not a live multi-device session. Their room code and player data are illustrative. The real server still generates room-specific QR codes.

## Preservation and limitations

- **No existing avatar file, key, data mapping or avatar-rendering function was edited.** Automated SHA-256 baseline comparisons check all 42 covered avatar-related files. Other source files had presentation and versioning updates only.
- The game still requires a minimum of **3 active players**, supports up to **12**, and keeps the existing 2/4/6-round game-length options; mockups are not authority for gameplay rules.
- Local play and API tests are verified. A real multiplayer games night on physical phones and TVs remains an acceptance test.
- This ZIP does not itself push to GitHub or deploy to Render.
