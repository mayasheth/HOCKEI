/**
 * Cursed Numbers - Compute embarrassing stats for teams
 */

import { getCompletedGames } from './compute.js';
import { curseTemplates } from './templates.js';

const API_BASE = '/api/nhl';

/**
 * Fetch team schedule for curse computation
 * @param {string} teamAbbrev
 * @returns {Promise<Array>}
 */
async function fetchTeamSchedule(teamAbbrev) {
  const res = await fetch(`${API_BASE}/club-schedule-season/${teamAbbrev}/now`);
  if (!res.ok) throw new Error(`Failed to fetch schedule for ${teamAbbrev}`);
  const data = await res.json();

  // Add team abbrev to each game for processing
  return (data.games || []).map(g => ({ ...g, teamAbbrev }));
}

/**
 * Get today's game context for a team
 * @param {string} teamAbbrev
 * @returns {Promise<{ isHome: boolean, isBackToBack: boolean, opponent: string, dayOfWeek: string } | null>}
 */
export async function getTodayGameContext(teamAbbrev) {
  try {
    const rawGames = await fetchTeamSchedule(teamAbbrev);
    const today = new Date();
    // Use local date format (YYYY-MM-DD) to match NHL API which uses Eastern time
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });

    // Find today's game
    const todayGame = rawGames.find(g => g.gameDate === todayStr);
    if (!todayGame) return null;

    // Check if it's a back-to-back (played yesterday)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    const yesterdayGame = rawGames.find(g =>
      g.gameDate === yesterdayStr &&
      (g.gameState === 'OFF' || g.gameState === 'FINAL')
    );

    const isHome = todayGame.homeTeam.abbrev === teamAbbrev;
    const opponent = isHome ? todayGame.awayTeam.abbrev : todayGame.homeTeam.abbrev;

    return {
      isHome,
      isBackToBack: !!yesterdayGame,
      opponent,
      dayOfWeek,
      gameState: todayGame.gameState,
    };
  } catch (e) {
    console.error(`Failed to get game context for ${teamAbbrev}:`, e);
    return null;
  }
}

/**
 * Compute all curses for a single team
 * @param {string} teamAbbrev
 * @param {Object|null} gameContext - Optional game context for relevance filtering
 * @returns {Promise<Array<{ id, category, value, formatted, severity, isRelevant }>>}
 */
export async function computeCursesForTeam(teamAbbrev, gameContext = null) {
  try {
    const rawGames = await fetchTeamSchedule(teamAbbrev);
    const games = getCompletedGames(rawGames);

    if (games.length < 10) {
      // Not enough data for meaningful stats
      return [];
    }

    const curses = [];
    const allResults = []; // Track all results for fallback

    for (const template of curseTemplates) {
      try {
        const result = template.compute(games);
        const isCursed = template.isCursed(result);
        const severity = template.severity(result);
        const isRelevant = template.relevantFor ? template.relevantFor(gameContext) : true;

        const curseData = {
          id: template.id,
          category: template.category,
          value: result.value,
          evidence: result.evidence || [],
          formatted: template.format(result, teamAbbrev),
          severity: Math.max(0, severity), // Ensure non-negative
          isCursed,
          isRelevant,
        };

        allResults.push(curseData);

        if (isCursed) {
          curses.push(curseData);
        }
      } catch (e) {
        // Skip templates that fail
        console.warn(`Curse template ${template.id} failed for ${teamAbbrev}:`, e);
      }
    }

    // If no curses meet threshold, return the most severe one as "closest to cursed"
    if (curses.length === 0 && allResults.length > 0) {
      const mostSevere = allResults.sort((a, b) => b.severity - a.severity)[0];
      // Mark it as a near-miss
      mostSevere.formatted = mostSevere.formatted + ' (closest to cursed)';
      return [mostSevere];
    }

    // Sort by severity (most embarrassing first)
    return curses.sort((a, b) => b.severity - a.severity);
  } catch (e) {
    console.error(`Failed to compute curses for ${teamAbbrev}:`, e);
    return [];
  }
}

/**
 * Compute curses for a team with relevance separation
 * @param {string} teamAbbrev
 * @returns {Promise<{ relevant: Array, other: Array, gameContext: Object|null, allCurses: Array }>}
 */
export async function computeCursesWithContext(teamAbbrev) {
  const gameContext = await getTodayGameContext(teamAbbrev);
  const curses = await computeCursesForTeam(teamAbbrev, gameContext);

  const relevant = curses.filter(c => c.isRelevant);
  const other = curses.filter(c => !c.isRelevant);

  return {
    relevant,
    other,
    gameContext,
    allCurses: curses,
  };
}

/**
 * Compute curses for multiple teams
 * @param {Array<string>} teamAbbrevs
 * @returns {Promise<Map<string, Array>>}
 */
export async function computeCursesForTeams(teamAbbrevs) {
  const results = new Map();

  // Fetch in parallel for speed
  const promises = teamAbbrevs.map(async (abbrev) => {
    const curses = await computeCursesForTeam(abbrev);
    return { abbrev, curses };
  });

  const settled = await Promise.all(promises);

  for (const { abbrev, curses } of settled) {
    results.set(abbrev, curses);
  }

  return results;
}

/**
 * Get the single worst curse for a team (for card display)
 * @param {string} teamAbbrev
 * @returns {Promise<{ formatted: string, severity: number } | null>}
 */
export async function getWorstCurse(teamAbbrev) {
  const curses = await computeCursesForTeam(teamAbbrev);
  return curses.length > 0 ? curses[0] : null;
}
