/**
 * NHL API service
 */

const API_BASE = '/api/nhl';

/**
 * Fetch all NHL teams from standings
 * @returns {Promise<Array<{abbreviation: string, name: string, commonName: string}>>}
 */
export async function fetchTeams() {
  const res = await fetch(`${API_BASE}/standings/now`);
  if (!res.ok) throw new Error('Failed to fetch teams');
  const data = await res.json();

  // Remove duplicates by abbreviation
  const seen = new Set();
  const teams = [];

  for (const entry of data.standings) {
    const abbrev = entry.teamAbbrev.default;
    if (!seen.has(abbrev)) {
      seen.add(abbrev);
      teams.push({
        abbreviation: abbrev,
        name: entry.teamName.default,
        commonName: entry.teamCommonName.default
      });
    }
  }

  return teams.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Fetch scores for a specific date
 * @param {Date|null} date - Date to fetch, or null for current
 * @returns {Promise<Array>}
 */
export async function fetchScores(date = null) {
  const dateString = date
    ? date.toISOString().split('T')[0]
    : 'now';

  const res = await fetch(`${API_BASE}/score/${dateString}`);
  if (!res.ok) throw new Error('Failed to fetch scores');
  const data = await res.json();
  return data.games || [];
}

/**
 * Fetch play-by-play for shot type details
 * @param {number} gameId
 * @returns {Promise<Object>}
 */
export async function fetchPlayByPlay(gameId) {
  const res = await fetch(`${API_BASE}/gamecenter/${gameId}/play-by-play`);
  if (!res.ok) throw new Error('Failed to fetch play-by-play');
  return res.json();
}

/**
 * Build shot type lookup from play-by-play data
 * @param {Object} pbp - Play-by-play response
 * @returns {Object} - Lookup table by "period-time" key
 */
function buildShotTypeLookup(pbp) {
  const lookup = {};
  for (const play of pbp.plays || []) {
    if (play.typeDescKey !== 'goal') continue;
    const period = play.periodDescriptor?.number;
    const time = play.timeInPeriod;
    const shotType = play.details?.shotType;
    if (period && time && shotType) {
      lookup[`${period}-${time}`] = shotType;
    }
  }
  return lookup;
}

/**
 * Get period display string
 * @param {number} period
 * @param {Object|null} periodDescriptor
 * @returns {string}
 */
function getPeriodDisplay(period, periodDescriptor) {
  if (periodDescriptor?.periodType === 'OT') return 'OT';
  if (periodDescriptor?.periodType === 'SO') return 'SO';
  switch (period) {
    case 1: return '1st';
    case 2: return '2nd';
    case 3: return '3rd';
    default: return 'OT';
  }
}

/**
 * Fetch negative events (goals against + losses) for rival teams
 * @param {Set<string>} rivalAbbreviations - Set of team abbreviations
 * @param {number} days - Number of days to look back (default 3 for 72 hours)
 * @returns {Promise<Array>}
 */
export async function fetchNegativeEvents(rivalAbbreviations, days = 3) {
  const events = [];
  const today = new Date();

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() - dayOffset);

    try {
      const games = await fetchScores(currentDate);

      for (const game of games) {
        const homeIsRival = rivalAbbreviations.has(game.homeTeam.abbrev);
        const awayIsRival = rivalAbbreviations.has(game.awayTeam.abbrev);

        if (!homeIsRival && !awayIsRival) continue;

        // Fetch play-by-play for shot types if there are goals
        let shotTypeLookup = {};
        if (game.goals?.length > 0) {
          try {
            const pbp = await fetchPlayByPlay(game.id);
            shotTypeLookup = buildShotTypeLookup(pbp);
          } catch {
            // Continue without shot types
          }
        }

        // Process goals against rivals
        if (game.goals) {
          for (const goal of game.goals) {
            const lookupKey = `${goal.period}-${goal.timeInPeriod}`;
            const shotType = shotTypeLookup[lookupKey];

            // Goal is against a rival if the scoring team is NOT the rival
            if (homeIsRival && goal.teamAbbrev === game.awayTeam.abbrev) {
              events.push(buildGoalAgainstEvent(game, goal, game.homeTeam, game.awayTeam, true, shotType));
            } else if (awayIsRival && goal.teamAbbrev === game.homeTeam.abbrev) {
              events.push(buildGoalAgainstEvent(game, goal, game.awayTeam, game.homeTeam, false, shotType));
            }
          }
        }

        // Check for losses (completed games only)
        const isComplete = game.gameState === 'OFF' || game.gameState === 'FINAL';
        if (isComplete) {
          const homeScore = game.homeTeam.score ?? 0;
          const awayScore = game.awayTeam.score ?? 0;

          if (homeIsRival && homeScore < awayScore) {
            events.push(buildLossEvent(game, game.homeTeam, homeScore, game.awayTeam, awayScore, true));
          } else if (awayIsRival && awayScore < homeScore) {
            events.push(buildLossEvent(game, game.awayTeam, awayScore, game.homeTeam, homeScore, false));
          }
        }
      }
    } catch {
      // Continue with next day
    }
  }

  // Sort by: timestamp DESC, then within same game: period DESC, time DESC
  return events.sort((a, b) => {
    // First by game timestamp (most recent games first)
    const timeDiff = new Date(b.timestamp) - new Date(a.timestamp);
    if (timeDiff !== 0) return timeDiff;

    // Within same game: higher period first (3rd before 2nd before 1st)
    const periodDiff = (b.periodNumber || 0) - (a.periodNumber || 0);
    if (periodDiff !== 0) return periodDiff;

    // Within same period: later time first (higher seconds = later in period)
    return (b.periodTimeSeconds || 0) - (a.periodTimeSeconds || 0);
  });
}

