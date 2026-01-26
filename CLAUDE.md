# HOCKEI: Highly Optimized Coverage of Key Events (Impartial)

Schadenfreude app for NHL fans to track negative events (losses, goals against) for rival teams. Web port of iOS app "Rival Watch".

## Tech Stack
Astro + Tailwind CSS v4 + Vanilla JS, deployed on Vercel

## Structure
```
src/
├── pages/
│   ├── index.astro          # Main feed - displays goal/loss cards
│   ├── rivals.astro         # Team selection grid
│   ├── colors.astro         # Dev page for color testing (move to temp branch)
│   └── api/nhl/[...path].js # CORS proxy → api-web.nhle.com/v1/*
├── layouts/
│   └── Layout.astro         # Nav + page wrapper
├── lib/
│   ├── nhl.js               # NHL API: fetchTeams, fetchScores, fetchPlayByPlay, fetchNegativeEvents
│   ├── cards.js             # HTML generators: createGoalCard, createLossCard, createDayHeader
│   ├── store.js             # localStorage: getSelectedRivals, toggleRival, clearAllRivals
│   └── teamColors.js        # Team colors map + getTeamColors(abbrev), accentRed
└── styles/
    └── global.css           # CSS variables, card styles, animations
public/
└── logos/                   # 32 team PNGs (lowercase abbrev: tor.png, bos.png)
```

## Key Patterns
- Team IDs use 3-letter abbreviations (TOR, BOS, NYR)
- NHL API base: `https://api-web.nhle.com/v1` (proxied via `/api/nhl/*`)
- Colors: `--bg-dark` (31,31,31), `--bg-card` (13,13,13), `--accent-red` (#CD5C5C)

## Commands
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview build
```

## Related
iOS source: `/Users/shethm/Documents/nhl-rivals/RivalWatch`
