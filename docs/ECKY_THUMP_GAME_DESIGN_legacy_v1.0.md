# Legacy Design Specification — Adapted to ECKY THUMP

> This planning document predates the v0.6 playable prototype; its future-feature targets are not necessarily implemented.

# ECKY THUMP
## Professional Game Design Document & Technical Development Specification

**Version:** 1.0 — Proposed baseline  
**Date:** 19 October 2026  
**Status:** Design-ready; not an implemented game  
**Working title:** Name, domain and trade mark NOT cleared  
**Product owner decisions:** TV and phone-only modes equally supported; Clean/Cheeky/Adult humour; one-off host purchase and paid expansion packs.

> **Vision:** An original browser-based comedy championship where 3–12 friends compete across card choices, inventive answers, fictional-context rewrites, hybrid challenges and one dramatic finale. One person buys and hosts; guests join free. The product should feel like a polished entertainment experience, not a collection of clones.

---

# 1. Executive Summary

## 1.1 Product proposition

ECKY THUMP (TNL) is a synchronous multiplayer comedy party game. Players use their own phones, tablets or browsers to submit and vote. It works either with a shared television/laptop stage (**TV Party Show**) or entirely on participants' devices (**Phone-Only Party**). Both formats have complete, first-class experiences driven by the same authoritative game state. A host purchases the game once and can host eligible private matches; guests do not need accounts or purchases.

The game comprises five originalised challenge types: **Card Clash**, **Quick Wit**, **Context Collapse**, **Double Trouble** and **The Last Laugh**. It adds a proprietary-feeling system of **Chaos Contracts**: short, explicitly displayed creative restrictions applied to selected writing rounds. It uses an integrated season-of-one-match structure with meaningful scoring, progression, results, and an end-of-match ceremony.

## 1.2 Audience and platform

- **Core buyer:** adults organising house parties, game nights, pubs, birthday parties and remote group calls; UK-first but internationally usable.
- **Age position for initial release:** proposed adult purchaser / adult-oriented service with Clean content available; this is **not** a determination of whether minors can access the service under UK law. Final audience policy, age-assurance method and online safety scope are launch-blocking compliance decisions.
- **Access:** desktop Chrome/Edge/Firefox/Safari and mobile browsers on recent iOS and Android; no app installation; no mandatory microphone or camera.
- **Participation:** 3–12 competing players at launch. Non-playing host/spectator/display is separate from player seats. Future scale target 16 players subject to usability and performance tests.
- **Duration presets:** Quick (5 scored challenges; target 12–20 minutes of play), Standard (7; target 18–30 minutes), Extended (10; target 30–45 minutes). Plus room creation and player joining time.
- **Connectivity:** internet required for all players; mixed local and remote players supported.
- **Language:** British English as the initial authored locale; infrastructure accommodates future locales.

## 1.3 Commercial baseline

- Free demo hosted by anyone: short curated match, Clean content, limited deck, conspicuous but non-intrusive upgrade path.
- Paid standard license for a host account: proposed list price **£12.99 (hypothesis, not confirmed)**, one-time purchase of core game access, subject to published terms and reasonable abuse protections.
- Paid content packs: proposed **£2.99–£4.99** each (hypotheses). Every pack requires rights-checked, authored content, immutable versioning, rating metadata and publishing review.
- Guests join **free**, without accounts or purchases. Avoid pay-to-win and individual-player microtransactions.
- Proposed commercial policy: purchases attach to purchaser account; core access does not expire through a subscription. Clarify service availability, updates, refunds and statutory rights in terms reviewed for the target markets.

## 1.4 Non-goals for release 1.0

No public matchmaking, open public chat, voice/video chat, avatar marketplace, ranked ladder, AI auto-generated player submissions, real-money prizes, player-to-player payments, subscriptions, advertising SDKs, uncontrolled public content publishing or third-party game content. Avoid social profile pages and discoverable public rooms in version 1.0.

## 1.5 Success criteria (targets to validate; not market predictions)

| Measurement | Prototype gate | Paid-release gate |
|---|---:|---:|
| Players who finish a started match | >= 80% in 10 observed tests | >= 85% over first 100 organic matches |
| Median first-guest join time | <= 45 seconds | <= 30 seconds on tested network |
| Accepted responses correctly scored | 100% in deterministic tests | 100%; no known P0 scoring bugs |
| Crash-free completed matches | >= 95% in closed beta | >= 99% in monitored launch cohort |
| 5th-to-95th percentile client action ACK | target <= 2 seconds on nominal connections | target <= 2 seconds |
| Players reporting fun (4 or 5 / 5) | >= 70% of test respondents | >= 75% of prompted respondents |
| People willing to host another match | >= 50% | >= 55% of surveyed hosts |
| Paid conversion | measure only | decide after data; do not invent a target |

These metrics are preliminary; they need statistical caveats for small samples. Instrument consent and analytics legally.

---

# 2. Game Identity, Differentiation and Creative Principles

## 2.1 Differentiation

The product's marketable experience is **one connected comedy tournament**: a shared score, recurring fictional "League" identity, themed creative constraints, a polished final, and two equally capable presentation formats. Do not position it as “Cards Against Humanity + Quiplash + Survive the Internet in one package”; that invites comparisons, increases IP risk and weakens originality.

## 2.2 Design pillars

1. **Fast to join:** code / QR / invite link; guest nickname only; no mandatory download or account.
2. **Funny by design, not by offence:** prompts create surprising combinations and absurd scenarios; rudeness is optional, not the sole humour device.
3. **Fair enough to compete:** transparent scoring, anonymous ballots, no self-votes, seeded content, no hidden weighted purchases.
4. **Never strand a player:** reconnect to the same seat; show time remaining, submit/ack status, absent-player policy and clear host recovery.
5. **Two equally real modes:** TV view adds theatrical spectacle; phone-only gives complete shared information, results, voting and ceremony on each device.
6. **Host control without bullying tools:** host can start, pause, remove, adjust future rounds and report; cannot alter scores or secretly see unrevealed private answers.
7. **Local-first culture:** initial humour deliberately UK-flavoured but does not depend exclusively on topical slang or offensive stereotypes.

## 2.3 Tone and art direction

A confident, premium gameshow/comedy-club hybrid, not a generic black/white profanity card clone. Palette suggestion: ink plum #171126, electric violet #7856E8, warm brass #E6B65E, ivory #F7F1E8, jade #22B59C for success, coral #F07980 for adverse conditions. Use these as exploratory references, not final accessibility-compliant tokens. Strong typographic hierarchy, deliberate motion, sharp sound stings, reduced-motion parity and contrast-tested palettes. No copying third-party visual identities or slogans.

**Audio:** licensed/original theme, round cues, submission, vote, reveal, final fanfare, timeout, connectivity warning, quiet mode. Provide independent music/SFX toggles and browser user-gesture unlock. **Brand:** working name only; trademark, domain, company-name searches and clearance before expensive asset commissioning.

---

# 3. Roles, Modes and Room Rules

## 3.1 Roles

| Role | Rights | Boundaries |
|---|---|---|
| Purchaser/owner | Start paid rooms, use owned packs, configure base rules | Ownership verified server-side, not a client-side flag |
| Host/controller | Admit/remove guests, select settings, pause/resume, skip problematic prompt | Cannot overwrite scored events, view unrevealed votes or override paid entitlements |
| Player | Submit, vote, reconnect, report, leave | Cannot inspect private hands, others' drafts or server answers |
| TV display | Presentation, captions, scoreboard and QR | Display token is read-only; no player credentials/answers before reveal |
| Guest spectator (optional release+) | View public score/show | No voting or player data; not in v1 critical path |
| Moderator/operator | Investigate safety reports using least privilege | Audited access; retention policies; never routine browsing of private rooms |

A purchaser may also be a player. The host role can be transferred by an authenticated owner or recovered under a documented timeout rule; there must never be two simultaneous authoritative hosts.

## 3.2 Game formats

**TV Party Show:** Host opens `/tv/:roomCode` (or TV pairing link), presents a stage with question, timers, anonymised submissions, results and standings. Players use `/join/:code` on phones. The TV is read-only. Player phones never need to display an external screen to answer, but do not replicate every animation.

