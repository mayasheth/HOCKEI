/**
 * Curse templates - definitions for embarrassing stats
 *
 * Each template has:
 * - id: unique identifier
 * - category: grouping for display
 * - compute: function(games) => { value, evidence }
 * - isCursed: function(value) => boolean (does it pass badness threshold?)
 * - format: function(value, teamAbbrev) => string (human-readable)
 * - severity: function(value) => number (1-5 scale)
 * - relevantFor: function(gameContext) => boolean (is this curse relevant for today's game?)
 *
 * gameContext: { isHome: boolean, isBackToBack: boolean, dayOfWeek: string } | null
 */

import {
  weeksSinceWinOnDay,
  locationLossStreak,
  backToBackRecord,
  gamesSinceWin,
  shutoutCount,
} from './compute.js';

// Get current day of week
const TODAY = new Date().toLocaleDateString('en-US', { weekday: 'long' });

export const curseTemplates = [
  // Day-of-week drought (only for TODAY)
  {
    id: `day-drought-${TODAY.toLowerCase()}`,
    category: 'drought',
    compute: (games) => weeksSinceWinOnDay(games, TODAY),
    isCursed: ({ value }) => value >= 4,
    format: ({ value }) => `Haven't won on a ${TODAY} in ${value} weeks`,
    severity: ({ value }) => Math.min(value - 3, 5),
    // Always relevant if playing today (since it's the current day)
    relevantFor: (ctx) => ctx !== null,
  },

  // Home loss streak
  {
    id: 'home-loss-streak',
    category: 'streak',
    compute: (games) => locationLossStreak(games, true),
    isCursed: ({ value }) => value >= 3,
    format: ({ value }) => `${value} straight losses at home`,
    severity: ({ value }) => Math.min(value - 2, 5),
    // Relevant if playing at home
    relevantFor: (ctx) => ctx?.isHome === true,
  },

  // Road loss streak
  {
    id: 'road-loss-streak',
    category: 'streak',
    compute: (games) => locationLossStreak(games, false),
    isCursed: ({ value }) => value >= 4,
    format: ({ value }) => `${value} straight losses on the road`,
    severity: ({ value }) => Math.min(value - 3, 5),
    // Relevant if playing away
    relevantFor: (ctx) => ctx?.isHome === false,
  },

  // Back-to-back record
  {
    id: 'back-to-back',
    category: 'situational',
    compute: (games) => backToBackRecord(games),
    isCursed: ({ value }) => value.total >= 4 && (value.losses / value.total) >= 0.6,
    format: ({ value }) => `${value.wins}-${value.losses} in second games of back-to-backs`,
    severity: ({ value }) => value.total > 0 ? Math.min(Math.floor((value.losses / value.total) * 5), 5) : 0,
    // Relevant if this is the second game of a back-to-back
    relevantFor: (ctx) => ctx?.isBackToBack === true,
  },

  // Overall winless streak
  {
    id: 'winless-streak',
    category: 'streak',
    compute: (games) => gamesSinceWin(games),
    isCursed: ({ value }) => value >= 3,
    format: ({ value }) => `Winless in last ${value} games`,
    severity: ({ value }) => Math.min(value - 2, 5),
    // Always relevant if playing
    relevantFor: (ctx) => ctx !== null,
  },

  // Shutout frequency
  {
    id: 'shutout-frequency',
    category: 'offense',
    compute: (games) => shutoutCount(games, 15),
    isCursed: ({ value }) => value.total >= 10 && value.shutouts >= 3,
    format: ({ value }) => `Shutout ${value.shutouts} times in last ${value.total} games`,
    severity: ({ value }) => Math.min(value.shutouts, 5),
    // Always relevant
    relevantFor: () => true,
  },

  // Blown leads (simplified - games where outscored by 3+)
  {
    id: 'blowout-losses',
    category: 'embarrassing',
    compute: (games) => {
      const recent = games.slice(0, 15);
      const evidence = recent.filter(g => g.oppScore - g.teamScore >= 3);
      return { value: { blowouts: evidence.length, total: recent.length }, evidence };
    },
    isCursed: ({ value }) => value.blowouts >= 3,
    format: ({ value }) => `Lost by 3+ goals ${value.blowouts} times in last ${value.total} games`,
    severity: ({ value }) => Math.min(value.blowouts, 5),
    // Always relevant
    relevantFor: () => true,
  },

  // One-goal game record (can't close out)
  {
    id: 'one-goal-losses',
    category: 'situational',
    compute: (games) => {
      const recent = games.slice(0, 20);
      const oneGoalGames = recent.filter(g => Math.abs(g.teamScore - g.oppScore) === 1);
      const evidence = oneGoalGames.filter(g => g.isLoss);
      const wins = oneGoalGames.length - evidence.length;
      return { value: { losses: evidence.length, wins, total: oneGoalGames.length }, evidence };
    },
    isCursed: ({ value }) => value.total >= 6 && (value.losses / value.total) >= 0.6,
    format: ({ value }) => `${value.losses}-${value.wins} in one-goal games`,
    severity: ({ value }) => value.total > 0 ? Math.min(Math.floor((value.losses / value.total) * 5), 5) : 0,
    // Always relevant
    relevantFor: () => true,
  },
];

export default curseTemplates;
