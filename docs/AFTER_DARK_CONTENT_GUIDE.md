# ECKEY THUMP v0.9 — After Dark Content Guide

## What this pack is
An **editorial draft** of exactly **1,200 newly authored entries** on top of the prior v0.8 content. It was written specifically for ECKEY THUMP; no game cards or text were imported from other companies. Several batches were produced using our own authored phrase families, which helps reach the quantity target but also makes human selection important.

It is not a guarantee of 1,200 equally strong jokes. Playtests, editorial trimming, and a final appropriateness/legal review are recommended before selling the game.

### Added entries

| Type | Clean | Cheeky | Adult | Total new |
|---|---:|---:|---:|---:|
| Shared response cards | 140 | 300 | 280 | 720 |
| Card Clash question cards | 20 | 65 | 65 | 150 |
| Quick Wit questions | 10 | 50 | 50 | 110 |
| Context Collapse scenarios | 10 | 28 | 27 | 65 |
| Double Trouble scenarios | 8 | 24 | 23 | 55 |
| The Last Laugh scenarios | 7 | 20 | 18 | 45 |
| Finale compulsory words / phrases | 5 | 10 | 10 | 25 |
| Chaos Contracts | 5 | 13 | 12 | 30 |
| **Total** | **205** | **510** | **485** | **1,200** |

The pre-existing original content remains unchanged. A Cheeky room also receives Clean content; an Adult room receives all three tiers.

### Full usable pools in v0.9

| Content | Clean | Cheeky | Adult |
|---|---:|---:|---:|
| Response cards | 246 | 558 | 848 |
| Card Clash prompts | 40 | 111 | 181 |
| Quick Wit prompts | 30 | 85 | 140 |
| Context Collapse | 16 | 52 | 75 |
| Double Trouble | 12 | 38 | 63 |
| Finales | 12 | 34 | 54 |
| Compulsory finale words | 13 | 23 | 33 |
| Chaos Contracts | 6 | 19 | 31 |

Other existing content: 12 safe Context Collapse fallback statements.

## Finding and changing content

- Use `CONTENT-REVIEW.html` from the extracted ZIP. It works without running the game.
- Search for wording, filter by challenge/rating and use **Keep** or **Rewrite**.
- Press **Export decisions** to save your editorial decisions to a file; it does **not** change the playable game's card library automatically.
- Original new entries, identifiers, ratings and tags are in `server/packs/after-dark-v09.json`.
- To regenerate the *unedited original* JSON from the authored source, run `python scripts/build_expansion.py`. Do **not** do this after manual JSON edits unless you intend to overwrite them.

## Quality standard for commercial release

1. Read every Adult and Cheeky entry aloud; remove weak, formulaic or repetitive jokes.
2. Test at least five groups of friends with varying comedy preferences and ages (adults only for Adult mode).
3. Count actual laughs, voluntary read-aloud reactions and repeated-appearance complaints.
4. Flag entries that do not fit many question/answer combinations, or which require too much reading.
5. Confirm language ratings, safeguarding, moderation and legal obligations in the market of release. Private games can still display offensive user text.
6. Ensure individual cards do not closely resemble protected expressive text from published card decks.

## Rotation and play rules

- A room uses a **shuffle-and-discard response deck** across multiple matches played by the same group. It refills only after exhausting the eligible pool. If players exhaust the deck, earlier cards can eventually return.
- Cards are unique across all players during a single round (including after a one-card swap).
- Each player can **swap one selected card per Card Clash or Double Trouble round**, before submitting.
- Prompts, finale words and Chaos Contracts are not repeated in the same room until their pool is exhausted.
- Rotation history lasts for the room's lifetime, **not** across server restarts or across independently created rooms.
- The game still uses the original Gold/Silver voting and two-times finale scoring. Balance these with real players before further changes.
- Chaos Contracts are creative instructions to players; only the finale's required word is automatically checked by the game.

## Content safety

The Adult rating means **adult-oriented humour**; it is not an instruction to target protected groups, create threats, encourage harassment, or include minors in sexual situations. The existing text validator and host report/hide controls are modest safeguards, **not** complete safety moderation. Do not make the game publicly accessible to strangers as an adult service without further safeguarding, age assurance and legal review.
