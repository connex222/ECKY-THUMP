# v0.9 update

See **START-HERE-v0.9.md** first. 1,200 original entries have been added as editorial drafts. Open **CONTENT-REVIEW.html** separately to inspect or flag jokes.

# ECKY THUMP — GAMES NIGHT v0.9

This is the **gameplay expansion** of the previous Chaos Arena build, with all the existing artwork, characters, TV display and per-room QR codes retained.

## Run it on Windows

1. Extract the ZIP.
2. Open the `ECKEY-THUMP-Game-Night-v0.9` folder.
3. Double-click `START-GAME-WINDOWS.bat`. Node.js 20.11+ is required.
4. Open `http://localhost:3000` on the host computer.
5. Create a room and choose a character.
6. Have at least two friends join by QR code or six-character room code.
7. Press **START THE SHOW**.

The **Games Night / 6 rounds** option plays all five challenge types. The **Normal / 4 rounds** option includes Card Clash, Quick Wit, Context Collapse and The Last Laugh. The **Taster / 2 rounds** option plays Card Clash and Quick Wit.

## Rules

- **Card Clash:** choose one card from your private hand.
- **Quick Wit:** type a funny response to a prompt.
- **Context Collapse:** first write an innocent sentence. You then receive **another player's** sentence and invent a ridiculous fictional headline/context to put it in. No one gets their own sentence.
- **Double Trouble:** choose a bizarre response card **and** write a punchline advertising it. Both appear together for voting.
- **The Last Laugh:** write a final answer containing the compulsory word shown on your phone. **Points are doubled.**
- **Votes:** every entrant selects a Gold (two vote-weight) and Silver (one vote-weight) from **different other players**; no self-voting. The game gives 100, 60, 25 (and 25 thereafter) ranking points with equal-weight ties sharing points. The Last Laugh doubles these ranking awards.
- **Timing:** relaxed play gives longer clocks and lets the host advance after every reveal. Fast play uses shorter timers and automatic progression after results.
- **Safety:** Clean / Cheeky / Adult modes set the content level. The host can hide reported submissions. Adult mode is intended only for adult groups; prototype filtering is limited.

## Playing across homes

A home network address such as `192.168.x.x` will not work for friends in another house. To play from 2–3 houses, deploy the game to an HTTPS host (e.g. Render) and share that public link. Multiple read-only TV displays can join a room.

## Project status

All automated tests pass for this prototype, including all five challenge types. A real-device game-night playtest is still needed. This is **not production-ready commercial software**: purchasing, persistence, age checks and expanded moderation are out of scope. Rooms are lost when the server restarts.
