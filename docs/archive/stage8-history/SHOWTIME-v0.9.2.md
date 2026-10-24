# ECKY THUMP v0.9.2 — Showtime Lobby

## What is new

- Removed the duplicated small header banner and scrolling marquee from both player and TV screens.
- Added a giant custom SVG ECKY THUMP logo, inspired by premium game-show title treatments with exaggerated modern comedy styling. Entirely original artwork and lettering treatment.
- Redesigned the landing and waiting-room screens; player portraits appear as a stage cast and the room-specific QR code is prominent.
- Added the original 16.84-second looping synth-funk lobby track in `public/assets/audio/lobby-theme.ogg`. The track was generated specifically for this game, and is not sourced from another game or copyrighted song.
- Included visible Music On/Off buttons on landing, lobby and TV lobby. Music is off until a person clicks Play Lobby Music because browsers block unprompted audio.
- Music stops on the first active game round, pauses when the browser is hidden, and returns on subsequent room lobbies when the music control remains enabled.
- Existing settings, five games, 1,200-entry expansion, 32 avatars, QR joining, content ratings and host controls are preserved.

## Practical guidance

For a games night with everyone in the same room, turn the lobby music on **only on the TV** to avoid overlapping audio from several phones. Each device has its own independent music control.

On a TV with no mouse, use a remote, keyboard or connected mouse to activate the music control once. Alternatively, the host may enable music on the host device.

The logo is `public/assets/ecky-logo.svg`; the soundtrack is `public/assets/audio/lobby-theme.ogg`. Both can be replaced later without changing game logic.

## Constraints

The TV / phone visual layout should be verified on the actual screens used for the party; automated backend tests do not establish universal browser compatibility.
