# ECKY THUMP — Adult Avatar Roster v0.7

## What is included
- 24 adult comedy personas, cropped from a single high-resolution character-selection concept sheet.
- 8 original object mascots from the existing ECKY THUMP visual development.
- 32 consistently numbered WebP images in `public/assets/avatars/`.
- `public/assets/avatars.json` (ID, display name, category and relative image path).
- A horizontally scrolling avatar picker for both room creation and joining.
- Changing an avatar inside the lobby before a game starts.
- Player portrait on the scoreboard, lobby and TV display.
- A dynamic, per-room invitation QR code in the lobby and TV intro.

## Technical guidance
- Avatar selection is server validated. A player can change their avatar in the lobby only.
- The default avatar is `adult-01`. Duplicates are permitted, so friends do not block one another.
- The image IDs in `avatars.json` are the canonical keys. Do not rename without updating saved avatar IDs and the registry.
- Personae are stylised fictional designs, not likenesses to be identified.
- Image crops are suitable for game icons, not enlarged print marketing; upscale/re-render separately for posters.
- Seven featured adult characters have additional full-body celebration artwork in public/assets/celebrations/. All other characters use their portraits for reveals. These are not yet distinct wrong/correct/winner expression states; CSS introduces short celebration transitions, not animated source imagery.

## QR code usage
The QR destination is generated from the same host and room code that served the QR image. This avoids a fixed example URL and makes remote HTTPS deployments work. If you load ECKY THUMP at `http://localhost:3000`, other devices will not be able to open a QR that points to localhost. For testing on one Wi-Fi network, open the host on its LAN IPv4 URL, e.g. `http://192.168.1.25:3000/`. For friends in other locations, deploy to Render and use the public HTTPS URL.

The QR implementation is vendored with Apache 2.0 / MIT attributions in `server/vendor/QR-LICENSE.txt`; no online QR API is used.

## v0.7 featured artwork
The seven featured adults are The Glam, The Silver Fox, The Geezer, The Drama Queen, The High Roller, The Socialite and The Glam Gran. Their original IDs are unchanged. The remaining 25 choices are still available, and the portraits appear first in the selector.

The original full-resolution source files are not needed when running the game. The deployed build uses web-optimised WebP copies.
