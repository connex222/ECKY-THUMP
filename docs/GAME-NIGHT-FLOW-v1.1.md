# ECKEY THUMP v1.1 — Developer Notes

## Scope

This update preserves the complete v1.0 feature set (five challenges, 1,200-entry content expansion, 32 avatars, QR joining, optional music and effects) while improving the pacing of a private games night.

## Protocol additions

- Player action: `POST /api/rooms/:code/action` with body `{"type":"ready-next"}`. It requires the player's valid Bearer token and a current `RESULTS` phase. Calling twice is idempotent.
- `snapshot.round.readyCount`: number of current-room players who are ready to proceed.
- `snapshot.round.youReady`: whether the current viewer has marked ready. Read-only TV viewers always receive false.
- `snapshot.round.nextChallenge`: label of the upcoming challenge, or `CHAMPION REVEAL` at the end.
- `snapshot.nightRecap`: in `COMPLETE` phase only; contains rounds played, number of scored answers, total ballots, and up to three top-voted answers with attribution. It does not expose unrevealed submissions.
- Server-authoritative gameplay is unchanged: the host can advance RESULTS at any time; Lively RESULTS auto-advance after 25 seconds; Relaxed RESULTS wait for the host.

## Clock synchronisation

The clients compute an approximate server/device clock offset using the existing `serverNow` property and use it when displaying deadlines. Latency introduces small uncertainty; the server is always authoritative.

## Security

Ready-up doesn't disclose private response cards, private answer identities before the vote, or ballot choices. Recap data is exposed only once the championship is over. TV displays are authenticated, read-only clients. Room codes are invitations, not public directories.

## QA

Run `npm test`. Test a full 6-round match with at least three people on actual phones and a TV. Verify:

1. All round guide text matches the challenge and Context Collapse's two stages.
2. Gold/Silver status updates before ballot submission.
3. Ready-up counts update live for all players and TVs; host advances without a new lobby.
4. Lively mode moves forward automatically; Relaxed waits.
5. Playing Again resets readiness and scoreboard, but preserves room code and unused content rotation.
6. Finale highlights appear only after scoring, without revealing early identities.
7. Audio remains opt-in and reduced motion disables most effects.
