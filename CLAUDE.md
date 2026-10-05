# HOCKEI: Highly Optimized Coverage of Key Events (Impartial)

Schadenfreude app for NHL fans to track negative events (losses, goals against) for rival teams. Web port of iOS app "Rival Watch".

## Tech Stack
Astro (server output) + plain CSS + vanilla JS, deployed on Vercel. Tailwind is still configured but unused.

## Design ("late edition", Oct 2026)
Dark newsprint, red editor's pen marks only on the worst events, skater-trail drawings from NHL tracking. Earnest, stat-bureau tone: no jokes (see memory). Fonts must have round i-dots: Schibsted Grotesk, Newsreader, Roboto Condensed, DM Mono. Score shown only when the rival lost or trails. Split-flap digits only on live scores. Strength tags: PPG, SHG, ENG. Mockups and their build scripts live in `handovers/data/` (git-ignored); `hockei-round11.html` is the reference.

## Structure
```
src/
├── pages/
│   ├── index.astro          # Feed: Live (scoreboard + time-ordered goal feed) and Recent games (6 at a time, load more); aside: Next, About
│   ├── rivals.astro         # Teams page: tap once for rival, twice for favorite (localStorage)
│   └── api/
│       ├── recent.js        # ?rivals=&offset=&limit= -> finished games with facts, newest first
│       ├── live.js          # ?rivals=[&date=] -> today's (or that date's) rival games with goals against
│       ├── next.js          # ?rivals= -> each rival's next game + pre-game facts
│       ├── tracks.js        # ?u=<pptReplayUrl>&r=TEAM -> puck/skater paths (wsr.nhle.com only)
│       ├── _util.js         # rivals param parsing, JSON + cache headers
│       └── nhl/[...path].js # Raw proxy -> api-web.nhle.com/v1/* (sends a browser User-Agent)
├── layouts/Layout.astro     # Masthead (dateline, HOCKEI, rival chips, nav)
├── lib/
│   ├── server/nhl.js        # Server fetch with UA + in-memory TTL cache
│   ├── server/games.js      # schedule(), detail() (play-by-play -> goals against), finishedGame(), recent(), live(), next()
│   ├── facts.js             # Fact engine: factsFor (rival misery), factsForFav (good news), pre-game facts; absorbed the old curses
│   ├── teams.js             # 32 teams: name, division, two dark-paper inks (main ink first)
│   ├── store.js             # localStorage rivals
│   └── ui/
│       ├── draw.js          # GoalDrawing (skater trails, two-colour puck), loadTrack, frameBox
│       ├── render.js        # summaryEl, feedCard, sbRow, goalContext, scoringRows
│       ├── live.js          # startLive(): polling, feed ordering, finals leaving for Recent, ?replay= mode
│       └── pen.js           # Seeded red pen marks (circle, underline), esc, dashed scorelines
└── styles/global.css        # Tokens, layout, drawings, print motion, pen marks
```

## Key Behaviors
- **Rivals and favorites**: each team is none, rival or favorite (`store.js`; Teams page cycles them). Rivals are covered by goals against and losses (red pen, red ✕ mark); favorites by goals for and wins (blue pen `--pen-good`, blue ✓). A favorite scoring on or beating a rival is one "both" item (both marks, two-colour puck: favorite ink + rival ink). Favorite losses are never shown; rival wins only when they carry a stat. API routes take `rivals=` and `favs=`; entries carry `role`.
- **Live ("Tonight")**: a scoreboard row for every rival game today (start time, live clock, `2nd INT`, Final). Finished games stay with their goals, and also join Recent (today's results are overlaid from `score/now`, so the 5-min schedule cache doesn't delay them). A final the rival lost gets a pen circle and arrow. Polls `/api/live` every 20 s while games are live or in pre-game, 5 min otherwise; pauses when hidden. Goals from all games share one feed, newest first. Goals removed on review disappear.
- **Live cards**: text first; the drawing rolls in when tracking is published (retried each minute for 20 min). Each shows game time plus "N min ago", from when this browser first saw the goal (localStorage `hockei-goal-seen`), or "~N min ago" estimated from the start time for goals scored before the page opened.
- **Replay for testing**: `/?replay=2026-09-29&at=40` replays that date's rival games on a compressed clock (`at` = start minute).
- **Facts**: `facts.js` rules in priority order; the first four that apply are shown. Window is the current + previous season. Severity: SHG, any OT goal (the winner) or a late game-winner = 60 (pen marks), PPG/ENG/winner = 40, else 35.
- **Tracking**: sprites appear a few minutes after a goal; live cards retry every 60 s (10 tries). Summaries load tracks when scrolled near and draw every goal in one shared crop.
- **Caching**: finished play-by-play and game summaries are cached in memory forever; schedules 5 min; live 10 s. API responses set `s-maxage` for Vercel's edge cache.

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
