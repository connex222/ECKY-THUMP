# v1.2 Seaside Postcard — Engineering and Design Notes

## Preserved absolutely

- Avatar files (character image/celebration assets and bindings): **42 files** match their SHA-256 digests from the user's uploaded `ECKEY-THUMP-v1.zip` exactly; see `test/avatar-baseline-v11.json` and corresponding automatic test.
- `public/assets/avatars.js`, `public/assets/avatars.json`, `server/avatars.js`, every `public/assets/avatars/*.webp` and `public/assets/celebrations/*.webp` have no edits.
- Existing avatar helper rendering functions in the player and TV clients retained.
- Existing Node HTTP + SSE stack, source directory structure, content packs, answers, scores, and game modes preserved.

## Implementation summary

- CSS isolated to `public/assets/seaside-postcard.css`, loaded after the existing styles; original British cheeky postcard feel without copying any copyrighted illustrations.
- TV and host lobby controls switch the content rating while in lobby. After Dark requires individual consent by *every* attendee, including audience; no participant may invoke host controls.
- 12 active players, additional authenticated audience capacity 30; no avatar is allocated to an audience member. Audience joins after start are welcomed. Supports `chaos` and `chaos-vote` actions with server-side phase guards, enumerated actions and targets, a per-person 8-second heckle cooldown and a bounded, short-lived event queue. Visual stage shake, vote leader and targeted phone haptics have no scoring/timing effects.
- On the client: session token reuse and answer-draft recovery from localStorage, SSE reconnect with short initial delay and backoff, haptic feedback only where supported. Server-authoritative state on reload and automatic match continuation.
- Lively-mode results window: 4500 milliseconds; relaxed/host-paced result screens unchanged.

## Limitations

- TV rating control uses the host-minted private display token, so keep TV links private.
- 18+ self-certification is not independent age verification.
- No elimination mechanics exist in the engine; hence no elimination-to-audience transition is implemented.
- No gameplay networking rewrite to Express/WebSockets: this codebase has neither framework, and adding one solely for new features would risk reliability and break the dependency-free design.
- State and security testing is automated; manual responsive visual review was attempted but automated Chromium timed out in the environment.
