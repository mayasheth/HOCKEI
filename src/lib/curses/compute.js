/**
 * Helper functions for computing cursed stats
 */

/**
 * Get completed games sorted by date (most recent first)
 * @param {Array} games - Raw games from schedule API
 * @returns {Array} Completed games with parsed dates
 */
export function getCompletedGames(games) {
  return games
    .filter(g => g.gameState === 'OFF' || g.gameState === 'FINAL')
    .map(g => ({
      ...g,
      date: new Date(g.gameDate),
      dayOfWeek: new Date(g.gameDate).toLocaleDateString('en-US', { weekday: 'long' }),
      isHome: g.homeTeam.abbrev === g.teamAbbrev,
      teamScore: g.homeTeam.abbrev === g.teamAbbrev ? g.homeTeam.score : g.awayTeam.score,
      oppScore: g.homeTeam.abbrev === g.teamAbbrev ? g.awayTeam.score : g.homeTeam.score,
      isWin: false, // Will be set below
      isLoss: false,
    }))
    .map(g => ({
      ...g,
      isWin: g.teamScore > g.oppScore,
      isLoss: g.teamScore < g.oppScore,
    }))
    .sort((a, b) => b.date - a.date);
}

/**
 * Calculate weeks since last win on a specific day
 * @param {Array} games - Processed games
 * @param {string} dayName - e.g., "Tuesday"
 * @returns {{ value: number, evidence: Array }} Weeks since last win + games as evidence
 */
export function weeksSinceWinOnDay(games, dayName) {
  const dayGames = games.filter(g => g.dayOfWeek === dayName);
  if (dayGames.length === 0) return { value: 0, evidence: [] };

  const lastWinIndex = dayGames.findIndex(g => g.isWin);

  if (lastWinIndex === -1) {
    // Never won on this day in the data - count from first game
    const firstGame = dayGames[dayGames.length - 1];
    const weeks = Math.floor((Date.now() - firstGame.date) / (7 * 24 * 60 * 60 * 1000));
    return { value: weeks, evidence: dayGames }; // All games on this day are losses
  }

  const weeks = Math.floor((Date.now() - dayGames[lastWinIndex].date) / (7 * 24 * 60 * 60 * 1000));
  // Evidence = games since last win (not including the win)
  const evidence = dayGames.slice(0, lastWinIndex);
  return { value: weeks, evidence };
}

/**
 * Count consecutive losses at home or away
 * @param {Array} games - Processed games
 * @param {boolean} isHome - true for home, false for away
 * @returns {{ value: number, evidence: Array }} Streak count + games as evidence
 */
export function locationLossStreak(games, isHome) {
  const locationGames = games.filter(g => g.isHome === isHome);
  const evidence = [];

  for (const game of locationGames) {
    if (game.isLoss) {
      evidence.push(game);
    } else {
      break;
    }
  }

  return { value: evidence.length, evidence };
}

/**
 * Find back-to-back games and return record in second game
 * @param {Array} games - Processed games
 * @returns {{ value: { wins, losses, total }, evidence: Array }}
 */
export function backToBackRecord(games) {
  const sorted = [...games].sort((a, b) => a.date - b.date);
  let wins = 0;
  let losses = 0;
  const evidence = [];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    // Check if games are on consecutive days
    const dayDiff = Math.round((curr.date - prev.date) / (24 * 60 * 60 * 1000));

    if (dayDiff === 1) {
      // This is the second game of a back-to-back
      if (curr.isWin) wins++;
      if (curr.isLoss) {
        losses++;
        evidence.push(curr);
      }
    }
  }

  return { value: { wins, losses, total: wins + losses }, evidence };
}

/**
 * Count games without a win (current streak)
 * @param {Array} games - Processed games
 * @returns {{ value: number, evidence: Array }} Games since last win + evidence
 */
export function gamesSinceWin(games) {
  const evidence = [];
  for (const game of games) {
    if (game.isWin) break;
    evidence.push(game);
  }
  return { value: evidence.length, evidence };
}

/**
 * Count shutouts (games with 0 goals) in last N games
 * @param {Array} games - Processed games
 * @param {number} n - Number of recent games to check
 * @returns {{ value: { shutouts, total }, evidence: Array }}
 */
export function shutoutCount(games, n = 10) {
  const recent = games.slice(0, n);
  const evidence = recent.filter(g => g.teamScore === 0);
  return { value: { shutouts: evidence.length, total: recent.length }, evidence };
}

/**
 * Record when trailing after 2 periods (requires detailed game data)
 * For now, simplified: record in games lost by 2+ goals (likely were trailing)
 * @param {Array} games - Processed games
 * @returns {{ comebacks: number, losses: number, total: number }}
 */
export function comebackRecord(games) {
  // Simplified: games where they lost by 2+ (likely were trailing)
  const blowouts = games.filter(g => g.oppScore - g.teamScore >= 2);
  return {
    comebacks: 0, // Would need period data
    losses: blowouts.length,
    total: blowouts.length,
  };
}

/**
 * Ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
 * @param {number} n
 * @returns {string}
 */
export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