**Phone-Only Party:** Each player uses a single responsive `/play/:code` experience. Shared prompt, timer, card hand, voting, reveal and standings appear in the same application, with clearly distinct phases. Invite links and room ownership work identically. Host's screen has host tools, but gameplay never depends on host staying on a special TV page.

**Mixed devices:** A player can switch between desktop and mobile; the same seat is resumed via secure session token, with active-controller takeover confirmation to prevent duplicated actions.

## 3.3 Rule presets

- **Party Mix (default):** all five challenge types; democratic voting only; one shared championship score.
- **Classic Cards:** Card Clash with rotating judge; every player judges the same number of times in the configured series. Standings use number of judging wins only; not combined with Party Mix's 100/60/25 score.
- **Custom Show (post-MVP):** host chooses eligible challenges and durations; may not combine incompatible scoring systems in a ranked championship. Validations explain if an arrangement is not balanced.

**Room defaults:** Private code, invite link, Clean setting, no custom prompts, anonymised ballots, random player display order, subtitles/captions, 7-challenge Standard game, 3–12 players, no public visibility. Hosts can lower content intensity mid-match for future content; increasing to Adult requires renewed content consent/eligibility checks where applicable.

## 3.4 Joining and identity

- Room code: 6 unambiguous uppercase characters from a restricted alphabet; rate-limited lookup and collision-checked generation. Invite URLs carry a non-secret convenience code; authorization still required.
- Display nicknames: 2–20 visible characters after normalisation; strip control characters; moderation; safe fallback “Player 4”; no impersonation of operators.
- Guest session: cryptographically random, opaque, room-scoped resume secret stored safely with expiration; only hashed value persisted server-side. Do not use Socket.IO `socket.id` as identity.
- Room owner: authenticated account verified via server session, tied to purchase entitlement; separate from room codes.
- First join creates a seat; reconnect resumes it. A second live connection must not silently create another voter.
- Late joins: lobby only by default. During an active match, guest can spectate if implemented; otherwise wait for next match. Reconnect to an already occupied seat is allowed after verifying its resume secret.

---

# 4. Complete Challenge Designs

All prompts, cards, samples, artwork and templates must be original. The examples below are newly written working samples, subject to editorial review and duplication checks.

## 4.1 Card Clash — clever card combinations

**Objective:** choose the best response from a private hand for a prompt on screen.

**Start:** all active players receive 7 response cards, filtered for content setting, language and owned expansion packs. The server keeps the hand secret. A prompt displays one response slot at MVP; optional double-slot prompts are deferred to content-tested postlaunch.

**Flow:** 5-second intro → 35-second private selection → lock/timeout → 22-second anonymous ballot → 10-second reveal and score. Once a valid card is submitted the selection is binding unless the UI provides an explicitly enabled correction window; MVP does not.

**Example:** “The city's new tourist attraction is an interactive exhibition devoted entirely to ____.” Example response: “A deeply offended parking meter.”

**Fairness:** no card effects change scoring; no paid packs with mechanical advantages. Use seeded hand dealing without duplicate card IDs in the same hand; there can be duplicates across players only if pool exhaustion requires them (normally avoid). Rotate dealt hands between rounds. Replenish after use; content selection prevents repeats in the same match where possible.

**Timeout:** select a random eligible card from the player's existing hand using server RNG, mark as auto-submitted in player-private feedback; this keeps match moving without giving a strategy edge. If player actively quit/disconnected beyond grace, apply absence rule instead (Section 6).

## 4.2 Quick Wit — authored one-liners

**Objective:** write a funny original one-liner to a shared absurd prompt.

**Flow:** 5-second prompt reveal → 55-second response writing (limit 160 Unicode grapheme clusters) → content screen and anonymisation → 25-second two-rank ballot → 12-second revealed ranking.

**Example:** “Name a perfume that should never have passed quality control.”

**Rules:** Unicode-safe length validation on both client and server; profanity controls depend on room setting; block contact details, credible threats, personally identifying data, illegal content and abuse across **all** humour settings. No submitted links. A filtered response can be revised once inside remaining time. Generic anonymous placeholder only if a permitted but unsubmitted response is required; ideally player explicitly submits.

**Chaos Contracts:** about one in two writing rounds, one modifier chosen from an eligible, pretested pool; e.g. “Your slogan must sound far too official”, “Use exactly five words”, “Speak as an apologetic spaceship” or “Make it a product recall notice”. Contract constraints are validated when syntactic and editorially signalled when subjective. Host can disable contracts.

## 4.3 Context Collapse — imaginative artefact remixes

**Objective:** turn a harmless original statement into a **fictional object from an absurd world** without targeting actual people. This is not a live social-media humiliation tool.

**Phase A (35 sec):** Everyone writes an innocuous personal-neutral sentence. Example: “I think the small blue one is much better.” Avoid requiring real confessions or personal disclosures.

**Assignment:** server creates a uniform random derangement so no player rewrites their own statement; for N=3, each seed goes to exactly one different player. Pair each seed with a fictional artefact format such as alien incident log, village mayor's decree, intergalactic lost-property notice, museum plaque or robot maintenance transcript.

**Phase B (55 sec):** Recipient writes a new caption/body (up to 180 grapheme clusters) that preserves the quoted seed verbatim but changes the surrounding imaginative context. Original input and remix appear together at voting. No actual news-service logo, real-person impersonation or false allegations about identifiable people.

**Voting (25 sec):** rank each remixed artefact anonymously. Attribution after voting can credit both the original seed writer and the remixer, but **only remixers score competitively** in this challenge. Seed creators are not jointly awarded points, which avoids incentivising private collusion. Ban the author from voting for their own remix; voters may vote for a remix derived from their own seed, as it was written by someone else. All players have one remix submission.

**Reveal (15 sec):** show “the original” and “the transformed artefact,” then reveal the remixer and original writer. Allow host skip of a disturbing artefact before it appears on TV; skipped artefact is removed from scoring and score allocation follows the invalid-entry policy.

## 4.4 Double Trouble — mandatory card + authored punchline

**Objective:** produce one comic artefact using a dealt “prop card” and a short original line.

**Start:** each player receives 3 randomly allocated neutral prop cards (such as “A ceremonial umbrella” or “An anxious kettle”), chooses one, and receives a common creative situation (e.g., “Pitch the worst theme park ride”). An optional Chaos Contract changes the style, not the points.

**Flow:** 5-second reveal → 60-second construct/submit (card ID plus <= 140 graphemes) → 25-second ballot → 12-second reveal. A response is valid only if the rendered artefact includes the chosen provided prop; users may not edit or counterfeit the prop card text. Deliberately different from a standard fill-in-the-blank card round.

**Example artefact:** Prop “A legal department of one confused duck” plus player text “Now approving your mortgage in a language nobody speaks.”

**Content review:** editor checks generated combinations, not only individual cards; explicitly reject prompts or card libraries that systematically create hateful or high-risk combinations.

## 4.5 The Last Laugh — championship finale

**Objective:** create a one-line response to a bespoke final brief under a surprising but clear Chaos Contract.

**Flow:** full-screen/phone introduction 8 sec → 65-second answer → 30-second ranked anonymous voting → 20-second progressive reveal → final standings. Every active player receives the same final prompt and contract. Example: “Deliver your acceptance speech for winning the award nobody wants”, with constraint “It must sound painfully grateful.”

**Scoring:** final round awards **1.5× ordinary rank points**, exactly and only once. This adds comeback potential but does not erase the earlier championship. If a match results in equal total scores, execute an explicit deterministic tie procedure (Section 6); never silently pick whoever submitted fastest.

**Media:** responsive confetti for unreduced-motion users, reduced-motion static trophy, skippable audio, readable text and a share card that omits any user-generated answer by default.

---

# 5. Chaos Contracts and Originality System

Chaos Contracts are written cards that instruct **how** to write, not **what offensive content to write**. They are available only for Quick Wit, Context Collapse (limited formats) and Double Trouble, plus the finale. They do not introduce extra point multipliers.

