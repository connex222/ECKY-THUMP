# ECKEY THUMP v0.8 — Gameplay Rules and Implementation Notes

## Objective

Make your friends laugh and collect more points than your rivals across the championship. Every round uses anonymous Gold/Silver voting. One person hosts, everyone competes.

## Modes and pacing

- **Taster:** 2 rounds, Card Clash and Quick Wit
- **Normal:** 4 rounds, adds Context Collapse and a double-points finale
- **Games Night:** 6 rounds, all five challenge types, with Card Clash repeated
- **Relaxed:** 90s Card Clash, 120s Quick Wit, 80s innocent line plus 125s rewrite, 140s Double Trouble / Final, 75s voting. Host manually advances results.
- **Lively:** 45s Card Clash, 70s Quick Wit, 45s line plus 75s rewrite, 85s Double Trouble / Final, 45s voting. Result reveal advances automatically after 25s.

## Challenge details

### Card Clash
Choose one card from a private 7-card hand. The prompt and all anonymous entries are revealed after submissions close.

### Quick Wit
Write one original answer (3–160 grapheme clusters) matching a comedic prompt. The responses are shown anonymously.

### Context Collapse
**Phase 1 — Innocent line:** Each contestant writes an ordinary, harmless sentence. Server stores it privately.

**Phase 2 — Rewrite:** The server shuffles the player order and assigns each contestant the next player's line (a derangement; no self-assignment). Contestants write a humorous, misleading but fictional headline/context to pair with that line. The original line and rewritten context appear together. The **rewriter** receives all scoring points; the original author is credited only after voting.

If a contestant does not supply an innocent line before the phase timer expires, the server substitutes an original stock sentence.

### Double Trouble
Choose one of five server-issued cards, then write an original sales pitch or caption. The server validates both; players cannot submit cards they do not own.

### The Last Laugh
Everyone writes one final answer, but it must contain a randomly selected compulsory word or phrase. The game enforces this rule server-side. All awarded ranking points are doubled, so a close contest can change at the end.

## Scoring

- Everyone votes for two different other players; self-voting is rejected.
- Gold counts 2 vote-weight; Silver counts 1.
- Award points by rank: 100 for first, 60 for second, 25 for third and below. Tied entries share their occupied rank points.
- Final awards are multiplied by 2.
- The scoreboard sorts by total points, then number of unshared firsts, Gold votes, Silver votes, then join order. Exact ties can produce joint champions.
- Host may skip a round with no points; unsafe entries can be hidden and ballots reset.

## Data security and resilience

- Private card hands, the originally submitted innocent lines, and the rewrite assignments are never sent to the TV or other players during submission.
- Candidate author names remain hidden until results, and self-voting is forbidden on the server.
- The host can pause a live round up to three times per match.
- Rooms and scores are currently in-memory only and disappear after a server restart.

## Planned playtesting observations

Measure laughter and satisfaction per round, timer expiries, confusing instructions, whether the forced final word is entertaining, and whether 3-player Gold/Silver voting feels forced. The scoring formula and timers should be tuned based on actual games, not guesses.
