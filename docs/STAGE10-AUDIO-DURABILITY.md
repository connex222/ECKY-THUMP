# ECKY THUMP — Stage 10 audio & server resilience

24 October 2026. **Opt-in preview; November genuine-device acceptance is still outstanding.**

## What is delivered

1. Safe Social Club private-room disk recovery, saves and expiry cleanup. An unavailable/full disk no longer turns a successful room action into a client-visible error or crashes the timer. `/api/health` now includes a truthfully labelled `roomRecovery` object: `mode` (ephemeral or configured private directory), `state` (`not-durable`, `best-effort`, or `degraded`), and `guaranteed:false`. Do **not** interpret a successful write or a configured environment path as proof of cloud-disk durability.
2. Deterministic, repeatable local recording pipeline for the **60 existing Our Maureen captions**. No sound files were generated, fabricated, cloned or purchased in Stage 10. The TV voice toggle shows **RECORDINGS NEEDED** and is disabled when no approved recordings are present. Captions and the existing original SFX/music work separately.
3. The importer verifies exact script IDs, checks audio duration, sound container, codec, size and mono output, normalises loudness with FFmpeg, and updates *both* voice manifests. Mixed batch imports are supported; no external network or audio library is used.
4. Regression tests for disk failures, first-room creation without persistence, importer source rejection, dry runs, Ogg conversion and stale-cache avoidance.

## Record the 60 lines

- See `VOICE-LINES.md` for exact filenames, UK English script and performer guidance. Any performer must have authorised recording, redistribution and possible commercial use.
- Use your own approved voice or a properly licensed voice actor; do not clone anybody's voice without consent. A stock synthetic voice may be considered later only after its licensing, cost and accent have been approved.
- Record **each** line separately. Mono WAV at 44.1 or 48 kHz is preferred; WAV, MP3, M4A, FLAC and Ogg are accepted as inputs. Use the filename `maureen-lobby-01.wav`, etc. Keep each clip between **0.15 and 20 seconds** with clear delivery, low room noise, and no backing music.
- `ffmpeg -version` and `ffprobe -version` must both work in your terminal (local installation required). No further npm package is needed.

From the project root on a computer with FFmpeg installed:

```bash
# 1. Validate the current game audio (0/60 until approved recordings are provided)
npm run audio:check

# 2. Scan a recording folder without modifying the game
node scripts/import-maureen-audio.js --dry-run "/path/to/My Maureen Recordings"

# 3. Convert the available files and mark only those verified as recorded
npm run audio:import -- "/path/to/My Maureen Recordings"

# 4. Verify all marked clips and manifests, then test the TV manually
npm run audio:check
npm test
```

The importer uses mono 48 kHz Opus in Ogg at 64 kbit/s, high-pass/low-pass cleanup and EBU-style loudness normalisation near **−18 LUFS** with a **−2 dBTP** ceiling. It preserves the original input files, verifies each output and fails on duplicate/unrecognised names. Only verified lines become `recorded:true`. Put the actual recordings in GitHub only after verifying permission and the public-repository implications. Tests permit properly installed recordings to be marked true.

If the input folder contains only a partial batch, the other line flags remain unchanged. The compiled Ogg clips must remain at `public/assets/audio/maureen/<id>.ogg`. Clip errors never block gameplay; captions are always the fallback.

## Room durability and hosting

- The current Render service is on the existing hosting configuration; **no plan, environment variable or paid disk was changed**.
- `server/durability.js` catches synchronous write, delete and restore exceptions. Server logs contain only a generic error code, not secret room data. The health endpoint exposes a non-sensitive recovery state, not an address or player answers.
- The optional `render.persistent.example.yaml` documents how to set up a **separate paid service** with a private disk at `/data`. The disk isn't present just because the file exists.
- Never put private room JSON in a public repository. Use a private encrypted backup/retention strategy and actual physical restart tests before promising recovery.
- The Classic mode remains in-memory only. Private Social Club rooms have a six-hour maximum lifetime; recovered rooms are subject to expiry and authentication constraints.

## Gates remaining

- Our Maureen's **60 actual performances are still missing**. Caption readability and existing generated sound effects work now.
- No November multi-home, Android/iOS, TV overscan, 3–12-player human playthrough, or recovery-after-real-Render-disk tests have been signed off.
- Uploaded third-party comedy text commercial redistribution/licensing has not been independently verified.
- The controlled Social Club mode remains an opt-in preview, not a universally available production release.
