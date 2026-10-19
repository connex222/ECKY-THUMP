# The Nonsense League — From Prototype to Sellable Product

## v0.1 — Vertical slice (delivered)

- Two complete challenges and two equally functional player experiences (TV with phone controls / phone-only).
- Private lobby, simple original content, anonymous Gold + Silver ballots, server scoring, results, champion, content flags, seat recovery.
- Node built-in HTTP + SSE + REST was selected solely to remove install friction for first-time testers. It is NOT the final production transport or persistence architecture defined in the GDD.

## v0.4 — Round integrity and interaction polish

- Persistent room/event/score state and reconnect handoff across server restart/deployments (PostgreSQL).
- Runtime inputs from Socket.IO v4 with strict authorization/ack events, replay and reconnect.
- Visible vote/submission confirmation, stronger phone keyboard support, timer sync, connectivity/resume tests, full pause lifetime, role ownership transfer.
- In-app QR generator with no third-party runtime dependency or a reviewed library.
- Host sees content-report counts and can hide, restart ballot, remove malicious players; staff safety review and evidence workflows for pilot users.
- Audio captions, mute/reduced motion settings, accessibility pass (keyboard + screen-reader + WCAG 2.2 AA goal).

## v0.4 — Full five-challenge championship

- Context Collapse: seed → reshuffle → fictional-context remix → anonymous vote, secure no-self assignment.
- Double Trouble: private prop cards plus a mandatory personally written punchline.
- Last Laugh: finale contract/constraint plus exact 1.5× score award semantics, including unrounded tied-rank handling.
- Standard seven-round Party Mix, fairness/audit tests, content/editorial beta library, all five types and polished finals.

## v0.4 — Commercial infrastructure

- Customer sign-in/recovery, verified purchaser identities and one-off licenses.
- Stripe Checkout with **verified signed webhooks**, idempotent fulfillment and refunds; never accept client-only payment-success claims.
- Expansion pack version registry, entitlement checks on room creation and game start, zero play-to-win scoring benefits.
- Database, privacy/retention/backup plan, telemetry without storing player answers by default, operational dashboards.

## v0.5 — Closed commercial beta

- Trademark/domain decision and ownership checks, original-content editorial audits, accessibility and device/browser tests.
- Formal service classification and legal review: Online Safety Act, age/children-access, consumer rights, privacy/data retention, incident response.
- Original artwork, finished licensed audio, accessible settings and content-rating policies; public launch only after gates pass.
- Load testing targets: 50 simultaneous 12-player rooms, playtesting metrics, reconnect stress, security assessment.

## Ship gates before public payment

1. Three- and twelve-player clean matches complete without a critical defect.
2. Guest input cannot leak between private hands, reveal authors before results or edit scores; reconnections preserve purchased matches.
3. Every submission has meaningful safety controls and reporting; age/children assessment is completed and controls implemented where required.
4. Server-side purchase receipt verification and entitlement recovery pass tests, including refunds/retries.
5. Legal licence, branding, privacy, content terms and appropriate UK regulatory review signed off.
6. Host phone and TV flows work independently on tested iOS, Android, Safari, Chrome, Edge and real devices.
