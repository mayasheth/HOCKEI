# HOCKEI: Highly Optimized Coverage of Key Events (Impartial)

Schadenfreude app for NHL fans to track negative events (losses, goals against) for rival teams. Web port of iOS app "Rival Watch".

## Tech Stack
Astro + Tailwind CSS v4 + Vanilla JS, deployed on Vercel

## Structure
```
src/
├── pages/
│   ├── index.astro          # Main feed with auto-refresh polling
│   ├── rivals.astro         # Team selection grid
│   └── api/nhl/[...path].js # CORS proxy → api-web.nhle.com/v1/*
├── layouts/
│   └── Layout.astro         # Nav + page wrapper
├── lib/
│   ├── nhl.js               # NHL API: fetchTeams, fetchScores, fetchPlayByPlay, fetchNegativeEvents, hasLiveGames
│   ├── cards.js             # HTML generators: createGoalCard(event, isNew), createLossCard(event, isNew)
│   ├── store.js             # localStorage: getSelectedRivals, toggleRival, clearAllRivals
│   └── teamColors.js        # Team colors map + getTeamColors(abbrev), accentRed
└── styles/
    └── global.css           # CSS variables, card styles, animations (card-enter for new cards)
public/
└── logos/                   # 32 team PNGs (lowercase abbrev: tor.png, bos.png)
```

## Key Patterns
- Team IDs use 3-letter abbreviations (TOR, BOS, NYR)
- NHL API base: `https://api-web.nhle.com/v1` (proxied via `/api/nhl/*`)
- NHL API `gameState` values: FUT (future), PRE (pre-game), LIVE, CRIT (critical), OFF/FINAL (finished)
- Colors: `--bg-dark`, `--bg-card`, `--accent-red` (see global.css for values)

## Key Behaviors
- **Auto-refresh**: Polls every 20s during live games, 5min otherwise. Pauses when tab hidden.
- **Incremental updates**: Feed tracks event IDs; new cards animate in (scale pop), existing cards stay put.
- **Cards**: Pass `isNew=true` to card functions to trigger `card-enter` animation class.

## Commands
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview build
```

## Related
iOS source: `/Users/shethm/Documents/nhl-rivals/RivalWatch`
Useful NHL API resources:
- https://github.com/Zmalski/NHL-API-Reference
- https://github.com/coreyjs/nhl-api-py 
