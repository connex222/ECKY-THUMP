# Game Cards — optional v1.8 playtest rules

The fifteen cards are described in `server/packs/game-cards-v1.json`, with names, visuals, eligibility, risks and exact mechanical effects.

## Game Card economy

- The host may toggle Game Cards **only in the lobby**. The feature defaults off.
- Each contestant gets one valid playable card at the start of the first round. Eligible rounds refill hands to a maximum of two cards.
- The **POWER-UPS** tray appears on every non-finale answer screen. Tap it to expand playable cards; it is collapsed initially to keep the main answer form readable.
- Each player can **replace one held Game Card per round** with a new compatible card, without spending a card activation. The replacement cannot be the same card. This avoids incompatible cards becoming stuck in the two-card hand.
- A player can play at most **one per round** and **two per match**. Cards must be in that player's private inventory.
- Only one global Chaos action can be activated in a round. Wrong Envelope and Early Bell are limited to once per match.
- All scoring effects resolve after standard Gold/Silver voting. Additional positive points are capped at +40 per player per match. Penalties cannot reduce a total score below zero. The Last Laugh is exempt from scoring Game Cards.
- A player who is behind by at least max(100, 25% of the leader's score) after two completed rounds can get **one automatic Equaliser** per match. Up to two trailing players are offered an Equaliser at each inter-round checkpoint.

## The 15 effects

| Tier | Card | Effect |
|---|---|---|
| Chaos | Deckchair Shuffle | Swap one private response option between two unsubmitted players |
| Chaos | Mirror Mayhem | Temporarily reverse card presentation order, not button semantics |
| Chaos | The Wrong Envelope | Replace a Wit prompt before answers start |
| Chaos | The Hot Seat | Swap contestants' cosmetic stage positions |
| Chaos | The Early Bell | Remove exactly 10 seconds while maintaining minimum safety margin |
| Tactical | Double or Duff | Unique first = +30, otherwise −15 |
| Tactical | Gold Rush | +10 per Gold vote up to +30, otherwise −10 |
| Tactical | Fast Fingers | Early valid submission plus a Gold vote = +20 |
| Tactical | Extra Helping | Choose one of two fresh response options to replace a held card |
| Tactical | Bullseye Bet | Predict exactly 1 or 2 Gold votes: +30/−10 |
| Equaliser | The Lifebuoy | +25 for a manual bottom-half finish |
| Equaliser | Lucky Dip Lifeline | Three additional response choices in the next card round |
| Equaliser | Underdog's Crown | Unique first place grants +40 |
| Equaliser | Rubber-Band Rally | Additional 50% base award, capped +40 |
| Equaliser | Comeback Contract | Include a secret word and get Gold for +30 |

## Testing and consent

Disruption cards are intended as friendly optional party mechanics, not guaranteed improvements in laughter. Early Bell always shortens everybody's deadline, including its activator. Mirror Mayhem does not reverse text editing or voting. Reduced-motion preferences remain respected by existing site settings. Disable Game Cards for players who prefer a straightforward comedy contest.

Before making Game Cards the default, run multiple real six-round games with different group sizes and rating/pace settings. In particular compare abandonment rates, submission timeouts, 95th-percentile round length, perceived fairness and reactions to Early Bell. Telemetry alone cannot substitute for playtesting.

## Local telemetry additions in v1.7.1

The host-only telemetry report now includes `byChallenge` (count, totalMs, avgMs) and `cards[cardId].discarded` counters. Player reactions to an activated card are accepted once per player per effect, within 30 seconds. No identities or answer text enter telemetry.

## v1.8 quality and fairness adjustments

- A power-up is *playable* only when the server authorises it for the current player, phase, match limit and global Chaos limit. The snapshot includes a private `playable`, `reason` and, when applicable, `expiresAt` value.
- The controller shows an accessible quick-play strip at the beginning of a SUBMIT phase to prevent urgent card windows being hidden in the drawer. Bullseye Bet opens the prediction controls instead of guessing a value.
- Deckchair Shuffle has a 12-second activation window, Wrong Envelope has 10 seconds, and Fast Fingers can be activated during the first 10 seconds. Once Fast Fingers activates, manual submission must occur within 12 seconds in Lively or 20 seconds in Relaxed and receive at least one Gold vote.
- Replacements, activation and Extra Helping cannot sneak through after the shared round deadline. Host pauses freeze power-up windows, pending Extra Helping choices and temporary visual effects. Fast Fingers shows its own countdown on the player controller after activation.
- When a hand swap invalidates a card previously selected on a controller, the interface clears the selection and asks the player to choose again rather than submitting an obsolete ID.
- Telemetry reports offers, activations, a simple activation/offer percentage, and frustration as a percentage of explicitly submitted feedback. These are descriptive signals only; spontaneous opinions and correlation are not proof of causation.
- No changes to avatar identifiers, artwork, bindings or rendering. Game Cards remain disabled by default.

## v1.8.2 fairness safeguards

- Late answer, seed, response swap and vote requests are rejected at the action boundary, even if the 300 ms server tick has not advanced the game phase.
- Vote submissions are immutable; retrying the same ballot returns without duplicating the vote or incrementing telemetry. The controller explains that a submitted ballot is locked.
- The Lifebuoy treats the bottom half as ranks strictly greater than `ceil(contestant count / 2)`, preventing second place in a three-person match from qualifying.
- Game Card effects and extra-draw options stay visible during a host pause; resuming shifts their deadlines by the paused duration.
- Game Cards remain an optional host setting pending in-person checks of fairness, interruptions and enjoyment.