**Eligible examples:** “Exactly five words” (machine validated), “Polite official announcement” (editorial constraint), “Clearly written by an alien tourist,” “In the style of a warning label” (generic style, no living person mimicry), “One heroic exaggeration,” “Sounds like a terrible business pitch.”

**Contract schema fields:** id, locale, rating, eligibleChallenges[], validationKind, machinePredicate, maxLengthOverride, editorialNotes, status and version. Incompatible combinations are filtered server-side before random selection; e.g. “exactly five words” only if the prompt and response limit permit it. No player loses points for subjective contract interpretation; contract failure is not an automatic scoring penalty unless a clearly machine-verifiable restriction was displayed before answer entry and validation gave immediate correction feedback.

**Selection:** deterministic seed per room/round; weighted repetition avoidance; no contract more than once per match where pool permits. Use server-generated seed commitment for audit/debugging only, not a public prediction mechanism.

---

# 6. Scoring, Voting, Fairness and Disconnections

## 6.1 Party Mix canonical ballot

For each democratic challenge, every **eligible active player** submits one candidate, then every player receives two ballot selections: **Gold (first choice)** and **Silver (second choice)**. They must refer to two distinct candidates and neither may be the voter's own. With at least 3 valid entries, there are at least two others available. Submissions appear in random order per voter, not author order. Voters can revise until the ballot locks; only the latest acknowledged valid ballot is counted.

A candidate's ballot weight = `2 × goldVotes + 1 × silverVotes`. Order candidates descending by weight. Points by occupied rank: **1st = 100; 2nd = 60; 3rd and lower = 25**. Entries with identical weights share the **mean of point awards occupying their tied ranks**, rounded to the nearest integer using a documented half-up convention. This is deterministic and does not use submission timestamp or author identity to break an ordinary round tie. For example, a tie for ranks 1 and 2 gives each (100+60)/2 = 80; a three-way tie for ranks 1–3 gives each (100+60+25)/3 = 62 rounded half-up.

The scoreboard appends the awarded points to each eligible player's cumulative match score. **Last Laugh** multiplies every underlying rank award by 1.5, before half-up integer rounding; for tied ranks calculate the mean of the **unrounded** base rank values, multiply 1.5 and round once. This prevents rounding discrepancies. Example 3-way finale tie = 92.5 -> 93.

**Why this system:** Equal entry opportunity per round, simple spectator comprehension, explicit anonymous ballots and bounded comeback effects. Tradeoff: 3–4 player games have frequent ties; verify fun and score separation through Monte Carlo simulation and live playtests. Revisit weighting based on evidence, not instinct.

## 6.2 Missing votes and fewer valid submissions

- Voting opens only with **>= 3 valid eligible competing submissions**. Otherwise skip the round with no score changes; display a brief explanation and move to next round.
- Each player's valid submission is scored even if that player fails to vote. The server does not invent votes. A nonvoter gains no separate voting reward or punishment; rank totals may have lower spread. A voter who submitted a valid entry can still rank other entries.
- If a room is reduced to fewer than 3 active/eligible players, pause and allow a 90-second recovery interval. The host may end match with existing results or move to a no-score casual exhibition; cannot continue competitive scoring with 2 entrants.
- A clearly disallowed response is not shown or ranked; player has revision opportunity when time permits. If none, mark the player as no-valid-entry and exclude from that round rather than outputting an abusive placeholder.
- If all candidates tie due to no valid ballots, each receives the arithmetic mean of all applicable rank positions as above, preserving fairness and finishing the round.
- Host skips a dangerous reveal: freeze scoreboard and invalidate the offending candidate *before results are committed*, recompute if sufficient candidates remain, log the reason. Host may not arbitrarily edit scoring after commitment.

## 6.3 Classic Cards judge rules (isolated mode)

Card Clash only. Each judging round has one predetermined judge and N−1 competing players. Judge receives no submission or points that round; chooses one winner among eligible entries. Winner gets **one win**, all others zero. Judges rotate in a seeded cycle, and a full game always has a number of judge turns divisible by N (default two cycles). Host cannot choose themselves to judge extra rounds. Ranking is **total judge-mode wins**, not Party Mix points. If a judge disconnects, pause briefly, then substitute the next scheduled judge while recording fairness deviation; in rated-comparison modes, cancel/remake the round instead. This mode is a casual custom option and never shares a leaderboard with Party Mix.

## 6.4 Final overall ties

On equal total match points, compare in order: (1) number of first-place finishes outright, (2) total Gold votes received, (3) total Silver votes received. If still tied, declare **joint champions** and show a shared podium. Never claim an invented single winner. Host option for a consensual one-round tiebreak is a future enhancement.

## 6.5 Absence, pause and resume

- A disconnected player's valid submitted entry remains in the round. They can reconnect, recover the last server state and vote within any remaining timer.
- Timers use server timestamps, not phone clocks. Each phase snapshot carries `endsAt` and `serverNow`; clients display approximate countdown and resynchronise.
- If no valid submission before timeout: in Card Clash choose a safe card from the existing hand if player was present during selection; for authored rounds mark no-entry, no score. An absent player is not assigned fictional writing.
- Host may pause once per round for up to 120 seconds; pause/resume is idempotent and the same clock adjustment applies to everyone. Abuse guard: max three host pauses per match, configurable in private beta.
- Connection recovery: resume secret -> rebind seat -> full filtered authoritative `room:snapshot` with revision number. Stale submits are rejected with a reason and replacement snapshot. Must not re-run scoring or reveal private answers because of retries.

---

# 7. Match Lifecycle and State Machine

## 7.1 Canonical states

`CREATED -> LOBBY -> COUNTDOWN -> ROUND_INTRO -> SUBMISSION -> [TRANSFORM_ASSIGNMENT -> REMIX_SUBMISSION for Context Collapse] -> VOTING -> REVEAL -> ROUND_RESULTS -> (next ROUND_INTRO | FINAL_RESULTS) -> CLOSED`

Global interruption states: `PAUSED`, `RECOVERING`, `CANCELLED`, `EXPIRED`. Valid transitions are defined in one pure rules module with guard functions. Transition events always name the previous state, new state, round ID, reason, server sequence and effective timestamp.

## 7.2 Suggested Standard playlist (7 challenges)

1. Card Clash
2. Quick Wit
3. Context Collapse
4. Card Clash
5. Double Trouble
6. Quick Wit
7. The Last Laugh

Quick (5): one of each type. Extended (10): Card Clash ×3, Quick Wit ×2, Context Collapse ×2, Double Trouble ×2, Last Laugh ×1. The Last Laugh always final. Shuffle nonfinal order within editorial guardrails; do not put identical text-heavy challenges consecutively in Quick if avoidable.

## 7.3 Determinism and auditability

Room seed generated with cryptographic randomness; no client-selected RNG seed in paid/ranked rooms. Store content pack version, rules version, phase state revision and final awarded points. All mutations are server-only and idempotently committed. Complete match outcome can be replayed from a stored state snapshot and ordered event log in development/admin tooling (privacy-limited; see retention rules). Separate gameplay reproducibility data from user-generated text with limited retention.

---

# 8. User Experience and Screen-by-Screen Specification

## 8.1 Shared navigation map

`Landing -> Demo OR Buy/Sign in -> Dashboard -> Create Room -> Lobby -> Live Match -> Results -> Replay / New Match`.

Guest: `Invite/Join -> Nickname + Content Notice -> Lobby -> Game Phase UI -> Results -> Exit`.

TV: `Pair TV -> Waiting / Lobby -> Intro -> Challenge Prompt -> Anonymous Cards -> Vote Count -> Scoreboard -> Podium`.

## 8.2 Screen inventory

