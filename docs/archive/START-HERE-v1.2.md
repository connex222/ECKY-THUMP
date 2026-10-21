# START HERE — ECKY THUMP v1.2

1. Install Node.js 20.11 or newer if needed.
2. On Windows, double-click `START-GAME-WINDOWS.bat`; otherwise run `node server/index.js`.
3. On the main screen choose Clean, Cheeky or Adult, game length and pace. Create a room.
4. Open the private **TV DISPLAY** from the host's controller and use its QR invitation for phones.
5. On the TV lobby, switch between **Family Friendly** and **After Dark 18+**. After Dark can be enabled only if all players and spectators have individually pressed **I AM 18+ · CONFIRM** (or confirmed when joining). A TV display token is required to operate the toggle.
6. The host starts with at least three contestants. At 12 contestants, further joiners automatically become **Chaos Mode** audience members; late joiners are also audience. Spectators can heckle and vote on visual ambience, never score or affect actual timers.
7. Phone refresh or dropped Wi-Fi: reopen the same join URL on the same device. Your secret session token and saved unsubmitted text are restored if the room still exists.
8. **Lively** mode has 4.5-second results breaks; in **Relaxed** mode the host decides when to proceed.
9. To run automated tests, open a terminal in the extracted folder and run `npm test`.

A TV at another house can use its own host-minted private display link. Opening the service to the public is not the same as publishing its source. Avoid sharing the room link outside friends.
