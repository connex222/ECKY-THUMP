# ECKY THUMP — v0.7 artwork integration guide

## What is inside the playable game

Players can choose from the same **32 avatars** as before. Seven adult portraits have been upgraded without adding duplicate roster entries. Each featured character has two files:

- `public/assets/avatars/adult-XX.webp` — a 384×384 face/shoulders portrait for picking an avatar, the lobby, and scoreboards.
- `public/assets/celebrations/adult-XX.webp` — a larger, optimised full-body image for round-winning and championship screens.

The featured character IDs are `adult-01`, `adult-02`, `adult-06`, `adult-13`, `adult-14`, `adult-18`, and `adult-23`. Their names and server-side IDs have **not** changed. All other 25 avatars remain available, using their existing portraits as fallback winner artwork.

### Where players see images

- **Hosting/joining:** choose from 32 picture tiles; the upgraded characters are labelled **NEW LOOK**.
- **Lobby:** selected portraits appear by friends' names and on the TV.
- **Playing:** avatar appears beside leaderboard scores.
- **Round results:** winning avatar appears on a spotlight panel (full-body artwork for seven featured characters; portrait fallback otherwise).
- **Finale:** champion image and name appear above the final standings, including tied champions.
- **TV lobby:** a live scannable room-specific QR appears alongside players' portraits.

No manual importing is required. The files are already in the correct folders, and the game loads them automatically.

### Notes for further development

These are static art assets with CSS entrance effects. They are not three independently generated Normal/Wrong/Win expressions and they are not animated GIF/video. Generating consistent expressions would be a separate future art milestone.

To test locally on Windows: extract the whole ZIP and double-click `START-GAME-WINDOWS.bat`. For remote friends in other houses, use the Render deployment URL rather than `localhost` or a LAN-only address. This version is not yet deployed.
