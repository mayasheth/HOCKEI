# HOCKEI: Highly Optimized Coverage of Key Events (Impartial)

## Overview
Web version of **Rival Watch**, ported from the iOS app. A schadenfreude app for NHL fans to track negative events (losses, goals against) for teams they dislike.

## Tech Stack
- **Astro** - Static-first framework with islands architecture
- **Tailwind CSS v4** - Utility-first styling
- **Vercel** - Serverless deployment (handles CORS proxy)
- **No frameworks** - Vanilla JS for interactivity

## Project Structure
```
random-nhl/
├── src/
│   ├── pages/
│   │   ├── index.astro         # Main feed page
│   │   ├── rivals.astro        # Team selection page
│   │   └── api/nhl/[...path].js # CORS proxy for NHL API
│   ├── layouts/
│   │   └── Layout.astro        # Base layout with nav
│   ├── lib/
│   │   ├── nhl.js              # NHL API service (ported from Swift)
│   │   ├── store.js            # localStorage persistence
│   │   └── teamColors.js       # Team color definitions
│   └── styles/
│       └── global.css          # Tailwind + custom styles
├── public/
│   └── logos/                  # 32 team PNGs (from iOS assets)
├── astro.config.mjs
└── package.json
```

## Key Files

### `src/lib/nhl.js`
Ported from iOS `NHLAPIService.swift`. Key functions:
- `fetchTeams()` - Get all NHL teams from standings
- `fetchScores(date)` - Get scores for a specific date
- `fetchPlayByPlay(gameId)` - Get shot type details
- `fetchNegativeEvents(rivals, days)` - Main function that builds the feed

### `src/lib/store.js`
Simple localStorage wrapper for selected rivals:
- `getSelectedRivals()` - Returns `Set<string>` of abbreviations
- `toggleRival(abbrev)` - Toggle selection, returns updated set
- `clearAllRivals()` - Clear all selections

### `src/pages/api/nhl/[...path].js`
Serverless proxy to bypass CORS. Routes:
- `/api/nhl/standings/now` → `api-web.nhle.com/v1/standings/now`
- `/api/nhl/score/{date}` → `api-web.nhle.com/v1/score/{date}`
- etc.

## Design System

### Colors (CSS Variables)
- `--bg-dark`: `rgb(31, 31, 31)` - Main background
- `--bg-card`: `rgb(13, 13, 13)` - Card background
- `--accent-red`: `#CD5C5C` - Muted red accent
- `--text-primary`: `rgba(255, 255, 255, 0.95)`
- `--text-secondary`: `rgba(255, 255, 255, 0.7)`
- `--text-muted`: `rgba(255, 255, 255, 0.5)`

### Components
- **GoalCard**: Compact, shows scorer + shot type + period/time, left border in team color
- **LossCard**: Large with pulsing glow, team logo + score prominent

## Commands
```bash
# Development
npm run dev

# Build
npm run build

# Preview build
npm run preview
```

## Deployment
Push to GitHub, connect to Vercel. The `@astrojs/vercel` adapter handles serverless functions automatically.

## Related
- iOS app: `/Users/shethm/Documents/nhl-rivals/RivalWatch`
- Same NHL API: `https://api-web.nhle.com/v1`
