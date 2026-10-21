# ECKY THUMP v1.8.1 — UK English & Branding Audit

## Source reviewed

- Source: complete playable v1.8 package; files retained and tested locally.
- Reviewed: player and TV interfaces, HTML titles and accessible copy, Node.js server health and startup messages, Game Card descriptions, 1,200-entry After Dark pack, comedy response content, local launcher, upload instructions, current and historical guides, SVG fallback logo and selected WebP logo.
- Official spelling: **ECKY THUMP**.
- HTML language: **en-GB** for all three HTML documents.

## Corrections and quality checks

- Corrected the old product-name spelling wherever it appeared in published gameplay copy, developer instructions, captions or accessible UI.
- Corrected the older SVG logo's actual text as well as its alt/title; relocated it to `public/assets/ecky-logo.svg`.
- Preserved the chosen neon logo **byte-for-byte** and renamed its file to `public/assets/branding/ecky-thump-logo.webp`; updated all live references and tests.
- Corrected the remaining Game Card description from “toward” to “towards”. Existing comedy prompts were already overwhelmingly UK-localised (favour, neighbour, mum, theatre vocabulary, etc.).
- Replaced stale v1.7 uploader labels and v1.1 upload guide with current dynamic instructions, and updated page title/version cache stamps to 1.8.1.
- Added regression tests verifying display copy, image/HTTP delivery, UK spelling and legacy compatibility.
- Full automated suite: **128 passing tests, 0 failures**.
- 42 avatar-related source/asset files and the approved logo are **byte-for-byte unchanged** from v1.8.

## Intentional retained internal spellings

The following strings are **not displayed as the game title** and remain unchanged because modifying them would break existing sessions, saved choices or the avatar no-change agreement:

- `window.ECKEY_AVATARS`, `window.ECKEY_AUDIO`, `window.ECKEY_SFX`.
- `eckey-session-*`, `eckey-last-room`, `eckey-draft-*` browser storage names and editorial review storage key.
- Content-pack ID `eckey-after-dark-09`, embedded in 1,200 pack records; IDs must stay stable.
- Historical artwork credit metadata in `public/assets/avatars.js` and `public/assets/avatars.json`. Not rendered as the public product name.
- Technical `color`, `center`, `behavior` in CSS/JS, `license` in NPM metadata and third-party licensing text. These are not US-English narrative copy.

## Deployment

This is a **local corrected package**, not a GitHub commit or Render deployment.
