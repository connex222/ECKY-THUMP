# ECKEY THUMP v0.9.1 — Game setup display fix

Three dropdowns on the Host screen were replaced with always-visible, accessible single-choice options:

- **Humour:** Clean / Cheeky / Adult (18+)
- **Length:** Quick Taster (2 rounds) / Normal (4 rounds) / Full Games Night (6 rounds)
- **Pace:** Relaxed / Lively

Pick a tile for each setting; the chosen tile has a gold border and SELECTED label. Adult mode reveals the adult confirmation checkbox. Choices are passed to the existing game server without changing its rules.

This patch also changes asset version query strings to v0.9.1 to avoid browsers reusing old scripts/styles. **If playing on Render or GitHub, the new files must be deployed** — downloading this ZIP does not change an existing website.

Testing: `npm test`; also inspect the host screen in Chrome on Windows and on your phone. This patch preserves all v0.9 content, modes, avatars, QR joining, and gameplay.