/**
 * Build a goal against event object
 */
function buildGoalAgainstEvent(game, goal, rivalTeam, opponentTeam, isHomeGame, shotType) {
  const scorerName = goal.firstName?.default && goal.lastName?.default
    ? `${goal.firstName.default} ${goal.lastName.default}`
    : goal.name?.default || 'Unknown';

  // Parse time for sorting (MM:SS -> seconds remaining in period)
  const [mins, secs] = (goal.timeInPeriod || '0:00').split(':').map(Number);
  const timeInSeconds = mins * 60 + secs;

  return {
    id: `goal-${game.id}-${goal.timeInPeriod}-${goal.period}`,
    type: 'goalAgainst',
    teamAbbreviation: rivalTeam.abbrev,
    teamName: rivalTeam.commonName?.default || rivalTeam.abbrev,
    opponentAbbreviation: opponentTeam.abbrev,
    opponentName: opponentTeam.commonName?.default || opponentTeam.abbrev,
    timestamp: game.startTimeUTC,
    gameId: game.id,
    periodNumber: goal.period,           // Raw period for sorting
    periodTimeSeconds: timeInSeconds,    // Time in period for sorting
    rivalScore: isHomeGame ? (game.homeTeam.score ?? 0) : (game.awayTeam.score ?? 0),
    opponentScore: isHomeGame ? (game.awayTeam.score ?? 0) : (game.homeTeam.score ?? 0),
    period: getPeriodDisplay(goal.period, goal.periodDescriptor),
    timeInPeriod: goal.timeInPeriod,
    scorerName,
    isHomeGame,
    highlightURL: goal.highlightClipSharingUrl || null,
    shotType,
    strength: goal.strength
  };
}

/**
 * Build a loss event object
 */
function buildLossEvent(game, rivalTeam, rivalScore, opponentTeam, opponentScore, isHomeGame) {
  return {
    id: `loss-${game.id}`,
    type: 'loss',
    teamAbbreviation: rivalTeam.abbrev,
    teamName: rivalTeam.commonName?.default || rivalTeam.abbrev,
    opponentAbbreviation: opponentTeam.abbrev,
    opponentName: opponentTeam.commonName?.default || opponentTeam.abbrev,
    timestamp: game.startTimeUTC,
    gameId: game.id,
    periodNumber: 99,           // Sort losses after all goals
    periodTimeSeconds: 0,
    rivalScore,
    opponentScore,
    period: null,
    timeInPeriod: null,
    scorerName: null,
    isHomeGame,
    highlightURL: null,
    shotType: null,
    strength: null
  };
}
