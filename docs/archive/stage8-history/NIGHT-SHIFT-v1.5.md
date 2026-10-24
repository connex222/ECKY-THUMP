# v1.5 Night Shift — Design and verification

## Visual system

- **Surface**: #090B13 page, #141725 cards, #242B3D content.
- **Type**: bold contemporary sans-serif display paired with readable system text.
- **Accent**: acid-lime #D5FB68 for primary actions, muted lilac #B7A0FF for metadata.
- **Navigation**: strong two-action landing; in-room QR and code are dominant.
- **Mobile**: single-column input-first layout; live scoreboard and host tools are collapsed in a details view.
- **TV**: large join code/QR, readable question display, high-contrast answer cards.

## Engineering notes

The only presentation entry point in each HTML page is `public/assets/modern-v1.5.css`. For safe backward compatibility it imports the old layout sheets into a lower-priority CSS cascade `legacy` layer. The modern rules outside layers take priority even when older selectors have high specificity. No avatar asset files, keys, mappings or rendering helpers were altered. All core game rules, networking and sound routines remain intact.

## Verification

Run `npm test` to check the existing full game suite. The browser-state screenshots distributed separately were rendered in Chromium at 1440px and 390px widths, based on known representative snapshots. They are UI checks, not a substitute for playing a real multi-device game.

The gameplay and content library are unchanged.

## Deployment

This version is a local ZIP. GitHub and Render are not changed by generating it.
