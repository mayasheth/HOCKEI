# HOCKEI - Feature Backlog

## Current Tasks (late edition port, branch `feature/late-edition`)
- [x] Data layer: /api/recent, /api/live, /api/next, /api/tracks; fact engine with curses folded in (Oct 3 2026)
- [x] Feed UI: live scoreboard + time-ordered goal feed, recent games (6 + load more), Next aside, rivals page (Oct 3 2026)
- [x] Removed glass UI, stats page, curses, cards (Oct 3 2026)
- [ ] Watch a real live night (polling, sprite delays, overturned goals, OT/SO, two rivals playing each other)
- [ ] Check on a real phone (headless Chrome can't go below 500 px)
- [ ] Cold-start speed of /api/recent on Vercel (first load fetches many play-by-plays); move to a nightly snapshot (option B) if slow
- [ ] Shootout goals are skipped; decide how a shootout loss should read
- [ ] Remove Tailwind from config and dependencies, and unused public/logos
- [ ] Favorites ("your team") in ranking (deferred)

---

## Priority Features

### Cards & Feed
- [x] **Short-Handed Goal Formatting** - SHG gets severity 60 and red pen marks (Oct 2026)
- [ ] **Goal Video Link** - Add button linking to goal replay (link from NHL API)

### Stats Page Enhancements
- [ ] "On This Day" negative events for each team (embarrassing losses, blown leads)
- [ ] "Exposed" Stats = Cherry-picked stats that make rivals look bad:
  - "Goals allowed in the 3rd period" (when they blow leads)
  - "Record when trailing after 2 periods" (can't come back)
  - "Power play goals allowed" (undisciplined)
- [ ] "OT Merchants" Badge - Flag teams with many OT/SO losses ("can't close games")
- [ ] "Fraud Alert" - Compare rival's record vs good teams vs bad teams

---

## Major Features

### Playoff Support
- [ ] **Playoff Position Card** - Alert when a rival falls out of a playoff spot
- [ ] Specialized card formatting for playoffs (elimination, series deficit)

### Favorite Teams Support
- [ ] Allow users to select favorite teams (in addition to rivals)
- [ ] Add positive event cards for favorites (goals scored, wins, winning streaks)
- [ ] Mixed feed showing rival misfortune + favorite success
- [ ] Distinct visual styling for positive vs negative cards

---

## Backlog

### Technical
- [ ] PWA support (installable web app, push notifications?)
- [ ] API response caching
- [ ] Video highlight playback for goals

### Future Ideas
- [ ] Random hyper-specific stats generator
- [ ] Share buttons for social media

---

## Completed
- [x] NHL API integration (teams, scores, play-by-play)
- [x] Team selection with localStorage persistence
- [x] Feed view with goal and loss cards
- [x] Shot type display from play-by-play API
- [x] Day separators in feed
- [x] 72-hour data loading with progressive lookback
- [x] Team color dark mode overrides
- [x] Card animations (scale pop for new cards)
- [x] Auto-refresh (20s live, 5min idle)
- [x] Glass UI with Midnight Navy theme
- [x] Desktop scattered card layout with aging
- [x] Card impact animations and crack effects
- [x] Glitch effect on victim logos (chromatic aberration)
- [x] Feed drawer (bottom pull-up for linear timeline)
- [x] Mobile stacked feed layout
- [x] Redesigned feed cards (header strip format)
- [x] HOCKEI branding (favicon, logo, acronym display)
- [x] Stats page (Intel Dossier style with severity indicators)
- [x] Rivals page (division-grouped team selection)
- [x] Losing streak calculations (date-specific)
- [x] Depth-shift hover effect on glass cards
