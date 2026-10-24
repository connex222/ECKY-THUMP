## Stage 10 — Our Maureen recording importer and resilient room saves (24 October 2026)

- Add a zero-dependency, offline FFmpeg importer for the 60 existing Maureen lines; audio checked by exact filename and media probe before changing the paired manifests. No spoken files generated or labelled as recorded.
- Disable the misleading TV voice toggle until at least one actual clip is installed; leave captions, music and sound cues intact. Bust the updated TV audio asset cache.
- Make Social Club snapshot store, cleanup, and startup restore failures non-fatal. Health now reports best-effort/ephemeral/degraded recovery state without claiming a private cloud disk.
- Add local IO and audio conversion regression tests, CI recording integrity check and detailed handoff instructions. Existing 850 approved cards, Game Cards, House Cards and Classic compatibility remain unchanged.

## Stage 9 — House Cards (24 October 2026)

- Added private, opt-in, pre-match House Cards (maximum five per player) with host review and removal.
- Added rating-aware server validation, snapshot privacy, user moderation permissions and room-only dealing in The Meat Raffle and The Hard Sell.
- Repaired Social Club pre-match lobby recovery for persistently provisioned rooms; no Render plan change.
- Added HTTP, engine and restart regression tests. Full in-person acceptance remains due in November.

# Changelog — ECKY THUMP

## [2.0.0] — Stage 8 consolidation (release candidate, 24 October 2026)

- Consolidated browser stylesheet loading into one CSS asset while keeping the historical source CSS for backward-compatible URLs and regression tests.
- Added no-build native ES module with shared escaping, server clock synchronisation and avatar lookup; classic phone and TV controllers consume it dynamically.
- Canonical public version comes from the server package via `/api/health`, not a hardcoded phone footer.
- Added focus, forced-colours, stronger contrast and reduced-motion support; moved older historical docs to `docs/archive/stage8-history/`.
- Added voluntary paid Render persistent disk blueprint example without changing the existing free service.
- November real-device QA and House Cards remain outstanding; version 2.0.0 is still a Social Club **preview** until accepted.

# Changelog

Current project history, consolidated from the previous per-version guides. For historical design material see `docs/archive/`.

## [Unreleased] — Social Club Stage 7, six optional Game Cards

- Implemented a separate, server-authoritative six-card game for Social Club, **off by default**. Holding is capped at one and playing at one per round. The existing 15-card classic mode remains backward compatible.
- Added DOUBLE OR NOWT, NICKED, HECKLE, SECOND CHANCE, automatic UNDERDOG and the three-second POWER CUT, with TV banners and captions and one contextual phone action (no power-up drawer).
- Guarded timing, eligibility, score modifiers, server-validated written heckles/rewrites, anonymity until results and persistence/reconnect. No effects in Last Orders.
- Added new HTTP + engine regression tests and hand-testing checklist. Existing game ratings, content packs and avatar art are unchanged.

## Stage 6 — Additional cards received (review only, not released)

- Staged 100 ordinary-card and 100 mode-specific CSV entries with stable source IDs.
- Added draft-only HTML/CSV review and an audited mode-aware CSV staging script.
- Flagged nine entries needing editorial review; left all game pools, approved source and deployed content untouched.


## [Unreleased] — Stage 6: 200 additional approved comedy entries

- Promoted both 23 October CSVs into the approved content overlay: 75 responses,
  25 one-blank prompts, 40 writing-mode prompts, 35 Last Orders words and 25 contracts.
- Applied the user's approval of nine editorial replacements; preserved original
  source text and old-to-new mappings in `editorial/incoming-2026-10-23`.
- Approved content rises from 650 to 850 entries; the 1,200 legacy draft pack
  remains immutable. Added regression tests for ratings, exact CSV provenance,
  uniqueness and approved-only mode.
- Rights status for the uploaded material is still unverified independently.

## [Unreleased] — Approved Stage 6 content integration

- Load 650 approved entries: 200 Family editorial proposals and 450 cards from the user-approved CSV, with stable IDs and 140 Family replacements; preserve old expansion source.
- Adapt 37 uploaded texts for formatting, deduplication and brand removal; ledger includes before/after wording.
- Honour `PREMIUM_CONTENT_ONLY=1` by excluding old draft expansion entries; add import validation and humour-tier tests.
- Add exact CSV submission templates and the next-content brief.

## [Unreleased] — Social Club v2 Stage 5 compère and sound desk

