# ECKEY THUMP v1.5 — Night Shift

A completely new **modern, dark** visual identity. No seaside/postcard styling is active.

## Windows

1. Install Node.js 20.11+ if needed.
2. Extract this ZIP.
3. Open the `ECKEY-THUMP-v1.5` folder.
4. Double-click `START-GAME-WINDOWS.bat`.
5. Open the local game link and create a room.

## Game nights across homes

Host one Node.js service on Render or similar. Invite friends using the hosted URL or room-specific QR. Each household may open a separate TV display with a private display token.

## What changed

- A full modern landing/host/join redesign with a single hierarchy and large mobile-friendly controls.
- Rebuilt lobby, TV waiting screen, scoreboard, voting and result visual treatments.
- A one-sheet `modern-v1.5.css` design system: older styles load only into the lower-priority CSS compatibility layer, preventing their decorative rules from overruling the new design.
- Mobile scoreboard and host controls are collapsed below gameplay by default to reduce clutter.
- The original avatar system, filenames, IDs, mappings and rendering helpers are unchanged.
- Existing game mechanics, original content, music, sound effects and room/session system preserved.

## Verification

Run `npm test`. The automated test suite and browser-state screenshot checks should be run again whenever UI code changes. The test screenshot runner in this development workspace uses stored example states and is not part of the playable build.

**Not deployed to GitHub or Render by this ZIP alone.**
