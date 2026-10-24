# ECKY THUMP — UK English and brand style

The official product name is **ECKY THUMP**, never “ECKEY THUMP”. Use `ECKY THUMP` in page titles, UI, headings, image alt text, log messages, app metadata, help and player-facing support copy. Use `Ecky Thump` only when sentence case is necessary.

## Language conventions

- Write in British English (for example **colour**, **centre**, **favourite**, **organise**, **realise**, **apologise**, **neighbour**, **cancelled**, **travelling**, **humour**, **licence** (noun) and **license** (verb)).
- Keep UK culture-specific jokes, local expressions and regional slang intact; do not turn jokes into rigid textbook English.
- Use **towards** rather than US-style **toward** in narration.
- Use `lang="en-GB"` in all HTML entry points and the content review tool.
- Where spelling changes could alter a published ID, public API contract, stored value, player answer, or third-party licence text, preserve the stable identifier rather than silently changing functionality.

## Intentional technical exceptions

- Browser APIs and JS properties: `localStorage`, `style.color`, `scrollIntoView({behavior: ...})`, `text-align:center`.
- CSS properties/values: `color`, `center`, `justify-content`, `align-items`.
- Third-party QR code vendor files and its `QR-LICENSE.txt`.
- Existing avatar source/metadata/IDs are under a no-change requirement; some preserved metadata includes historical “ECKEY THUMP” artwork credits. This metadata is not displayed as the product title.
- Compatibility variables and event/storage keys: `window.ECKEY_AVATARS`, `window.ECKEY_AUDIO`, `window.ECKEY_SFX`, `eckey-session-*`, `eckey-draft-*`, `eckey-last-room`, `eckey-review-v09`.
- Immutable content-pack ID `eckey-after-dark-09`: changing it would alter existing content references and saved editorial decisions. The review screen uses the correct visible product name.
- Historical **filenames inside references** should use the newly corrected path where there is no runtime compatibility requirement; the previous GitHub repository name is an external identifier and is not changed as part of this local spelling audit.

## Quality gate

Run `npm test`, including `test/uk-english-brand.test.js`, before release. The test checks visible copy, titles, game-pack text and asset paths, and guards the agreed compatibility exceptions.