| ID | Screen | Primary audience | Critical behaviours |
|---|---|---|---|
| W01 | Landing / product | Buyer | Demo, buy, game explainer, accessibility and content warnings |
| W02 | Pricing and checkout | Buyer | One-off licence terms, pack pricing, clear taxes, secure checkout redirect |
| W03 | Purchase success / recovery | Buyer | Verify server-entitlement, sign in, resend receipt; never rely on success URL alone |
| W04 | Host dashboard | Buyer | Create room, see owned packs, account and purchases, last rooms |
| W05 | Create room | Host | Mode, length, content rating, pack selection, accessibility, contracts, privacy |
| W06 | Lobby / TV | Host/TV | Large room code/QR, seats, connected status, start disabled under 3 players |
| W07 | Join / nickname | Guest | Code, safe nickname, consent/content notice, clear joining errors |
| W08 | Player lobby | Guest | Seat confirmation, host, rules, audio toggles, ready status |
| W09 | Card selection | Player | Hand of 7, prompt, submit ACK and resubmit policy, countdown |
| W10 | Creative input | Player | Prompt, text box, live count, contract, validation and ACK |
| W11 | Remix assignment | Player | Seed and fictional format, edit input, no personal targeting reminders |
| W12 | Voting | Player | Anonymous candidates, Gold & Silver, no own selection, confirmation |
| W13 | Reveal | All/TV | Prompt/artefact, ranking, authors after voting, score points, skip animations |
| W14 | Scoreboard | All | Cumulative total, positions, next challenge; offline player indicators |
| W15 | Finale / podium | All | Champion(s), ceremony, restart, privacy-safe share card |
| W16 | Pause/disconnection | All | Why paused, retry status, host options, no stale buttons |
| W17 | Report content | Player/host | Category, context, report acknowledgement, emergency skip option |
| W18 | Pack library / store | Buyer | Descriptions, content rating, pack ownership, compatibility |
| W19 | Settings/accessibility | All | Font scale, motion, volume, colour/contrast, captions, privacy |
| W20 | Admin content review | Staff | Draft -> QC -> publish, moderation queues, pack version rollback |

## 8.3 UX implementation rules

- **TV stage:** 16:9 safe area; tested at 1280×720 and 1920×1080; minimum comfortably readable typography at typical viewing distance. Use no crucial hover-only affordances. Privacy: reveal only public prompt/results, never phone private hands or ballot choices.
- **Phone player:** portrait 320–430 px wide as priority; safe-area insets, touch targets >= 44×44 CSS px, keyboard-aware focus and scroll; landscape usable. No endless-scroll voting list if 12 entries—paginate/virtualise with accessible progress.
- **Phone-only shared reveal:** full-screen shared-view phase replicated on every phone, with an obvious "Next" host action; no missing information compared with TV mode.
- **Input:** visible submit/ack, safe retry semantics, countdown under 10 seconds emphasised without strobing; visually distinct private and public text.
- **Accessibility:** WCAG 2.2 AA as design target, screen-reader phase announcements, keyboard actions, noncolour status cues, text scaling, focus control, reduced motion and never audio-only directions.
- **Localization:** externalize text into locale bundles; translated cards are separately edited/certified; no runtime unmoderated translation of adult/cheeky content.
- **Error states:** full room, expired room, invalid code, host left, purchaser entitlement missing, banned nickname, content setting changed, already-voted, timeout, lost connection, purchase pending/refunded.

## 8.4 Sample wireframe copy

**Lobby TV:** “ECKY THUMP / ROOM: K7M4Q9 / Scan to join / 5 of 12 players ready / Clean Comedy / 7 rounds / Starting when the host is ready.”

**Player submission:** “ROUND 2: QUICK WIT / Invent a terrible name for a luxury ferry / CHAOS CONTRACT: Sounds reassuringly official / 00:43 left / [Your answer...] / Submit answer.”

**Player ballot:** “You cannot vote for your own answer. Choose your favourite (Gold) and runner-up (Silver). Votes are anonymous until locked.”

---

# 9. Content Rating, Library and Editorial Process

## 9.1 Content ratings

- **Clean:** no explicit sexual material, severe profanity, hateful material, graphic violence or explicit drug references; safe in a workplace or general social setting, without promising under-18 availability.
- **Cheeky:** mild profanity, innuendo, suggestive adult topics and playful irreverence; still never hate, harassment, illegal content, credible threats or exploitation.
- **Adult:** stronger non-graphic sexual innuendo and profanity within clearly defined editorial boundaries. Excludes pornographic/graphic sexual material, sexual content involving minors, threats, hate, abuse of identifiable individuals, doxxing and illegal content. Legal classification must be reviewed before launch.

**Content selection rule:** room rating sets a maximum: Clean loads only Clean; Cheeky loads Clean+Cheeky; Adult loads all three approved tiers, subject to age/eligibility controls and owner packs. A host can select lower-rated packs in a more permissive room. User input is **not guaranteed** to stay within the chosen rating: screen, report, host skip and rapid controls remain mandatory.

**Custom content:** privately authored packs by a host are a post-MVP feature; do not enable distribution, search, sharing or sale of user-created packs at initial launch. If enabled, require per-item moderation, privacy and content rating even for private rooms. Never assume a text blacklist alone ensures safe content.

## 9.2 Content inventory targets for launch (not commitments)

| Type | Candidate quantity | Notes |
|---|---:|---|
| Card Clash response cards | 300 | Diverse grammatical structures, avoid same joke repeated |
| Card Clash prompts | 120 | One-slot prompts; semantic/grammatical fit |
| Quick Wit prompts | 100 | Balanced open-ended instructions |
| Context Collapse artefact templates | 80 | Fictional formats, clear format wording |
| Context Collapse innocent seed prompts | 40 | Optional nonpersonal writing scaffold |
| Double Trouble prop cards | 90 | Distinct from response-card pool |
| Double Trouble situations | 60 | Prompt + prop composability |
| Last Laugh finale briefs | 30 | Hand-authored highest-impact content |
| Chaos Contracts | 45 | Compatibility flags and validation |

With Standard 7 rounds, playtest repeated-session exhaustion and pack distribution. Numbers should change with joke quality, session repetition and budget. 300 weak cards are not a worthwhile release.

## 9.3 Content object example

```json
{
  "id": "cc_prompt_uk_000142",
  "type": "card_prompt",
  "schemaVersion": 1,
  "packId": "core_uk",
  "packVersion": "1.0.0",
  "locale": "en-GB",
  "rating": "clean",
  "text": "The mayor unveiled a monument honouring ____.",
  "slots": 1,
  "tags": ["civic", "absurd", "noun_phrase"],
  "editorialStatus": "approved",
  "rightsStatus": "original_assigned",
  "reviewedBy": "editor_02",
  "reviewedAt": "2026-10-19T09:00:00Z",
  "safetyFlags": [],
  "weight": 1
}
```

Use opaque unique IDs that do not leak answers. Do not trust the client-supplied rating, eligibility or pack ownership. Version strings in content records must resolve to immutable content snapshots.

## 9.4 Editorial pipeline

1. Draft original content with assigned creator and rights record; flag third-party influence/reference.
2. Check originality, defamation, discrimination, exploitative sexual content, realism of harm and topical expiry.
3. Apply tier, locale, tags, challenge compatibility and grammar/slot constraints.
4. Independent second-editor review for Cheeky/Adult; sample combinations from prompts, props and answers.
5. Automated static validation: ID uniqueness, UTF-8, length, permitted tags, missing assets, prohibited PII fields, duplicate detection and blank prompts.
6. Structured playtest: response success, laughs, confusion, offensiveness reports and repeated content.
7. Publish signed/immutable version; support rollback and kill-switch without changing already concluded matches.

Do not include text or visual assets copied from the five benchmark titles. Maintain asset licensing inventory, music/SFX licences and a plagiarism/clearance checklist.

---

# 10. Technical Architecture

## 10.1 Recommended topology

```text
                 HTTPS                     HTTPS
       +-------------------+       +-------------------+
       | Web Frontend      |       | Payment Provider  |
       | Landing/Host/TV/  |       | Stripe Checkout   |
       | Phone/Guest       |       +---------+---------+
       +---------+---------+                 |
                 | REST + Socket.IO         | signed webhook
                 v                          v
       +------------------------------------------------+
       | Node.js / TypeScript Application Server        |
       | Auth + Entitlements + Lobby + Phase Engine     |
       | Server-side Content Filtering + Vote/Scoring   |
       | Moderation + Audit + REST/Socket.IO             |
       +------------------+-----------------------------+
                          |
             +------------+------------+
             |                         |
             v                         v
       +-------------+          +----------------------+
       | PostgreSQL  |          | Metrics / Error      |
       | Accounts,   |          | Monitoring, capped   |
       | Purchases,  |          | safe structured logs |
       | room states |          +----------------------+
       +-------------+
```