- Wrote 60 original UK English Our Maureen recording lines across 12 event groups, with a single configurable compère name, local audio filenames and a `recorded` flag per line.
- Added deterministic caption selection per TV scene, including extra cues for Last Orders, unanimous wins, comebacks, countdown nudges and idle lobbies. Captions remain on when voice is muted or recordings are missing.
- Added opt-in recorded voice, per-TV master volume, existing opt-in music and SFX toggles, and four original browser-generated musical stings (brass, bell, vote-close and ECKY THUMP slam).
- Kept normal v1.8.3 screens and sounds compatible. No recordings have been supplied or invented; voice audio remains silent until files are recorded and marked available.

## [Unreleased] — Social Club v2 Stage 4 phone controller

- Added separate opt-in Social Club phone screens, accessible on portrait phones when `SOCIAL_CLUB_PREVIEW=1`, without altering normal v1.8.3 gameplay.
- Added server-capability-controlled lobby option for hosting Social Club, plus Quick/Standard/Long (3/5/6) round counts.
- Built one-task-at-a-time submission for card selection, two head-to-head writing tasks, context seeds and Last Orders; server still validates every answer.
- Added large one-tap A/B and raffle ballots, server-enforced eligibility and author anonymity, audience voting, reporting and host moderation.
- Added scoreboards, champion, rematches, copy invite/TV links, preserved session recovery, reconnect status, aria-live phase announcements, UK labels, reduced-motion and high-contrast styles.
- Regression tests and mock-screen browser checks cover lobby, submit and voting at 390px and 720px without horizontal overflow. The new mode is still opt-in and real-device multiplayer acceptance remains in November 2026.

## [Unreleased] — Social Club v2 Stage 3 television preview

- Added a dedicated Social Club television renderer with Northern club-stage styling, large anonymous reveals, A/B comparisons, server-controlled results, avatar celebrations and a champion scene.
- Added TV-only non-identifying answer completion indicators and aggregate ballot progress to preview snapshots.
- Preserved existing v1 television screens and all avatar files.
- The Stage 3 renderer remains accessible only in Social Club preview rooms; the new phone controller is Stage 4.

## [Unreleased] — Social Club v2 Stage 2 engine preview

- Added explicit, disabled-by-default Social Club v2 preview with the new phase, matchup, reveal, ballot and scoring engine; the default game remains v1.8.3.
- Added independent, room-private JSON persistence with typed Map/Set restoration and hashed-token reconnects across Node process restarts when preview mode and a suitable directory are configured.
- Added capped audience vote influence, host hide/report/skip controls, six-hour room retention and per-IP preview creation/join limits.
- Added child-process restart integration coverage and six-round synthetic 3- and 12-player match tests. The user-facing Social Club TV/phone interfaces are for Steps 3–4; real-device multiplayer testing remains scheduled for November 2026.

## [1.8.3] — 2026-10-21 · Pre-November reliability and editorial readiness

- Restricted all TV bearer tokens to read-only use, including lobby content settings.
- Distinguished simultaneous TV SSE streams by bearer token rather than an undefined viewer ID; reconnect replaces only the same participant's previous stream.
- Cleaned up streams when the **response** closes rather than when the incoming GET request finishes; added HTTP regression coverage.
- Added seeded synthetic scoring runs for repeatable Game Card comparisons. Gameplay card balance and effects are unchanged until human evidence is available.
- Added an editorial review queue with non-blocking flags for formulaic openings, unusually long or short responses, and placeholders. No draft joke is automatically approved.
- Added structural content lint, editorial triage, and simulation smoke runs to GitHub CI.
- Updated the example Render blueprint to run tests and content lint, with a /api/health health check. Existing dashboard settings require independent verification.
- Real-device multiplayer tests remain scheduled for November 2026; cross-deployment room persistence remains unimplemented.

## [1.8.2] — 2026-10-21 · Game Night reliability and accessibility

### Fixed
- Malformed or oversized JSON requests now return controlled errors (413 for oversized payloads) instead of abruptly destroying the socket. Static asset streams handle read errors.
- Answer, starter, card-swap and ballot actions reject submissions received after the server's phase deadline, even before the timer tick advances the phase.
- Voting is final: exact retry requests are idempotent; attempts to replace a ballot are rejected without changing scores or counting duplicate votes.
- Redundant SSE streams from the same controller are bounded; each room has a hard connection cap. An active SSE-connected room is not swept for 6-hour inactivity, with a 24-hour absolute room lifetime.
- Active Game Card effect and Extra Helping visibility no longer silently disappears during a host pause.
- Corrected Lifebuoy bottom-half eligibility in odd-sized games (e.g. only third place in a three-entry round).
- Clarified on-screen voting language (Gold/Silver are vote weights), disabled edits after submitting a ballot, and corrected the locked-ballot status message.

### Improved
- Clear keyboard focus indicators, larger mobile Game Card hit targets, reduced-motion fallbacks, high-contrast styling and text wrapping.
- Added regression tests for deadline boundaries, repeat ballots, paused-card snapshots and static delivery.
- Added a repeatable content quality audit with exact-duplicate and editorial-status measurements; no unreviewed joke content was silently rewritten.
- Multiplayer tests on real devices and a human Game Card balance study remain deferred.

