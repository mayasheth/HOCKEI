/**
 * Team Stats Card - Intel Dossier style
 */

/**
 * Create severity pips HTML
 * @param {number} severity - 1-5
 * @returns {string}
 */
function createSeverityPips(severity) {
  let pips = '';
  for (let i = 1; i <= 5; i++) {
    pips += `<div class="severity-pip${i <= severity ? ' active' : ''}"></div>`;
  }
  return pips;
}

/**
 * Create a single stat row with optional evidence
 * @param {Object} curse
 * @param {string} curseId - unique ID for this curse
 * @returns {string}
 */
function createStatRow(curse, curseId) {
  const hasEvidence = curse.evidence && curse.evidence.length > 0;

  const evidenceHtml = hasEvidence ? `
    <div id="${curseId}" class="stat-evidence">
      <div class="stat-evidence-inner">
        <div class="stat-evidence-content">
          ${curse.evidence.map((g) => {
            const resultLabel = g.isLoss ? 'L' : g.isWin ? 'W' : 'OTL';
            const oppAbbrev = g.isHome ? g.awayTeam?.abbrev : g.homeTeam?.abbrev;
            return `
            <div class="evidence-row">
              <span class="evidence-date">${new Date(g.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              <span class="evidence-result">
                ${g.isHome ? 'vs' : '@'} ${oppAbbrev}
                <span class="evidence-score${g.isLoss ? ' loss' : ''}">${g.teamScore}</span>-<span class="evidence-score opp">${g.oppScore}</span>
                <span class="evidence-label${g.isLoss ? ' loss' : ''}">${resultLabel}</span>
              </span>
            </div>
          `}).join('')}
        </div>
      </div>
    </div>
  ` : '';

  return `
    <div class="stat-row${hasEvidence ? '' : ' no-evidence'}" ${hasEvidence ? `data-target="${curseId}"` : ''}>
      <span class="stat-text">${curse.formatted}</span>
      <div class="stat-severity">
        ${createSeverityPips(curse.severity)}
      </div>
      ${hasEvidence ? `
        <svg class="stat-expand" viewBox="0 0 12 12" fill="none" stroke="currentColor">
          <path d="M2 4 L6 8 L10 4" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      ` : ''}
    </div>
    ${evidenceHtml}
  `;
}

/**
 * Create a team stats card (Intel Dossier style)
 * @param {string} teamAbbrev
 * @param {string} teamName
 * @param {Object} cursesData - { relevant, other, gameContext, allCurses }
 * @returns {string}
 */
export function createTeamStatsCard(teamAbbrev, teamName, cursesData) {
  const { relevant, other, gameContext, allCurses } = cursesData;
  const cardId = `dossier-${teamAbbrev}-${Date.now()}`;
  const isPlayingToday = gameContext !== null;

  // Build game context
  let contextHtml = '';
  if (isPlayingToday) {
    const location = gameContext.isHome ? 'vs' : '@';
    const b2bBadge = gameContext.isBackToBack
      ? '<span class="dossier-badge">B2B</span>'
      : '';
    contextHtml = `
      <span>Today ${location} ${gameContext.opponent}</span>
      ${b2bBadge}
    `;
  } else {
    contextHtml = `<span>Not playing today</span>`;
  }

  // Build relevant stats section (for teams playing today)
  let relevantStatsHtml = '';
  if (isPlayingToday && relevant.length > 0) {
    relevantStatsHtml = `
      <div class="dossier-stats">
        <div class="dossier-stat-group">
          <div class="dossier-stat-label">Relevant to tonight</div>
          ${relevant.map((c, i) => createStatRow(c, `${cardId}-rel-${i}`)).join('')}
        </div>
      </div>
    `;
  } else if (isPlayingToday && relevant.length === 0 && allCurses.length > 0) {
    relevantStatsHtml = `
      <div class="no-stats-msg">No stats relevant to today's game</div>
    `;
  }

  // Determine "see more" content
  const seeMoreCurses = isPlayingToday ? other : allCurses;
  const hasSeeMore = seeMoreCurses.length > 0;
  const seeMoreCount = seeMoreCurses.length;
  const seeMoreLabel = isPlayingToday
    ? `${seeMoreCount} more stat${seeMoreCount > 1 ? 's' : ''}`
    : `See ${seeMoreCount} stat${seeMoreCount > 1 ? 's' : ''}`;

  // Build "see more" section
  let seeMoreHtml = '';
  if (hasSeeMore) {
    seeMoreHtml = `
      <div class="dossier-toggle" data-target="${cardId}-more">
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor">
          <path d="M2 4 L6 8 L10 4" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <span>${seeMoreLabel}</span>
      </div>
      <div id="${cardId}-more" class="dossier-more">
        <div class="dossier-more-inner">
          <div class="dossier-more-content">
            ${seeMoreCurses.map((c, i) => createStatRow(c, `${cardId}-more-${i}`)).join('')}
          </div>
        </div>
      </div>
    `;
  } else if (!isPlayingToday && allCurses.length === 0) {
    seeMoreHtml = `<div class="no-stats-msg">No stats found</div>`;
  }

  return `
    <div class="dossier-card">
      <div class="dossier-header">
        <div class="dossier-logo">
          <img src="/logos/${teamAbbrev.toLowerCase()}.png" alt="${teamName}" />
        </div>
        <div class="dossier-info">
          <div class="dossier-name">${teamName}</div>
          <div class="dossier-context">
            ${contextHtml}
          </div>
        </div>
      </div>
      ${relevantStatsHtml}
      ${seeMoreHtml}
    </div>
  `;
}