**MVP host:** one stateless-ish Node application instance with persistent PostgreSQL for long-lived data and resilient room snapshots. In-memory room cache may accelerate reads but must never be the sole recoverable record for paid matches. Avoid multi-instance production scale until concurrency demands it; later add a supported shared adapter and distributed lock/state strategy. Redis Pub/Sub alone does not make missed-event recovery reliable.

## 10.2 Stack and package choices

- **Server:** Node.js current maintained LTS line at implementation time, TypeScript strict mode, Fastify or Express (choose one), Socket.IO v4 compatible client/server.
- **Client:** HTML/CSS/TypeScript or vanilla JS; prefer lightweight Vite bundling with modular components over a heavyweight framework until real complexity warrants one. UI architecture independent of framework.
- **Database:** PostgreSQL migrations, parameterised queries, connection pooling, backup/restore verification.
- **Quality:** Vitest or Jest unit/integration tests, Playwright for multi-tab browser journeys, Zod/JSON-schema validation, lint/typecheck and CI release checks.
- **Hosting:** Render-compatible web service, managed Postgres, HTTPS/WSS, secure secret management, health checks and separate staging/production.
- **Payments:** Stripe Checkout, signed and idempotent webhook processing; no card numbers touch game infrastructure. Server verifies entitlements on room create and pack selection.
- **Observability:** error capture and structured event metrics with pseudonymisation and data minimisation.

## 10.3 Data boundaries and authority

Client sends **intent**, not resulting score or phase. The server owns deck shuffle, card hands, contract choice, assignment mapping, timers, anonymous ballot map, award calculation, entitled pack list and room transitions. Payloads for players are filtered; never broadcast a common unfiltered room object that contains every hand or secret author identity.

**Server session claims:** owner account ID/guest seat ID, room ID, role, revocation marker and entitlement checks. Sensitive authentication uses secure, HttpOnly cookies or equivalent browser-safe sessions; room/seat resume secrets stored as secure random tokens, rotating when stolen/taken over.

## 10.4 Persistent schema (proposed tables)

| Table | Essential fields / constraints |
|---|---|
| accounts | id PK; verifiedEmail unique; authProvider; createdAt; deletion state |
| purchases | id PK; accountId FK; stripeSessionId UNIQUE; paymentIntentId; state; amount; currency; paidAt; refundedAt |
| entitlements | id PK; accountId; sku; sourcePurchaseId; active; effective dates; UNIQUE source-grant key |
| packs | id; sku; locale; rating; activeVersion; metadata; publication status |
| pack_versions | packId + version composite key; assetHash; status; publishedAt |
| content_items | id + packVersion; type; rating; JSON document; editorial/rights metadata |
| rooms | id PK; code UNIQUE active; ownerAccountId; state; config JSON; seedRef; lastActivity; expiresAt |
| room_seats | roomId + seatId PK; displayName; joinOrder; resumeTokenHash; status; optional owner link |
| rounds | id PK; roomId; ordinal; challengeType; state; timerEndsAt; version; contentVersionRef |
| submissions | roundId + seatId UNIQUE; encryptedOrLimitedText; selectedCardIds; validState; authorSeatId |
| ballots | roundId + voterSeatId UNIQUE; goldSubmissionId; silverSubmissionId; lock state |
| score_awards | roundId + seatId UNIQUE; baseAward; multiplier; finalAward; calculationVersion |
| room_events | roomId + sequence UNIQUE; commandId UNIQUE scope; type; timestamp; minimal sanitized JSON |
| safety_reports | id; roomId; reporterSeatId; category; contentRef; triage state; restricted audit fields |
| admin_audit | actor; action; target; timestamp; purpose; immutable reference |

Production should enforce all uniqueness and referential constraints. Personal/user-generated text has separate retention and access policies; the table list is logical, not a mandate to persist every answer indefinitely.

## 10.5 Socket.IO event contract

Client-to-server commands (all with requestId, roomId, seat-scoped credential, expectedRevision when relevant):

`room:create`, `room:join`, `room:resume`, `seat:ready`, `host:configure`, `host:start`, `host:pause`, `host:resume`, `host:skip-content`, `answer:submit`, `ballot:submit`, `content:report`, `session:leave`.

Server-to-client events:

`room:snapshot`, `room:playerJoined`, `room:configChanged`, `phase:entered`, `phase:timer`, `answer:accepted`, `ballot:accepted`, `round:results`, `match:results`, `host:changed`, `room:paused`, `seat:connection`, `error:recoverable`, `error:fatal`, `safety:action`.

Every command receives `{ok, requestId, acceptedRevision, serverNow, errorCode?}` within a bounded timeout. Repeated requestId yields the **same logical outcome** rather than duplicating submission/award. Events include monotonic revision; client requesting a snapshot on missing revision/gap. Do not trust client-provided seatId or any authorId in vote payload.

## 10.6 Example authoritative submission payload

```json
{
  "requestId": "6ebdb765-73b6-4586-9d2c-32a32e74dd18",
  "roomId": "room_uuid",
  "roundId": "round_uuid",
  "expectedRevision": 19,
  "kind": "quick_wit",
  "text": "The Grand Hotel of Slightly Damp Towels"
}
```

The server obtains identity from the socket session, checks `phase===SUBMISSION`, correct round, timer, length, rate limit, content state and owner seat, then commits in one transaction and ACKs. In Card Clash, client sends `cardId` only; server verifies card exists in that player's hand. In Double Trouble, server checks chosen prop card was dealt and inserts trusted prop text itself.

## 10.7 Server-side pseudocode for finalising democratic vote

```ts
function finishVoting(round: Round, ballots: Ballot[], candidates: Candidate[]) {
  const valid = candidates.filter(c => c.valid && c.eligible);
  if (valid.length < 3) return commitSkippedRound(round.id, 'insufficient_entries');
  const weight = new Map(valid.map(c => [c.id, 0]));
  for (const b of ballots) {
    if (!isAuthorizedEligibleVoter(b.voterSeatId, round)) continue;
    if (!isValidDistinctOtherCandidatePair(b, valid)) continue;
    weight.set(b.goldId, weight.get(b.goldId)! + 2);
    weight.set(b.silverId, weight.get(b.silverId)! + 1);
  }
  const orderedGroups = groupByEqualWeightDescending(valid, weight);
  let occupiedRank = 1;
  for (const group of orderedGroups) {
    const rankAwards = Array.from({length: group.length}, (_, j) =>
      occupiedRank + j === 1 ? 100 : occupiedRank + j === 2 ? 60 : 25);
    const base = sum(rankAwards) / group.length;
    const multiplier = round.challengeType === 'last_laugh' ? 1.5 : 1;
    for (const entry of group) {
      upsertUniqueAward(round.id, entry.seatId, roundHalfUp(base * multiplier));
    }
    occupiedRank += group.length;
  }
  commitResultsAndTransitionAtomically(round.id);
}
```

Implementation note: even with no ballot, the ordering groups all candidates equally, resulting in equal average award for their occupied ranks. The pseudocode omits locking/transaction, disconnect and invalid-entry details; these are essential in production.

## 10.8 REST/API endpoints (starter)

- `POST /api/auth/login` (or outsourced auth flow), `GET /api/me`, `POST /api/auth/logout`
- `GET /api/catalog`, `GET /api/catalog/packs`, `GET /api/me/entitlements`
- `POST /api/checkout/session` (authenticated, SKU allowlist, rate-limited)
- `POST /api/payments/stripe-webhook` (raw-body signature verification; idempotent)
- `POST /api/rooms` (authenticated purchaser or demo), `GET /api/rooms/:code/public`
- `POST /api/rooms/:code/join` (guest), `POST /api/rooms/:code/resume`
- `GET /api/rooms/:code/snapshot` (authenticated seat or display role)
- `POST /api/safety/report` and admin-only review endpoints
- `GET /healthz` and `GET /readyz`