## [1.8.1] — 2026-10-21

### Fixed
- Corrected the player-facing product name to **ECKY THUMP** across the mobile controller, TV stage, browser titles, content review, accessible labels, server health metadata, launcher messages, current and archived documentation.
- Corrected the drawn lettering and accessible title of the legacy SVG logo. Preserved the chosen Neon Arena WebP logo pixel-for-pixel, and gave both logos correctly spelt asset filenames.
- Standardised HTML document language to `en-GB` and corrected remaining US-language wording in Game Card descriptions and historical narrative.

### Compatibility
- Preserved all 42 avatar-related source files and assets exactly, including historic artwork credit metadata.
- Retained existing `window.ECKEY_*` interfaces, local storage keys and the `eckey-after-dark-09` content-pack ID to avoid breaking existing clients, settings and game-data references. These are internal compatibility identifiers, never product-name copy.
- CSS `color`, `center` and DOM `behavior` retain their standard technical spellings.

## [1.8.0] — 2026-10-21

### Fixed
- Short activation windows are now visible through a quick-play bar above the collapsed Game Card tray, without compromising the answer controls.
- Server-authoritative card availability and expiration prevent attempting known-ineligible cards; actual card plays are revalidated by the server.
- Cannot activate or reroll a power after the shared submission deadline, even before the periodic tick fires.
- Host pauses freeze early activation windows, pending Extra Helping selections, temporary effects and Fast Fingers reward timing.
- A swapped/replaced response card no longer leaves an obsolete selection on the player's phone; Wrong Envelope prompts notify the player when changed.
- TV power-up announcements expire automatically after a brief reveal, without another state update.

### Changed
- Fast Fingers displays a private countdown and times from activation (12 seconds Lively; 20 Relaxed), while activation must still be within the first 10 seconds of the round.
- Deckchair Shuffle is playable in the first 12 seconds and Wrong Envelope in the first 10 seconds.
- Host telemetry now shows offered/played ratios and opted-in feedback, with sanitised error association near recent power effects.
- Existing five game challenges and the 42 avatar-related files are preserved; power-ups remain host opt-in and disabled by default.

## [1.7.1] — 2026-10-21

### Fixed
- Mobile answer screens now expose an initially collapsed Game Card tray, so players can actually use card powers while answering.
- One controlled power-up reroll per round prevents players from getting stuck with an incompatible two-card hand.
- Card ratings are now limited to one opinion per effect per player, and reset between matches.

### Changed
- Added per-challenge round-duration summaries and Game Card reroll counts to the host's existing private telemetry report.
- Preserved the Neon Arena layout and all existing avatar artwork, IDs, metadata and rendering.

## [1.7.0] — 2026-10-21

### Added
- Opt-in, server-authoritative Game Card system: five Chaos, five Tactical and five Equaliser effects, separated from the comedy-response cards.
- Private inventories, validated activation windows, bounded scoring bonuses, anti-spam limits, host lobby toggle and player controls.
- Lightweight in-memory telemetry of card activations, pacing and reconnections, with host-only export endpoint.
- Central documentation and improved Windows launch script.

### Changed
- Neon Arena visual language retained with an optional Game Card tray and TV effect banner.
- Old start guides and notes preserved under `docs/archive/`.

## [1.6.0] — 2026-10-21

### Changed
- Neon Arena home/lobby/TV/phone visual rebuild and selected lime/magenta ECKY THUMP logo.
- Original avatars made more prominent without modifying avatar keys or mappings.

## [1.5.0] — 2026-10-21

### Changed
- Modern Night Shift layout replacing the seaside-postcard treatment.

## [1.4.0] — 2026-10-20

### Changed
- Clean Chaos redesign of home, lobby, TV and controller layouts.

## [1.3.0] — 2026-10-20

### Changed
- Poster-inspired visuals and homepage/lobby composition.

## [1.2.0] — 2026-10-20

### Added
- Cosmetic audience heckles and voting, reconnection improvements, mobile haptics and shorter lively transitions.

## [1.1.0] — 2026-10-20

### Added
- Round guidance, ready-up mechanism and end-of-night recap.

## [1.0.0] — 2026-10-20

### Added
- Showdown sound effects and TV gameplay/result presentation.

## [0.9.0–0.9.2] — 2026-10

### Added
- After Dark comedy pack, expanded card/prompt library, visible lobby settings, avatar spotlight and lobby audio.

## [0.6.0–0.8.0] — Earlier prototypes

### Added
- Private game rooms, avatar selection, QR joins, the five-challenge game engine and scoring rules.
