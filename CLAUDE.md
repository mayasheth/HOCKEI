# HOCKEI: Highly Optimized Coverage of Key Events (Impartial)

Schadenfreude app for NHL fans to track negative events (losses, goals against) for rival teams. Web port of iOS app "Rival Watch".

## Tech Stack
Astro + Tailwind CSS v4 + Vanilla JS, deployed on Vercel

## Structure
```
src/
├── pages/
│   ├── index.astro          # Main feed - glass UI (desktop) / stacked feed (mobile)
│   ├── rivals.astro         # Team selection with division grouping
│   ├── stats.astro          # Team stats page (Intel Dossier style)
│   ├── test.astro           # Component test page (cards, animations, curses)
│   └── api/nhl/[...path].js # CORS proxy → api-web.nhle.com/v1/*
├── layouts/
│   └── Layout.astro         # Nav + page wrapper + feed drawer (desktop)
├── lib/
│   ├── nhl.js               # NHL API: fetchTeams, fetchScores, fetchPlayByPlay, fetchNegativeEvents, hasLiveGames, fetchLosingStreak
│   ├── cards.js             # Card HTML generators (glass + feed variants)
│   ├── glassEffects.js      # Crack effects, impact animations, screen shake
│   ├── store.js             # localStorage: getSelectedRivals, toggleRival, clearAllRivals
│   ├── teamColors.js        # Team colors map + getTeamColors(abbrev), accentRed
│   └── curses/              # "Cursed Numbers" - embarrassing stats framework
│       ├── index.js         # computeCursesForTeam(abbrev), computeCursesWithContext(abbrev)
│       ├── templates.js     # Curse template definitions (day droughts, streaks, etc.)
│       ├── compute.js       # Helper functions for stat calculations
│       └── statsCard.js     # HTML generator for curse stat cards (dossier style)
└── styles/
    └── global.css           # Midnight Navy theme, glass effects, card styles, animations
public/
├── favicon.svg              # Site favicon (H logo with red accent)
├── logo-hockei.svg          # Full color logo
├── logo-hockei-mono.svg     # Monochrome logo
└── logos/                   # 32 team PNGs (lowercase abbrev: tor.png, bos.png)
```

## Key Patterns
- Team IDs use 3-letter abbreviations (TOR, BOS, NYR)
- NHL API base: `https://api-web.nhle.com/v1` (proxied via `/api/nhl/*`)
- NHL API `gameState` values: FUT (future), PRE (pre-game), LIVE, CRIT (critical), OFF/FINAL (finished)
- Theme: Midnight Navy (cool blue tint) - `--bg-arena`, `--bg-surface`, `--accent-red`
- Desktop: Glass UI with scattered cards, crack effects, depth-shift hover
- Mobile: Stacked feed layout (no glass effects)

## Key Behaviors
- **Auto-refresh**: Polls every 20s during live games, 5min otherwise. Pauses when tab hidden.
- **Incremental updates**: Feed tracks event IDs; new cards animate in (scale pop), existing cards stay put.
- **Cards**: Pass `isNew=true` to card functions to trigger `card-enter` animation class.
- **Curses**: Templates in `curses/templates.js` define embarrassing stats. Each has `compute`, `isCursed` (threshold), `format`, and `severity` functions.

## Commands
```bash
npm install      # Install dependencies (first time)
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview build
```

## Related
iOS source: `/Users/shethm/Documents/nhl-rivals/RivalWatch`
Useful NHL API resources:
- https://github.com/Zmalski/NHL-API-Reference
- https://github.com/coreyjs/nhl-api-py

## NHL data notes (verified Oct 2026)
- api-web.nhle.com returns 403 without a browser `User-Agent` header (server-side fetches need one).
- Goal events in `/gamecenter/{id}/play-by-play` carry `goalieInNetId`, `xCoord/yCoord`, and `pptReplayUrl` (wsr.nhle.com sprites: ~140 frames at 10 fps of all player + puck positions in inches, 2400x1020 rink). Puck is the entry with `id: 1`. wsr.nhle.com returns HTML unless the request sends `Referer: https://www.nhl.com/` plus a browser User-Agent.
- Player images: action shots `assets.nhle.com/mugs/actionshots/1296x729/{playerId}.jpg`; transparent headshots via `/roster/{TEAM}/{season}` → `headshot`. Copyrighted; not used in designs (Maya: no player portraits).
- On-ice skaters per goal: `https://api.nhle.com/stats/rest/en/shiftcharts?cayenneExp=gameId={id}` (typeCode 517 = shifts; on ice if start < t <= end).
- Dressed players / starters: `/gamecenter/{id}/boxscore` -> `playerByGameStats`.