Do not transmit authorization in query URLs where it leaks to browser histories/referrers. Rate-limit room code probes and auth/checkout endpoints; check CORS/origin boundaries and CSRF on cookie-backed mutations.

---

# 11. Payment, Access Control and Expansion Packs

## 11.1 Payment workflow

1. Buyer creates an account or signs in before checkout to establish durable entitlement owner.
2. Server creates a Stripe Checkout session for a preconfigured SKU/price. Client cannot set price/currency freely.
3. Stripe processes payment off-site. Success-page redirect conveys **pending verification**, not automatic access.
4. Backend validates Stripe webhook signature and event idempotency; retrieves required canonical payment information server-to-server where necessary.
5. Server writes purchase, then entitlement, in a database transaction; returns verified owned-product state.
6. Refund, dispute, revocation or account deletion triggers documented access changes after legally appropriate handling.
7. A paid room verifies owner entitlement on creation, and packs are verified at room configuration AND at game start. A guest does not need an entitlement.

**Failure cases:** lost webhook, duplicate webhook, out-of-order events, checkout succeeded but browser closed, refunded purchase, chargeback, account email change and reused session. Provide reconciliation job and support workflow. No direct credit card storage.

## 11.2 Licensing semantics to decide before launch

Define in plain English: one-off account licence, simultaneous room policy (recommended maximum **two concurrent live rooms per owner** at release; validate commercially), family/venue use, streaming/public performances, transferability, region/locale, service discontinuation, pack availability and account recovery. Do not make “lifetime” or “forever” claims for an online server-backed game.

## 11.3 Expansion content selection

Core match must always work without packs. A room may activate several owned packs; each item must pass the selected room rating, locale and compatible challenge constraints. Store each pack and version in room config at match start so updates do not alter the game mid-match. Future seasonal packs should add substantial, high-quality original material, not essential mechanics withheld from base-game owners.

---

# 12. Online Safety, Privacy, Content Abuse and Legal Release Gates

**This section is a product engineering checklist, not legal advice. A UK online-safety/privacy review is required before a commercial release.**

## 12.1 Safety by default

- Invite-only unlisted rooms; no search index or open room directory.
- No user-to-user direct messages, profiles, location fields or third-party contacts.
- Nickname validation and reportable submissions; per-room block/kick and ban token/session for abusive guests.
- User text screened before display for illegal content, threats, hate and personal data; allow rapid host hide/skip even after initial automated approval. A keyword filter alone is insufficient.
- No automatic sharing of responses to social media, especially content attributed to real persons.
- No real-person defamatory “news” artefacts; fictional contexts only.
- Abuse reporting with categories, optional evidence capture, audit trail, triage ownership and appeal/contact process. Emergency severity queue for urgent threats/exploitation.
- Default Clean, and user-facing preview of content setting before guests enter. Adult may require additional controls depending on legal assessment; simple self-declaration alone must not be assumed legally sufficient.
- Data-protection impact assessment/risk assessment as applicable; document age-access, child-safety and illegal-content scope before launch.

## 12.2 UK statutory decision points

- **Online Safety Act:** determine whether the service is an in-scope user-to-user service. Private rooms and guest text can still raise in-scope questions; document illegal-content risk assessment, complaints processes, user reporting and any children-access assessment and associated protection duties. Obtain advice on thresholds/timelines applicable to this exact design.
- **ICO Children's Code:** assess if UK under-18s are likely to access the product, even if it is not marketed to them. If yes, privacy-by-design and child-access protection requirements materially affect accounts, profiling, discoverability, personal data, settings and adult content. No assumption that marking an app '18+' makes it legally inaccessible to minors.
- **Age assurance:** if adult material crosses regulated categories or service rules require it, implement a regulator-appropriate solution. Profanity and adult humour do not by themselves determine the same age-assurance requirements as pornography; classify accurately with legal counsel. Exclude pornography from authored content.
- **Data protection:** UK GDPR/PECR lawful bases, transparency, deletion, access requests, cookies, retention, processor contracts, breach procedures and international transfers.
- **Consumer rules:** accurate one-off licence terms, price including or clearly describing taxes, cancellation/refund information applicable to digital content, accessible support and purchase records.
- **IP:** original code/art/cards/fonts/audio; original written jokes; contributor rights assignments; trademark/name clearance; no third-party proprietary decks without explicit relevant commercial licences.

Useful official references are provided at the end. Regulatory posture may evolve, so verify at launch.

## 12.3 Retention and security baseline (proposals to review)

- Persistent purchaser account, transactions and entitlements: retain to meet legitimate operational, tax and statutory duties under a documented schedule.
- Closed match room metadata and aggregate scores: operational retention proposed 30 days maximum by default, after which delete or aggregate/anonymise unless dispute/support requires longer.
- Raw authored answers and ballots: erase at or shortly after match end by default; suggested retention <= 24 hours except explicit report evidence and opted-in host history. Retain only minimal non-identifiable metrics longer.
- Report evidence: purpose-limited case retention under an approved policy, encrypted at rest, access logged.
- Guest resume tokens expire soon after room end; do not store plaintext secrets.
- TLS/WSS, restrictive Content Security Policy, secure cookies, passwordless auth or sound password controls, dependency scans, no secrets in client bundle, prepared SQL, escaping, cross-site scripting protections, webhook signature verification, audit access control and daily DB backups with recovery tests.
- WebSocket actions must undergo **exactly the same authorization** as HTTP endpoints. Per-seat/rate/IP controls defend against flooding; never publicly expose customer email addresses or payment details.

## 12.4 Failure to launch conditions

Launch blocked by: unresolved safety/legal scope; unsafe adult content exposure; no user reporting; known XSS/SQL injection; client-trusted points; replayed webhook granting duplicates; missing payment reconciliation; loss of state on ordinary restarts without recovery; unresolved high-severity crashes; materially inaccessible core game; missing IP provenance for launch content; no restore-tested backups.

---

# 13. Reliability, Performance, Deployment and Operations

## 13.1 Service objectives

- Typical controlled environment: submit ACK target p95 < 2 s; room-state update visible p95 < 2 s; these are product targets, not contractual SLAs.
- Tested concurrent capacity target for first paid release: **50 simultaneous 12-player rooms** on the selected hosting tier, including one TV connection each, under synthetic load. Scale after measurement; do not state this is already achieved.
- Graceful reconnect test: simulated 5–30 second intermittent disconnects during every phase with no lost/duplicate score awards. A recovery screen appears within 3 seconds of detected disconnect where browser permits.
- DB backup daily at minimum, documented RPO/RTO goals agreed prelaunch. One restore rehearsal before each major launch.
- Disable new room creation temporarily during planned maintenance with notice; active matches must fail gracefully if a deployment interrupts service.

## 13.2 Production environments

Development (local), staging (separate Stripe test account/DB and fake content), production (Stripe live; distinct secrets). CI must run typecheck, lint, unit/integration, content integrity and a minimum browser smoke suite. Use semantic releases, migrations with rollback/forward recovery, feature flags for new challenges, versioned assets and documented release notes.

## 13.3 Core telemetry

`room_created`, `invite_opened`, `guest_joined`, `lobby_abandoned`, `match_started`, `phase_entered`, `submission_accepted`, `submission_rejected_reason`, `vote_accepted`, `reconnect_attempted`, `reconnect_succeeded`, `match_completed`, `report_created`, `purchase_started`, `purchase_verified`, `purchase_refunded`, `pack_activated`. Do not collect raw answer text in generic telemetry. Redact secrets/PII, limit retention and provide lawful opt-outs where required.

---

# 14. Test Specification and Acceptance Criteria

## 14.1 Rules and fairness tests

