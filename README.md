# ECKEY THUMP — v1.5 Night Shift

A private 3–12-player multiplayer comedy games night. Five challenges, mobile controllers, a shared TV display and optional spectator Chaos Mode.

**NEW v1.5:** Complete modern UI redesign — deep-ink game-show styling, minimal interface, lime/lilac accents, functional host/join setup, clear QR and room code, redesigned voting/results and mobile gameplay.

The legacy avatar system is unchanged; this release changes visuals, not the avatar registry.

## Run

On Windows, double-click `START-GAME-WINDOWS.bat` (requires Node.js 20.11+). Or run:

```sh
npm start
```

For automated verification:

```sh
npm test
```

See `START-HERE-v1.5.md` for usage and deployment notes. Hosted rooms use one Node server with HTTP + Server-Sent Events and server-authoritative game state. Game rooms remain in server memory.
