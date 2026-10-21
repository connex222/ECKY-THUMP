# ECKY THUMP v1.8 Verification

- Previous baseline: v1.7.1 playable ZIP, preserved as a separate build.
- v1.8 built on the previous Node HTTP + SSE + game engine architecture; no third-party runtime dependencies introduced.
- **123/123 Node automated tests passed** (111 baseline + 12 additional regression tests).
- **42/42 avatar-related files unchanged**, byte-for-byte SHA-256. This includes avatar registry metadata and image bindings. Avatar-rendering code in `public/assets/app.js` and `public/assets/tv.js` was not changed.
- 1,080 synthetic matches completed; see `docs/SIMULATION-v1.8.md` for honest balance results and caveats.
- `node --check` passed for the server and client JavaScript files.
- HTTP tests passed for the new v1.8 stylesheet and both play surfaces.
- Browser screenshot attempt blocked by the sandbox. Real device UI, LAN/Wi-Fi multiplayer and PowerShell launcher checks remain outstanding.
- The new Game Cards remain optional and disabled by default.
- GitHub and Render were **not** changed.
