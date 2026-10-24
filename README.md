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
- Optional House Cards and recorded voice are **not** complete/verified for general release. The 60 Maureen captions are ready; recordings must be supplied separately.
- The host can moderate and pause; everyone can reconnect with their original room/seat token if the room survives.

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