- **Minimum/maximum:** 3 and 12 active players can run Standard match with no missing or duplicated entries.
- **No self voting:** API and UI reject Gold or Silver = own candidate; repeated Gold/Silver also rejected.
- **Stable tie:** 3-way equal ballots allocate identical points, independently of candidate order or connection order.
- **Final multiplier:** applied exactly once with specified half-up rounding, including ties.
- **Classic judge parity:** number of judging turns equal for all participants; judge never submits/votes in own judged round.
- **Derangement:** with 3–12 players, every seed assigned exactly once; no player gets own seed.
- **Submission uniqueness:** retries/parallel submits cannot create two valid answers for one seat/round.
- **Race:** phase expiration wins over late packets; client receives clear authoritative rejection/snapshot.
- **Restart:** server recovery retains scores, assignment mapping, hand state, content versions and timer status.
- **Content filtering:** no disallowed authored item selected; room rating changes apply to future content; cannot unlock a pack without entitlement.

## 14.2 Payments and security tests

- One successful payment grants entitlement exactly once with duplicate/out-of-order webhook delivery.
- Redirect to success page without verified purchase never grants access.
- Manual client mutation of price, entitlement, deck, timer, phase, points or author ID rejected server-side.
- Guest joining without purchase permitted only with a valid room invitation/authorization.
- Forbidden content, HTML/script strings and malicious inputs are safely rejected or rendered inert on TV/phone.
- Revoked owner licence cannot create new paid rooms; define behavior for in-progress room in terms.
- User can submit a report, moderator can review with audited access, and content can be hidden.

## 14.3 Browser and network matrix

- Windows desktop Chrome/Edge/Firefox; macOS Safari; iOS Safari; Android Chrome at tested minimum supported versions.
- 320 px, 375 px and 430 px phone widths; keyboard open, orientation change, slow connection, packet loss, low battery, background/foreground resumes and sleep/wake.
- TV 720p/1080p and 4K downscaling; browser zoom 200%, high contrast where supported, screen reader navigation, keyboard-only flow and reduced motion.
- Up to 12 candidates on ballot screen; long text, line breaks, multilingual text and emoji without overflow or malformed Unicode.

## 14.4 Launch acceptance user journeys (Definition of Done)

**J1 Paid TV:** Purchaser buys -> account entitlement verified -> creates private room -> connects TV -> 3+ guests join via QR -> 7 rounds complete -> final winner -> replay works.

**J2 Paid phone-only:** Host launches same content without TV -> remote guests join by URL -> prompts/voting/results fully visible on phones -> complete match.

**J3 Demo:** Unpaid person completes a limited 5-round Clean sample with clear upgrade messaging; no dead end or leaked paid entitlement.

**J4 Recovery:** Guest loses connection during writing and returns on same seat; saved submission status and timer accurate; no duplicated score or seat.

**J5 Safety:** Player reports offensive text; host hides it before TV reveal; moderator case created; scoring resolved deterministically.

**J6 Checkout failure:** Card declined, paid-but-webhook-delayed, refund and repeated checkout events lead to consistent owner messaging and entitlements.

---

# 15. Development Phases, Epics and Delivery Order

This is an **incremental scope plan**, not a promise of specific calendar dates. Actual timing depends on development capacity, testing, design/content effort and safety/legal work.

## Phase 0 — Product foundation and IP/legal preflight

- Confirm no existing name/trademark conflict; decide final brand.
- Define audience eligibility and safety duties with qualified review.
- Sign off content policy, player count, score/tie formula and 7-challenge playlist.
- Establish GitHub mono-repository, staging secrets, CI, issue labels and coding standards.
- Produce 10–20 original prompts per challenge for the prototype.
- **Exit:** approved product one-pager, written compliance decision log, architecture skeleton and working CI.

## Phase 1 — Multiplayer vertical slice

- Owner/demo lobby, joining QR/code, 3–12 seats, seat resume, host start/stop.
- Card Clash and Quick Wit end-to-end, anonymous two-rank ballots, scores.
- Server state machine, timestamps, deterministic scoring and security validation.
- Basic TV and phone-only pages that exercise the **same** events.
- Automated 3-/12-player round simulations; network disconnect tests.
- **Exit:** complete playable two-challenge match with reliable score and reconnect.

## Phase 2 — Complete challenge championship

- Context Collapse derangement/remix, Double Trouble prop + writing, Last Laugh finale.
- Chaos Contract compatibility and validation; Standard 7-round playlist.
- Scoreboard, final awards, no-score fallback, host pause and skip/recover.
- Polished phase messaging and sound triggers across both display formats.
- **Exit:** full original championship completed by independent playtest groups.

## Phase 3 — Professional UI, content and accessibility

- Final art system, responsive UI, branded intro/podium and motion-reduced equivalents.
- Curate and review initial content packs and all tier metadata.
- Clean, Cheeky and Adult filtering/guest notices with approved eligibility controls.
- Accessibility audit; 12-player mobile ballot usability and TV readability.
- Structured playtests: fun, speed, comprehension, offensive content and replay value.
- **Exit:** content and experience acceptance gates passed without major flow confusion.

## Phase 4 — Payments, account system and operating controls

- Secure account recovery, Stripe test/live integration, entitlements and pack library.
- Purchase verification / webhook reconciliation, refunds and duplicate delivery tests.
- Safety reporting, operator review, privacy/terms/rights and support workflow.
- Postgres persistent state, backups, restore test, analytics and monitoring.
- Load testing, deploy/rollback and documented incident playbooks.
- **Exit:** legally reviewed, securely purchasable closed release candidate.

## Phase 5 — Closed beta and commercial launch

- Invite test hosts across local, remote, adult/cheeky/clean and mixed device conditions.
- Resolve all P0/P1 issues, top comprehension and accessibility failures.
- Verify conversion funnel, content repeat rates, abandonment, infra costs and support.
- Begin with controlled sales, customer support process and marketing materials.
- **Exit:** measurable operational readiness and no unresolved launch blockers.

## Phase 6 — Evidence-based expansion

Choose from customer evidence: additional content packs, custom private packs, 16 players, audience spectator votes, hosted pub events, alternate languages, season/league stats. Introduce only one major high-risk feature at a time, and repeat safety/privacy assessment when changing content distribution or visibility.

---

# 16. Prioritised Product Backlog

**Must — release-critical:** stable 3–12 private lobby, secure purchaser owner, joining by QR/link/code, first-class phone-only and TV modes, all five challenges, deterministic ballot/rules, tie and no-valid-entry handling, Clean/Cheeky/Adult content selection, content provenance, moderation/reporting, robust server reconnection, purchased host entitlement, Stripe webhooks, packs, accessibility baseline, support/legal pages, telemetry without raw text, CI and backup restore.

**Should — if schedule allows:** replayable summary without storing player text, crossfade audio, typography options, three match length presets, player-ready status, context tutorial cards, pack preview, host vote timer preference within bounded presets, expanded locale-ready strings and content browser.

**Could — later:** venue/presenter modes, themed trophies, local offline-like tutorial, 16 players, non-player public spectator voting, private custom packs, gift purchases, discounts, seasonal packs, multi-language, mobile PWA install, recording/streamer-safe mode.

**Won't in v1.0:** public matchmaking, live chat/voice, open deck marketplace, uploading images, AI response generation, unverified minors' access to Adult content, subscription paywall, public leaderboards or real money prizes.

---

# 17. Dependencies, Risks and Decision Register

| Risk / assumption | Exposure | Mitigation / decision |
|---|---|---|
| Brand clashes with existing mark | Rebrand cost and legal risk | Clear UK/international naming before final art |
| Unoriginal/mechanical clone perception | Low willingness to pay | Distinct show flow, original library, Chaos Contracts, first-class dual format |
| Short-lived joke library | Poor repeat sales | Test repeated sessions; editorial cadence and meaningful paid packs |
| User text creates legal/safety hazards | Trust and compliance risk | Restricted launch visibility, reporting, host skip, moderation and legal review |
| Under-18 audience ambiguity | Regulatory complexity | Written likely-accessed-by-children and age assurance decision before launch |
| One-off paid game requires servers | Long-term margin risk | Measure unit costs per player-hour and capacity; transparent service terms |
| Free guests allow owner account sharing | Revenue leakage | Host auth, small simultaneous-room cap, anomaly monitoring, no punitive false positives |
| Scoring degenerate at 3 players | Ties and dissatisfaction | Monte Carlo simulations, 3-player focused playtests, adjust ballot method if needed |
| TV and phone-only scope doubles QA | Quality/cost risk | Shared server rules, shared design tokens and component states; separate UX acceptance |
| Disconnections duplicate/miss actions | Incorrect wins and churn | ACKs, idempotency, state revisions, snapshots and database constraints |
| Paid card packs affect vote fairness | Perceived pay-to-win | Content-only expansions; no strength ratings or mechanical boosts |
| Unreviewed creative input leaks to TV | Abuse / shock to players | Server filter, private pre-reveal processing, host skip and report |
| Payment event race conditions | Lost or duplicate purchases | Signed webhooks, unique event ledger, reconciliation worker |

