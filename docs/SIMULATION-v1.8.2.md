# Synthetic scoring and pacing run — v1.8.2

Simulation-only, using generated answers, random choices, and a non-human scoring preference model. This run is **not deterministic across executions** and says nothing directly about enjoyment, actual disconnect rates or phone usability.

| Measure | Result |
|---|---:|
| matches | 432 |
| rounds | 1,728 |
| activations | 1,715 |
| rerolls | 990 |
| failedActivations | 0 |
| equalisers | 403 |
| negativeScores | 0 |
| completed | 432 |

| Metric | Without Game Cards | With Game Cards |
|---|---:|---:|
| Mean leader-to-last-place spread | 262.3 | 287.9 |
| Halfway leader finishing first | 72.7% | 73.6% |

Interpretation: no errors or negative scores occurred in this sample, but the score spread with cards was **not smaller**. Do not enable the Game Cards deck by default or claim a successful comeback balance without representative human playtests.

Run `node scripts/simulate-game-cards.js 12` for another sample. Keep `Game Cards` as an opt-in lobby setting.
