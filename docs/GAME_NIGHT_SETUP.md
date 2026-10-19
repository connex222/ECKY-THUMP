# Set up your Nonsense League games night

## Choose your arrangement

**One home, one TV:** The host runs the server on a Windows computer. Everyone's phone connects over the home Wi-Fi. The host opens a separate TV display on a laptop, browser on a smart TV (if it supports the page), or by casting the laptop to the TV. The TV is not required.

**Two or three homes:** Run one publicly hosted game server, and have all players use its HTTPS URL. Each person uses a phone. Each home can optionally show its own TV display. They will remain synchronised with the same room.

## Option A: One home, as simply as possible

1. Make sure Node.js is installed on the computer.
2. Unzip the download, then double-click `START-GAME-WINDOWS.bat`.
3. In Windows Command Prompt, type `ipconfig`, then note the active Ethernet or Wi-Fi **IPv4 Address**.
4. If that address is, for example, `192.168.1.25`, type `http://192.168.1.25:3000` in the computer's browser (replace the example with your actual address).
5. Start a room from that address and share the invite link or address plus room code with everyone at the party.
6. Phones must connect to the same home network. Ethernet and normal Wi-Fi can work together; guest Wi-Fi often cannot.
7. Open a TV display if you want, and start the match once 3–12 players have joined.

### If a phone can't join

- Check that the server black window is still running, and the computer can load `http://localhost:3000`.
- Confirm you typed the computer's *actual* IPv4 address (not `localhost`) on the phone.
- Check phone Wi-Fi is on the **same network** as the computer; switch off mobile data temporarily while diagnosing.
- Allow Node.js through the Windows Firewall on **private** networks, if prompted.
- Check your router does not isolate Wi-Fi clients from Ethernet devices.
- Never expose port 3000 to the whole internet as a quick fix. For remote homes, use HTTPS hosting instead.

## Option B: Two or three homes — with Render

### Initial deployment

1. Create a private GitHub repository for this game and upload the **contents** of the extracted v0.5 folder to its root. That means `package.json`, `server/`, `public/`, and `render.yaml` are visible at repository root.
2. In Render, create a **new Web Service**, connect the GitHub repository, choose Node, and use:
   - Build command: `npm test`
   - Start command: `npm start`
   - Health check: `/api/health`
3. Deploy. When Render gives you a HTTPS address, open it from your phone and a second device.
4. Use **one active server instance** for this prototype. The rooms live in RAM, not a shared database. An instance restart or sleeping host loses every game.
5. Use a service plan that stays awake during your games night, if available and appropriate. Hosting prices and sleep policies vary; review the actual plan before inviting friends.

### At the party

1. Home A's host opens the **public** Render link on their phone, selects a humour setting, 6 rounds and Relaxed pace, and creates a room.
2. Host presses **Copy invite** and sends the link privately to other players, including anyone at Homes B and C.
3. Everyone enters a nickname on their own phone. There is no account setup.
4. For a big screen: host presses **OPEN TV** to open Home A's TV. For Homes B and C, press **Copy TV link** and send each link to a trusted person at that location. They open it on a connected TV browser, laptop, or a laptop cast to TV.
5. When at least three people are in the room, host taps **START THE SHOW**.
6. After each result, Relaxed pace stays on screen until the host chooses NEXT ROUND. If someone needs a break during answers/voting, host taps Pause. The game also moves forward automatically when all answers/votes have been submitted.
7. After the last winner is revealed, host presses **PLAY AGAIN WITH THIS GROUP** to reset the scoreboard without inviting everybody again.

### What multiple TV links do

Every TV link is a read-only private access link. It lets that screen show the prompt, answer choices, result reveal and scoreboard; it cannot vote or control the game. Each new link is separate, so copying a link for Home C will not cut off Home B. Up to **five active TV links** are retained; issuing a sixth replaces the oldest. Avoid generating unnecessary links during a match. Do not share links publicly.

## Which pace should I choose?

| Pace | Pick cards | Write answers | Vote | Results |
|---|---:|---:|---:|---|
| Relaxed (recommended) | 90 s | 120 s | 75 s | Host continues when ready |
| Lively | 45 s | 70 s | 45 s | Automatically continues after 25 s |

These are upper limits: the game advances to voting when everybody submits, and it ends voting when everybody votes. In Relaxed mode, results remain visible until the host advances.

## Important limitations

- Version 0.8 includes five challenge types: **Card Clash**, **Quick Wit**, **Context Collapse**, **Double Trouble** and **The Last Laugh**. Choose the six-round Games Night option to play them all.
- No in-game voice or video chat. For several homes, run a separate video call if you want people to hear each other laughing.
- If the server restarts, existing games cannot be recovered.
- Players can join only while a room is in its lobby. Late arrivals can join after a completed game when the host has pressed Play Again. The host can remove an absent player from the lobby; they can then rejoin with a new session.
- An adult rating is not legal age verification; answer moderation is limited.
- Use a stable internet connection. A private invite code does not make a publicly hosted site invulnerable to unwanted visitors.
