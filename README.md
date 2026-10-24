# ECKY THUMP v2.0.0 — Social Club

**Good friends. Terrible answers.** A private games-night party game for 3–12 invited friends, played on phones with an optional TV show stage. Written in UK English.

## Start in three steps

1. Install Node.js 20.11 or later and download the source ZIP. Unzip it.
2. Open a terminal in the `ECKY-THUMP` folder and run `npm start` (no runtime packages or build tools required).
3. Visit `http://localhost:3000/` on the computer; share its reachable network address with phones on the same Wi-Fi. Choose Host, invite friends by QR/link, and press Start once at least three join.

**Two game experiences:** The original Classic mode remains available and is the default; optional **Social Club** has theatrical TV reveals, A/B voting, Our Maureen captions and six opt-in Game Cards. On the Render service, Social Club preview availability is controlled by `SOCIAL_CLUB_PREVIEW=1`. Do not offer it as fully tested until November's genuine multi-device acceptance.

**Private game:** no public matchmaking. A room lasts up to six hours. Social Club room recovery only survives a restart if `ROOM_DATA_DIR` is on a private, genuinely persistent disk; the free Render instance does not provide this guarantee. Original Classic rooms are not persisted across server restarts.

## Everyday commands

```bash
npm start                    # run the game
npm test                     # all automated Node tests
npm run audit:content        # check the legacy content catalogue
npm run audit:approved-content # check the approved Social Club cards
npm run simulate:smoke       # deterministic simulation, not real-human QA
```

## Game night, from start to finish

- The host creates a private room and chooses FAMILY / CHEEKY / AFTER DARK (18+), match length and pace.
- Friends join on their phones; each round reveals its instructions on screen.
- In Social Club, submit private answers, watch the anonymous TV reveal, then vote. Authors are revealed after votes lock. No self-voting. The server decides the score.
- A Quick show includes Meat Raffle, The Turn and Last Orders. A Standard show includes all five challenges; Long adds another Turn.
- Optional House Cards are implemented in Social Club but still require November device testing. The 60 Maureen captions are ready; her spoken recordings must be supplied separately and are **not installed** in this release. Voice controls remain disabled until verified recordings are imported.
- The host can moderate and pause; everyone can reconnect with their original room/seat token if the room survives.

## Optional voice recordings and room durability

- `npm run audio:check` reports which Our Maureen recordings are verified and flags broken recordings. A clean report with **0 recorded / 60 remaining** means the audio pipeline is ready, **not** that her voice exists yet.
- Recordings you have permission to use can be prepared with `npm run audio:import -- /path/to/recordings`. It converts valid short `.wav`, `.mp3`, `.flac`, `.m4a` or `.ogg` files to mono Ogg Opus using locally installed FFmpeg, then updates both identical voice manifests. `node scripts/import-maureen-audio.js --dry-run /path/to/recordings` validates without changing files. See `docs/STAGE10-AUDIO-DURABILITY.md` and `VOICE-LINES.md` for exact filenames.
- A storage error no longer stops a game or crashes the server; `/api/health` reports recovery state. **This is not a substitute for a private persistent disk**, which must be separately enabled and tested before offering restart guarantees.

## Documentation and safety

- `DESIGN.md` — canonical phases, scoring, content policy and developer design decisions.
- `CHANGELOG.md` — history; `VOICE-LINES.md` — 60 compère scripts and recording paths.
- `docs/NOVEMBER-ACCEPTANCE.md` — **uncompleted** real phone/TV tests and approval gates.
- `docs/CONTENT-REQUEST.md` / `docs/templates/` — submission formats for future cards.
- `docs/archive/` — older design guides and test reports. Kept for traceability.
- `render.persistent.example.yaml` — optional paid Render persistent-disk blueprint; **not applied** to your running service. Do not enable a paid plan without the owner's authorisation. When setting up a new persistent service, attach a private disk at `/data`, set `ROOM_DATA_DIR=/data/rooms`, and confirm backups, privacy and deletion policy. Plain room JSON contains private player answers (but only hashed session tokens).
- **Before commercial use**, verify permissions/licensing for third-party CSV submissions, the game name, and UK age/safety requirements. Passing automated tests does not establish approval.

---

## Archived development notes (for reference only)

Earlier README and older development notes are archived under `docs/archive/stage8-history/`.


### Stage 9 — optional House Cards

The host can enable **House Cards** in a Social Club lobby (off by default). Each current contestant may submit up to five original response cards (3–45 visible characters, same rating/text filters as normal writing). The host can review and remove cards before the show; players can remove their own. The room-only cards are mixed into The Meat Raffle and The Hard Sell hands and cleared when the room expires. They are **not** added to the approved global content catalogue. Host kicking removes that contestant's House Cards. Optional room recovery before the match starts is now supported when private disk persistence is enabled. Do not use House Cards for identifying information, harassment or copied material; automatic filters do not replace host judgement.
