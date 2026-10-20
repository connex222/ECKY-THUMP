# ECKEY THUMP — v1.3 Poster UI Refresh

The supplied user-selected British seaside postcard illustration drives the new home, player waiting room, and TV lobby presentation. The runtime uses a compressed, locally served WebP version of that exact image for faster loading.

New visual work is isolated to `public/assets/seaside-postcard.css`, the home and lobby markup in `public/assets/app.js`, the TV lobby markup in `public/assets/tv.js`, and the new `public/assets/ui/ecky-seaside-poster-reference.webp` file. The previous logo file is retained for compatibility with other surfaces; the updated home/lobby use a new red-and-yellow styled text wordmark.

**Preservation:** Existing avatar assets, the avatar registry, avatar IDs, and existing avatar-rendering helper functions are unchanged. The UI continues to call the original `avatarPicker()` setup for both host and join.

**Safety and functionality:** Real room QR codes are still dynamically generated using `/api/rooms/{room}/join-qr.svg`. The QR graphic that happens to be printed on the backdrop artwork is decorative only. Age confirmation still gates Adult content; the host selects Clean, Cheeky, or Adult plus their game length and pace. The v1.2 gameplay and audience mechanics are unchanged.

**Validation:** Execute `npm test`. Additional tests check v1.3 assets, accurate room-setting submission, avatar-picker initialization and static server delivery. Browser rendering needs a further real-device visual review.
