# HOCKEI - Feature Backlog

## Priority Features

- [x] fix arrow symbols showing as emoji on iOS instead of icon - use consistent red icon styling
- [x] update branding to new name (HOCKEI, Highly Optimized Coverage of Key Events (Impartial))
- [x] update CLAUDE.md with current code structure
- [x] move the color/preview page to be on a preview/temp branch, not main

### New Cards
- [x] **Losing Streak Card** - Loss cards show streak footer when team has 3+ consecutive losses
- [ ] **Short-Handed Goal Formatting** - Extra emphasis for SHG against rivals (extra embarrassing)

### New Pages
- [ ] **Rival Stats Page** - Statistics highlighting how bad your rivals are (win %, goals against, standings, streaks); is your rival team an OT merchant?
  - [ ] "On This Day" negative events for each team (embarassing losses, blown leads)
  - [ ] "Cursed Numbers" = random hyper-specific embarrassing stats, like "0-7 in games following a shutout win", "haven't won on a Tuesday in 6 weeks"
    - Compute both "regulation loss" streaks and "without reglation win" streaks and choose which is worst to display
  - [ ]"Exposed" Stats Page = Cherry-picked stats that make rivals look bad:
    - "Goals allowed in the 3rd period" (when they blow leads)
    - "Record when trailing after 2 periods" (can't come back)
    - "Power play goals allowed" (undisciplined)
    - "Save % in high-danger situations" (goalie fraud)
  - [ ] "OT Merchants" Badge --> flag teams that have a lot of OT/SO losses - "They can't close games" (or lots of OT/SO wins, because they are stacking extra points)
  - [ ] "Fraud Alert" --> Compare a rival's record vs good teams vs bad teams. Surface when they're "stat padding" against weak opponents.  

### UX Improvements
- [ ] **Goal Video Link** - Add button linking to goal replay for goals against (link from NHL API a few minutes after the goal is scored)
- [x] **Card Animations** - Scale pop animation for new cards during live updates
- [x] **Auto-Refresh** - Automatically refresh feed for live game updates (20s live, 5min idle)

---

## Major Features
### Playoff Support
- [ ] **Playoff Position Card** - Alert when a rival falls out of a playoff spot
- [ ] Specialized card formatting for playoffs to display when a team is kicked out of the playoffs or down in a series

### Favorite Teams Support
- [ ] Allow users to select favorite teams (in addition to rivals)
- [ ] Add positive event cards for favorites (goals scored, wins, winning streaks)
- [ ] Mixed feed showing rival misfortune + favorite success
- [ ] Distinct visual styling for positive vs negative cards

---

## Backlog

### Cards & Feed
- [ ] Video highlight playback for goals

### Technical
- [ ] Responsive design improvements for mobile
- [ ] PWA support (installable web app, push notifications?)
- [ ] API response caching

### Future Ideas
- [ ] Random hyper-specific stats generator
- [ ] Share buttons for social media

---

## Completed
- [x] NHL API integration (teams, scores, play-by-play)
- [x] Team selection with localStorage persistence
- [x] Feed view with goal and loss cards
- [x] Dark theme with team color accents
- [x] Shot type display from play-by-play API
- [x] Day separators in feed
- [x] 72-hour data loading
- [x] Team color dark mode overrides
