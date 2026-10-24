# ECKY THUMP — Our Maureen, approved voice

**Approval:** 24 October 2026 — voice audition **1** selected by the game owner.

**Voice provider:** Creative Claw / Fish Audio Drama 3; **original synthetic Northern English character voice**, not a voice clone or imitation of a real individual.

**Reusable Creative Claw Character:** `5d672f52-20b5-41c8-96c8-c83169415d7c`

**Saved voice option:** `fc1538b6-a995-4a72-b5be-137a1122c3f4`

**Source design audition ID:** `9742ddd4-24cc-476c-b77b-a2558a5ca376`

**Audition URL:** https://cdn.creativeclaw.co/u/f3e7a3b1/audio/f1813490-3bbe-4e18-9f79-2eb3f8d3e0ae.wav

## Generated production lines

| Game manifest ID | Spoken words (exact) | Audio source | State |
|---|---|---|---|
| `maureen-lobby-01` | Come in, coats off, and find your daftest mate. | https://cdn.creativeclaw.co/u/f3e7a3b1/audio/4c80fa13-a9e1-419d-98a5-c1cbde0b690c.mp3 | Generated; **not imported into game** |
| `maureen-unanimous-win-01` | ECKY THUMP! That's a proper walloping! | https://cdn.creativeclaw.co/u/f3e7a3b1/audio/28da5615-4550-4609-ae17-4c9778485a8f.mp3 | Generated; **not imported into game** |

## To integrate

1. Download the two MP3s above to a local folder, with filenames **exactly** `maureen-lobby-01.mp3` and `maureen-unanimous-win-01.mp3`.
2. From the repository root, install FFmpeg and run `node scripts/import-maureen-audio.js --dry-run /path/to/folder` to validate duration and naming.
3. Then run `npm run audio:import -- /path/to/folder` followed by `npm run audio:check`. The importer normalises both clips into Ogg Opus and updates **both** matching voice manifests only if the converted clips pass verification.
4. Commit the two `public/assets/audio/maureen/*.ogg` files and both updated manifests together. Test locally and deploy to GitHub/Render. Keep voice playback opt-in on TV, and captions mandatory.

**Current deployment:** Do not mark any clip as `recorded:true` until its converted Ogg file is actually checked into the repo. No MP3/WAV audio has been deployed. **2 of 60 lines have generated source audio; 58 still require generation.** The Creative Claw voice-design and two single-line renders used the available credits; check or replenish balance before generating the remaining lines.

Source of truth for captions/identifiers: `server/packs/voice-lines.json` and `public/assets/voice-lines.json`.