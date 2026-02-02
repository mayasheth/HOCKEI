/**
 * Team Stats Card - renders curse stats for a team
 */

import { getTeamColors } from '../teamColors.js';

/**
 * Create a single curse item HTML
 * @param {Object} curse
 * @param {string} curseId - unique ID for this curse
 * @returns {string}
 */
function createCurseItem(curse, curseId) {
  const severityBars = '\u2588'.repeat(curse.severity) + '\u2591'.repeat(5 - curse.severity);
  const hasEvidence = curse.evidence && curse.evidence.length > 0;

  return `
    <div class="rounded-lg overflow-hidden" style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-subtle);">
      <div class="p-2 flex items-center justify-between ${hasEvidence ? 'cursor-pointer evidence-toggle' : ''}" data-target="${curseId}">
        <span class="text-sm" style="color: var(--text-primary);">${curse.formatted}</span>
        <div class="flex items-center gap-2">
          <span class="text-xs font-mono" style="color: var(--accent-red);" title="Severity: ${curse.severity}/5">${severityBars}</span>
          ${hasEvidence ? `<svg class="toggle-arrow" width="10" height="10" viewBox="0 0 12 12" fill="currentColor" style="color: var(--text-muted);">
            <path d="M2 4 L6 8 L10 4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>` : ''}
        </div>
      </div>
      ${hasEvidence ? `
      <div id="${curseId}" class="evidence-panel border-t" style="border-color: var(--border-subtle);">
        <div>
          <div class="p-2 space-y-1" style="max-height: 200px; overflow-y: auto;">
            ${curse.evidence.map((g) => `
              <div class="flex justify-between text-xs py-1 px-2 rounded" style="background: rgba(0,0,0,0.3);">
                <span style="color: var(--text-secondary);">${new Date(g.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                <span style="color: ${g.isLoss ? 'var(--accent-red)' : 'var(--text-muted)'};">
                  ${g.isHome ? 'vs' : '@'} ${g.isHome ? g.awayTeam?.abbrev : g.homeTeam?.abbrev}
                  ${g.teamScore}-${g.oppScore} ${g.isLoss ? 'L' : g.isWin ? 'W' : 'OTL'}
                </span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      ` : ''}
    </div>
  `;
}

/**
 * Create a team stats card
 * @param {string} teamAbbrev
 * @param {string} teamName
 * @param {Object} cursesData - { relevant, other, gameContext, allCurses }
 * @returns {string}
 */
export function createTeamStatsCard(teamAbbrev, teamName, cursesData) {
  const { relevant, other, gameContext, allCurses } = cursesData;
  const colors = getTeamColors(teamAbbrev);
  const cardId = `team-${teamAbbrev}-${Date.now()}`;
  const isPlayingToday = gameContext !== null;

  // Build game context header
  let contextHeader = '';
  if (isPlayingToday) {
    const location = gameContext.isHome ? 'vs' : '@';
    const b2bBadge = gameContext.isBackToBack
      ? '<span class="text-xs px-1.5 py-0.5 rounded" style="background: var(--accent-red); color: white;">B2B</span>'
      : '';
    contextHeader = `
      <div class="flex items-center gap-2 text-xs" style="color: var(--text-muted);">
        <span>Today ${location} ${gameContext.opponent}</span>
        ${b2bBadge}
      </div>
    `;
  } else {
    contextHeader = `<span class="text-xs" style="color: var(--text-muted);">Not playing today</span>`;
  }

  // Build curses sections
  const relevantCursesHtml = relevant.length > 0
    ? relevant.map((c, i) => createCurseItem(c, `${cardId}-rel-${i}`)).join('')
    : '';

  const otherCursesHtml = other.length > 0
    ? other.map((c, i) => createCurseItem(c, `${cardId}-other-${i}`)).join('')
    : '';

  // For teams not playing today, show all curses in the "see more" section
  const allCursesHtml = !isPlayingToday && allCurses.length > 0
    ? allCurses.map((c, i) => createCurseItem(c, `${cardId}-all-${i}`)).join('')
    : '';

  // Determine if we need a "see more" section
  const hasSeeMore = isPlayingToday ? other.length > 0 : allCurses.length > 0;
  const seeMoreCount = isPlayingToday ? other.length : allCurses.length;

  return `
    <div class="card p-4" style="--glow-color: ${colors.primary}; border-left: 3px solid ${colors.primary};">
      <!-- Header -->
      <div class="flex items-center gap-3 mb-3">
        <img src="/logos/${teamAbbrev.toLowerCase()}.png" alt="${teamName}" class="w-10 h-10 object-contain" />
        <div class="flex-1">
          <p class="font-semibold" style="color: var(--text-primary);">${teamName}</p>
          ${contextHeader}
        </div>
      </div>

      <!-- Relevant Curses (shown expanded for teams playing today) -->
      ${isPlayingToday && relevant.length > 0 ? `
        <div class="space-y-2 mb-3">
          <p class="text-xs uppercase tracking-wider" style="color: var(--accent-red);">Relevant to today</p>
          ${relevantCursesHtml}
        </div>
      ` : ''}

      ${isPlayingToday && relevant.length === 0 && allCurses.length > 0 ? `
        <p class="text-sm mb-3" style="color: var(--text-muted);">No stats relevant to today's game</p>
      ` : ''}

      ${!isPlayingToday && allCurses.length === 0 ? `
        <p class="text-sm" style="color: var(--text-muted);">No curses found</p>
      ` : ''}

      <!-- See More Toggle -->
      ${hasSeeMore ? `
        <button class="see-more-toggle w-full text-left flex items-center gap-2 py-2 text-sm" data-target="${cardId}-more" style="color: var(--text-secondary);">
          <svg class="toggle-arrow-more" width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
            <path d="M2 4 L6 8 L10 4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>${isPlayingToday ? `${seeMoreCount} more stat${seeMoreCount > 1 ? 's' : ''}` : `See ${seeMoreCount} stat${seeMoreCount > 1 ? 's' : ''}`}</span>
        </button>
        <div id="${cardId}-more" class="see-more-panel">
          <div>
            <div class="space-y-2 pt-2">
              ${isPlayingToday ? otherCursesHtml : allCursesHtml}
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}
