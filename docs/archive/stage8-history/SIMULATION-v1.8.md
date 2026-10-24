# ECKY THUMP v1.8 — Synthetic Balance and Pacing Check

## Scope

- **1,080 complete simulated matches**, **4,320 rounds**.
- 3, 6 and 12 players; Quick, Standard and Party playlists; Relaxed and Lively modes; Game Cards on and off.
- **4,230 valid power activations**, **2,347 rerolls**, **980 automatic Equaliser applications**.
- **0** rejected simulated activations; **0** negative final scores.
- All runs use synthetic submissions and nonhuman voting. **These figures do not measure enjoyment, frustration, actual disconnects or human fairness**.

## Descriptive outcome (not causal evidence)

| Summary metric | No Game Cards | With Game Cards |
|---|---:|---:|
| Completed synthetic matches | 540 | 540 |
| Mean winner-to-last-place score spread | 269 | 289 |
| Midgame leader finishing first | 75.2% | 78.5% |

Because only 30 simulated matches were performed per size, length and pace cell, and the groups used randomly generated votes, **these differences are noisy and not sufficient to retune catch-up strengths**. In this sample, powers did *not* narrow the winning margin. This is a reason to retain host opt-in and run real-group comparisons before expanding scores or durations.

## Replay

```bash
node scripts/simulate-game-cards.js 30 > docs/SIMULATION-v1.8-data.json
npm test
```

The simulation currently relies on random choices (not a seeded player model), so reruns will vary. It principally demonstrates successful mechanical transitions and score invariants.

## Real game-night A/B plan

1. Run a six-round Relaxed game with Game Cards disabled, using 4–6 friends. Record average round length and direct player reactions.
2. Run a second six-round game with the same group and Game Cards enabled; use the same rating and pace.
3. Record: card offers versus plays, how often a power-up was visibly discovered, whether anyone felt an unfair early bell, whether the underdog got closer, unfinished submissions, and the number of room reconnections.
4. Collect one fun/frustrating vote per card effect (existing in-game mechanism). Flag cards with consistently high frustration responses, especially when paired with timeouts.
5. Review enough real play to identify recurring failures before changing scoring or enabling the system by default.

## Limitations

Browser-state screenshots were attempted but the sandboxed Chromium environment blocked local HTTP with `ERR_BLOCKED_BY_ADMINISTRATOR`. Functional HTTP asset tests passed; **no independent v1.8 visual browser pass is claimed**. A Windows real-device launcher test and multi-phone playtest are outstanding.
