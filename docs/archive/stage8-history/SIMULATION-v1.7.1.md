# ECKY THUMP v1.7.1 — Synthetic Game Card Balance Smoke Test

## Results

| Measurement | Synthetic total |
|---|---:|
| Complete matches | 1,080 |
| Completed rounds | 4,320 |
| Successful card activations | 4,274 |
| Card replacement rerolls | 2,460 |
| Rejected simulated activations | 0 |
| Equalisers applied to rounds | 995 |
| Negative finishing scores | 0 |

### Scope

- 3, 6 and 12 contestants.
- Quick (2), Normal (4) and Full Games Night (6) round lengths.
- Both Lively and Relaxed pacing; 30 simulations per combination with Game Cards enabled and disabled.
- User actions and joke quality are generated synthetically, not by actual players.
- This was a mechanical smoke test, not a statistically powered balance experiment and not a test of player enjoyment.
- RNG and the synthetic voting model do not attempt to reproduce real game-night behaviour, so halfway-leader win rates and final-score spreads should not be presented as measured human balance.

## Re-run

```bash
node scripts/simulate-game-cards.js 30 > game-cards-simulation.json
```

The simulation is intentionally non-deterministic. It exercises the real server game engine through create, draw, Game Card activation, hand reroll, answer, vote, results and championship completion. The source code remains available for auditing and further instrumenting.

## Next human playtest

- Play one six-round match with Game Cards on, and one with them off; keep group composition and pace similar.
- Note when a player first notices the compact Power-Ups tray, and whether it is quick enough to access 5-second activation cards.
- Ask each group whether Mirror Mayhem and Early Bell are funny or frustrating.
- Compare average round duration, submission timeouts, and actual smiles/laughs; telemetry alone cannot determine enjoyment.