## Decisions requiring signoff

1. **Final name:** pending clearance. “ECKY THUMP” is not yet a cleared mark.
2. **Age eligibility:** choose intended audience, child-access controls and adult-content gates following legal advice.
3. **Adult boundaries:** exclude pornography/graphic content; validate exact permitted authored tier.
4. **Guest content moderation:** define service response expectations and retention of report evidence.
5. **one-time licence rights:** establish concurrent rooms, venue/streaming use and availability terms.
6. **Fairness:** keep Gold/Silver rank ballot only if 3-player and 12-player simulations and tests support it.
7. **Pricing:** A/B test/consumer interviews on £12.99 and pack values; do not treat as proven.
8. **Hosting service level:** load test before choosing final Render plan or adding Redis/multiple instances.

---

# 18. First Engineering Sprint — Executable Work List

**Sprint outcome:** a secure 3-player vertical slice in which an unauthenticated demo host creates a Clean room; players join from separate browsers; a Card Clash prompt is dealt; players submit one response each; votes are recorded without self-voting; final scores appear both on `/tv` and every `/play` device; a reconnect does not change results.

**Order:**

1. Repository structure: `apps/server`, `apps/web`, `packages/rules`, `packages/content`, `packages/contracts`, `tests/e2e`, `docs`.
2. Define JSON schema for Room, Seat, Round, Candidate, Ballot, Award and ContentItem; strict type validation.
3. Implement pure `rankAndAward()` and `derangeSeats()` with seeded property tests, independent of UI.
4. Build authoritative server room store with revision counter, database constraints and explicit transition map.
5. Implement guest join/resume security and three player-specific filtered snapshots; generate QR and code.
6. Card Clash response dealing, safe original sample pack and card ownership validation.
7. Render phone selection, TV anonymous prompt and phone/TV voting state; Gold/Silver controls on each phone.
8. Server commit & broadcast results; handle retries, disconnect and late messages.
9. Playwright multi-browser test with 3 real clients, TV page, reconnection and exact awarded scores.
10. Add minimal README: clone, install, create `.env`, database start/migrate, `npm run dev`, open host/TV/phones, run test.

**Sprint acceptance:** one command starts local environment; automated tests pass; third-party IP not present; no user can submit/vote using another seat; a browser refresh does not create an extra player; the same round awards the same points regardless of event retry order.

---

# 19. Commercial Validation and Marketing Test

Before investing in the full original pack library, test the product in a realistic house-party setting and on a remote group call. Ask observers to record actual join friction, laughter moments, dead time, complaint content and repeat interest. Price-test with real offers or carefully designed choice experiments (not only “Would you pay?” survey questions). The strongest claim to test is: **“One purchase turns your phones and/or television into a complete comedy championship for your group.”**

Recommended initial sales funnel: product landing page -> video showing both formats -> free Clean demonstration -> account/checkout -> immediate hosted room -> follow-up receipt/support. Conversion analytics are not the sole success test; count completed matches, second matches and word-of-mouth invites. Keep pack store off the critical join path.

**Unit economics model to fill with observed values:** revenue per buyer after taxes/payment fees and refunds − acquisition cost − expected hosting use cost − support cost − content/licensing amortisation. A £12.99 price is only attractive if buyers perceive repeated fun and operating margins remain durable; avoid perpetual service promises.

---

# 20. References and Verification Notes

Verified public documents consulted for the **technical and regulatory design considerations**, accessed 19 October 2026. They are supporting references, not a substitute for professional legal advice or implementation testing.

1. Socket.IO official docs — Delivery guarantees (at-most-once by default, additional guarantees application responsibility): https://socket.io/docs/v4/delivery-guarantees/
2. Socket.IO official docs — Handling disconnections and state resync: https://socket.io/docs/v4/tutorial/handling-disconnections
3. Socket.IO official docs — Connection recovery options: https://socket.io/docs/v4/server-options
4. Socket.IO official docs — Redis adapter and connection state recovery limitation: https://socket.io/docs/v4/redis-adapter/
5. Ofcom — Illegal content duties under the Online Safety Act: https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/illegal-content-duties-under-the-online-safety-act
6. Ofcom — Protection of children duties under the Online Safety Act: https://www.ofcom.org.uk/online-safety/protecting-children/protection-of-children-duties-under-the-online-safety-act
7. Ofcom — Age assurance duties: https://www.ofcom.org.uk/online-safety/protecting-children/age-assurance
8. ICO — Children's Code applicability (including online games and services likely to be accessed by children): https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/services-covered-by-this-code/
9. UK Government — Registration and checking of trade marks: https://www.gov.uk/how-to-register-a-trade-mark
10. Stripe developer documentation (current integration guidance should be reconfirmed on implementation): https://docs.stripe.com/checkout/fulfillment

**Originality statement:** Benchmark titles informed market positioning and broad genre analysis. No third-party card text, game artwork or source code is intentionally included in this specification. Example content herein is provisional original draft content requiring normal legal/editorial clearance.

---

# Appendix A. Scoring Examples and Edge Cases

**Example A — three players, three valid votes:** A receives Gold 0 / Silver 2 -> weight 2; B receives Gold 1 / Silver 1 -> weight 3; C receives Gold 2 / Silver 0 -> weight 4. One feasible ballot pattern: A votes C Gold/B Silver; B votes C Gold/A Silver; C votes B Gold/A Silver. Ranking C=100, B=60, A=25. Every voter ranked exactly the two candidates other than their own.

**Example B — tied first:** A and B 6 weight; C 2; D 0. A/B occupy ranks 1 and 2, earn 80 each; C occupies rank 3 and earns 25; D earns 25.

**Example C — two valid candidates:** no voting phase; round skipped with zero points, even if 12 players started the room. Review this in playtests to avoid abuse incentive. Players with no valid submission gain no points, and repeated deliberate disruption triggers host moderation options.

**Example D — one voter does not vote:** use only valid ballots; no synthetic replacement. Rank math operates as usual; nonvoter's valid submission can still receive points.

**Example E — finale three-way tie:** base each (100+60+25)/3 = 61.666...; × 1.5 = 92.5; half-up -> 93 each.

**Example F — full-match tie after tie-break stats:** display two equal champions and no artificial timestamp win.

# Appendix B. Standard Demo Scope

- **Free demo:** 5 rounds (one per challenge) or one shorter tutorial match if demo completion is too long; 3–8 guests initially for controlled cost; Clean only; fixed small content pool; no permanent custom room history; free guests always accepted; prominent “Unlock full game” only at lobby and final results, never interrupt submission or voting.
- **full licence:** 3–12 guests/players, rating selection, Standard/Extended durations and all core content, personal host account and owned packs.
- **Purchased pack:** adds content to selection library; no change to odds, voting power, score multipliers, number of turns or eligibility.

# Appendix C. Implementation Glossary

- **Seat:** durable identity of one contestant inside a room, independent of current browser socket.
- **Host:** permission to manage a room, not automatically the payer or a player.
- **Round/Challenge:** one contest resulting in zero or more score awards; The Last Laugh is the finale challenge.
- **Authoritative state:** trusted server-held canonical phase, timer, assignments, permissions and scores.
- **Snapshot:** filtered full state needed to render the current phase for one authenticated role/seat.
- **Idempotency:** repeated delivery of the same command yields the same logical result once.
- **Entitlement:** verified server-held permission to use the purchased core game or content pack.
- **Chaos Contract:** compatible creative constraint that changes answer style but not point weight.
- **Content rating:** editorial cap controlling authored material; not a legal proof of user's age.
