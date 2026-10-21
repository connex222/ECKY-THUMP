# v1.7 Verification — 21 October 2026

- **Automated tests:** 102 / 102 passed with Node's built-in test runner (`npm test`). Existing v1.6 tests remain in place; added separate Game Card and HTTP-permission coverage.
- **Simulation smoke tests:** 240 simulated six-round games, with 3, 6 and 12-player sizes (80 of each). All 1,440 rounds completed with 1,843 successful Game Card activations, and zero negative final scores. This is not a statistically valid fairness or comedy-quality playtest.
- **Security tests:** only hosts can toggle Game Cards or read anonymous telemetry; spectators and TV tokens cannot activate effects; private inventory and extra draws stay player-specific; forged card IDs are rejected.
- **Card checks:** all 15 distinct catalogued cards have server-side effect logic. Tactical scoring never modifies vote weights or doubles Game Card bonuses in the finale. Equalisers are restricted by deficit and usage counts.
- **Avatar preservation:** all 42 avatar-related files listed in `test/avatar-baseline-v11.json` pass SHA-256 integrity checks. The v1.7 build does not modify original avatar image files, IDs, mappings or rendering helpers.
- **Documentation:** central README and CHANGELOG; old start/release guides in `docs/archive/`.
- **UI checks:** JavaScript syntax passes and markup/style regression tests run. Browser-driven navigation to the localhost web server was blocked in this environment, so full visual and physical-device testing remain outstanding.
- **Launcher checks:** Windows PowerShell launcher added and reviewed; not executed on a physical Windows computer.

## Manual playtest priorities

1. Host a full 6-round match and toggle Game Cards in the lobby before starting.
2. Use Game Cards in 3-, 6- and 12-player games. Confirm the rules feel comprehensible and don't extend writing or voting time excessively.
3. Verify an Extra Helping player can choose one of two private draws without submitting an old selection.
4. Verify the TV announces Chaos effects without showing any player's private hand, wager or extra choices.
5. Compare baseline (Game Cards off) vs Game Cards on with the same group and measure laughter, pressure, disruptions and dropout incidents.
6. Confirm LAN joining/QR and local Windows launcher on Windows with real mobile controllers.

Game Cards remain **off by default** until playtesting establishes that they improve games-night fun.
