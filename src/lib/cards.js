/**
 * Card components for the feed
 * Supports both legacy feed style and new glass UI style
 */

import { getTeamColors, accentRed } from './teamColors.js';

/**
 * Format shot type for display
 * @param {string|null} shotType
 * @returns {string|null}
 */
function formatShotType(shotType) {
  if (!shotType) return null;
  return shotType.replace(/-/g, ' ').replace(/\s*shot$/i, '');
}

/**
 * Format game date for display
 * Shows "Today", "Yesterday", or the date
 * @param {string} timestamp
 * @returns {string}
 */
function formatGameDate(timestamp) {
  const gameDate = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reset times to compare just dates
  const gameDateOnly = new Date(gameDate.getFullYear(), gameDate.getMonth(), gameDate.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  if (gameDateOnly.getTime() === todayOnly.getTime()) {
    return 'Today';
  } else if (gameDateOnly.getTime() === yesterdayOnly.getTime()) {
    return 'Yesterday';
  } else {
    return gameDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }
}

/**
 * Get team color CSS variables for inline styles
 */
function getTeamColorVars(abbrev) {
  const colors = getTeamColors(abbrev);
  return {
    primary: colors.primary,
    dim: `${colors.primary}1a`, // ~10% opacity
    glow: `${colors.primary}40`, // ~25% opacity
  };
}

/**
 * Generate a random animation delay for glitch effects
 * @returns {string} CSS animation-delay value
 */
function randomGlitchDelay() {
  // Random delay between 0 and 8 seconds to desync animations
  return `${(Math.random() * 8).toFixed(2)}s`;
}

// =============================================
// GLASS UI CARDS (new symmetric design)
// =============================================

/**
 * Create a Goal Against card (Glass UI)
 * @param {Object} event
 * @param {boolean} isNew - Whether this is a new card (for animation)
 * @returns {string} HTML string
 */
export function createGoalCardGlass(event, isNew = false) {
  const colors = getTeamColorVars(event.teamAbbreviation);
  const shotTypeDisplay = formatShotType(event.shotType);
  const animClass = isNew ? ' card-slam' : '';
  const glitchDelay = randomGlitchDelay();

  return `
    <div class="goal-card-glass${animClass}" data-event-id="${event.id}" data-team="${event.teamAbbreviation}"
         style="--team-color: ${colors.primary}; --team-color-dim: ${colors.dim}; --team-color-glow: ${colors.glow};">
      <div class="goal-bar"></div>
      <div class="goal-glow"></div>
      <div class="goal-body">
        <div class="goal-header">
          <span class="glitch-wrapper glitch-moderate" style="--glitch-img: url('/logos/${event.teamAbbreviation.toLowerCase()}.png'); --glitch-delay: ${glitchDelay};">
            <img src="/logos/${event.teamAbbreviation.toLowerCase()}.png"
                 alt="${event.teamName}"
                 class="goal-victim-logo" />
          </span>
          <span class="goal-label">GOAL AGAINST ${event.teamAbbreviation}</span>
        </div>
        <div class="goal-meta-row">
          <span class="goal-period">${event.period} ${event.timeInPeriod}</span>
          ${event.strength && event.strength !== 'ev' ? `
            <span class="goal-badge ${event.strength}">${event.strength === 'pp' ? 'PP' : event.strength === 'sh' ? 'SHG' : event.strength.toUpperCase()}</span>
          ` : ''}
        </div>
        <div class="goal-scorer-row">
          <img src="/logos/${event.opponentAbbreviation.toLowerCase()}.png" alt="" class="goal-scorer-logo" />
          <span class="goal-scorer-name">${event.scorerName}</span>
          ${shotTypeDisplay ? `<span class="goal-shot-type">${shotTypeDisplay}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Create a Loss/Defeated card (Glass UI)
 * @param {Object} event
 * @param {boolean} isNew - Whether this is a new card (for animation)
 * @returns {string} HTML string
 */
export function createLossCardGlass(event, isNew = false) {
  const colors = getTeamColorVars(event.teamAbbreviation);
  const animClass = isNew ? ' card-slam-heavy' : '';
  const showStreak = event.losingStreak > 2;
  const glitchDelay = randomGlitchDelay();

  return `
    <div class="loss-card-glass${animClass}" data-event-id="${event.id}" data-team="${event.teamAbbreviation}"
         style="--team-color: ${colors.primary}; --team-color-dim: ${colors.dim}; --team-color-glow: ${colors.glow};">
      <div class="loss-bar"></div>
      <div class="loss-glow"></div>
      <div class="loss-body">
        <div class="loss-label-row">
          <span class="loss-defeated">${event.teamAbbreviation} &middot; DEFEATED</span>
          <span class="loss-meta">Final</span>
        </div>
        <div class="loss-score-row">
          <div class="loss-team-side">
            <span class="glitch-wrapper glitch-extreme" style="--glitch-img: url('/logos/${event.teamAbbreviation.toLowerCase()}.png'); --glitch-delay: ${glitchDelay};">
              <img src="/logos/${event.teamAbbreviation.toLowerCase()}.png"
                   alt="${event.teamName}"
                   class="loss-team-logo loser" />
            </span>
            <span class="loss-team-abbrev">${event.teamAbbreviation}</span>
          </div>
          <div class="loss-score-center">
            <span class="loss-score-num loser mono">${event.rivalScore}</span>
            <span class="loss-score-sep">&mdash;</span>
            <span class="loss-score-num winner mono">${event.opponentScore}</span>
          </div>
          <div class="loss-team-side">
            <img src="/logos/${event.opponentAbbreviation.toLowerCase()}.png"
                 alt="${event.opponentName}"
                 class="loss-team-logo" />
            <span class="loss-team-abbrev">${event.opponentAbbreviation}</span>
          </div>
        </div>
        <div class="loss-divider"></div>
        <div class="loss-footer">
          <span class="loss-date">${formatGameDate(event.timestamp)}</span>
        </div>
      </div>
      ${showStreak ? `
        <div class="loss-streak-banner">${event.losingStreak} consecutive losses</div>
      ` : ''}
    </div>
  `;
}

// =============================================
// FEED CARDS (for drawer and mobile feed)
// =============================================

/**
 * Create a Goal Against card (Feed style - header strip design)
 * @param {Object} event
 * @param {boolean} isNew - Whether this is a new card (for animation)
 * @returns {string} HTML string
 */
export function createGoalCardFeed(event, isNew = false) {
  const colors = getTeamColorVars(event.teamAbbreviation);
  const shotTypeDisplay = formatShotType(event.shotType);
  const animClass = isNew ? ' card-enter' : '';
  const isSHG = event.strength === 'sh';
  const isPP = event.strength === 'pp';

  return `
    <div class="goal-card-feed${animClass}" data-event-id="${event.id}" data-team="${event.teamAbbreviation}"
         style="--team-color: ${colors.primary}; --team-color-dim: ${colors.dim};">
      <div class="feed-header-strip">
        <span class="feed-header-label">
          <span class="feed-header-team">${event.teamAbbreviation}</span>
          <span class="feed-header-dot">·</span>
          <span class="feed-header-type">GOAL AGAINST</span>
        </span>
        <div class="feed-header-right">
          ${isSHG ? `<span class="feed-header-badge sh">SHG</span>` : ''}
          ${isPP ? `<span class="feed-header-badge pp">PP</span>` : ''}
          <span class="feed-header-meta">${event.period} ${event.timeInPeriod}</span>
        </div>
      </div>
      <div class="feed-card-body">
        <div class="feed-goal-content">
          <img src="/logos/${event.teamAbbreviation.toLowerCase()}.png"
               alt="${event.teamName}"
               class="feed-victim-logo" />
          <div class="feed-goal-info">
            <div class="feed-scorer-line">
              <span class="feed-scorer-name">${event.scorerName}</span>
              <img src="/logos/${event.opponentAbbreviation.toLowerCase()}.png" alt="" class="feed-scorer-logo" />
            </div>
            ${shotTypeDisplay ? `<span class="feed-shot-type">${shotTypeDisplay}</span>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Create a Loss/Defeated card (Feed style - header strip design)
 * @param {Object} event
 * @param {boolean} isNew - Whether this is a new card (for animation)
 * @returns {string} HTML string
 */
export function createLossCardFeed(event, isNew = false) {
  const colors = getTeamColorVars(event.teamAbbreviation);
  const animClass = isNew ? ' card-enter' : '';
  const showStreak = event.losingStreak > 2;

  return `
    <div class="loss-card-feed${animClass}${showStreak ? ' has-streak' : ''}" data-event-id="${event.id}" data-team="${event.teamAbbreviation}"
         style="--team-color: ${colors.primary}; --team-color-dim: ${colors.dim};">
      <div class="feed-header-strip">
        <span class="feed-header-label">
          <span class="feed-header-team">${event.teamAbbreviation}</span>
          <span class="feed-header-dot">·</span>
          <span class="feed-header-type">DEFEATED</span>
        </span>
        <span class="feed-header-meta">Final</span>
      </div>
      <div class="feed-card-body">
        <div class="feed-score-row">
          <div class="feed-team-side">
            <img src="/logos/${event.teamAbbreviation.toLowerCase()}.png"
                 alt="${event.teamName}"
                 class="feed-team-logo loser" />
            <span class="feed-team-abbrev">${event.teamAbbreviation}</span>
          </div>
          <div class="feed-score-center">
            <span class="feed-score-num loser">${event.rivalScore}</span>
            <span class="feed-score-sep">–</span>
            <span class="feed-score-num winner">${event.opponentScore}</span>
          </div>
          <div class="feed-team-side">
            <img src="/logos/${event.opponentAbbreviation.toLowerCase()}.png"
                 alt="${event.opponentName}"
                 class="feed-team-logo" />
            <span class="feed-team-abbrev">${event.opponentAbbreviation}</span>
          </div>
        </div>
      </div>
      ${showStreak ? `
        <div class="feed-streak-strip">
          <span class="feed-streak-text">${event.losingStreak} CONSECUTIVE LOSSES</span>
        </div>
      ` : ''}
    </div>
  `;
}

// =============================================
// LEGACY CARDS (existing feed style)
// =============================================

/**
 * Create a Goal Against card (Legacy)
 * @param {Object} event
 * @param {boolean} isNew - Whether this is a new card (for animation)
 * @returns {string} HTML string
 */
export function createGoalCard(event, isNew = false) {
  const rivalColors = getTeamColors(event.teamAbbreviation);
  const shotTypeDisplay = formatShotType(event.shotType);
  const animClass = isNew ? ' card-enter' : '';

  return `
    <div class="card goal-card-legacy${animClass} overflow-hidden" data-event-id="${event.id}" style="border-left: 3px solid ${rivalColors.primary};">
      <!-- Header bar -->
      <div class="flex items-center justify-between px-4 py-2" style="background: ${rivalColors.primary}10; border-bottom: 1px solid ${rivalColors.primary}20;">
        <span class="text-sm tracking-wider uppercase">
          <span class="headline font-bold" style="color: ${rivalColors.primary};">${event.teamAbbreviation}</span>
          <span style="color: var(--text-muted);"> • Goal Against</span>
        </span>
        <div class="flex items-center gap-2">
          <span class="text-xs" style="color: var(--text-muted);">${event.period} ${event.timeInPeriod}</span>
          ${event.strength && event.strength !== 'ev' ? `
            <span class="text-xs px-1.5 py-0.5 rounded uppercase font-semibold"
              style="background: ${event.strength === 'sh' ? `linear-gradient(135deg, ${accentRed}, #c62828)` : 'rgba(255,255,255,0.1)'}; color: white;">
              ${event.strength === 'pp' ? 'PP' : event.strength === 'sh' ? 'SHG' : event.strength.toUpperCase()}
            </span>
          ` : ''}
        </div>
      </div>
      <!-- Body -->
      <div class="p-4">
        <div class="flex items-center gap-4">
          <!-- Rival logo (victim) - large with team color underglow -->
          <div class="relative flex-shrink-0">
            <div class="absolute inset-0 rounded-full" style="background: radial-gradient(circle, ${rivalColors.primary}50 0%, transparent 70%); filter: blur(12px); transform: translateY(4px);"></div>
            <img
              src="/logos/${event.teamAbbreviation.toLowerCase()}.png"
              alt="${event.teamName}"
              class="relative w-14 h-14 object-contain"
              style="opacity: 0.6; filter: saturate(0.7);"
            />
          </div>
          <!-- Arrows pointing at rival -->
          <div class="flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="${accentRed}"><polygon points="10,0 10,10 0,5"/></svg>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="${accentRed}"><polygon points="10,0 10,10 0,5"/></svg>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="${accentRed}"><polygon points="10,0 10,10 0,5"/></svg>
          </div>
          <!-- Scorer info -->
          <div class="flex items-center gap-2">
            <img
              src="/logos/${event.opponentAbbreviation.toLowerCase()}.png"
              alt="${event.opponentName}"
              class="w-6 h-6 object-contain"
            />
            <div>
              <p class="text-sm font-medium" style="color: var(--text-primary);">${event.scorerName}</p>
              <p class="text-xs" style="color: var(--text-muted);">${shotTypeDisplay || ''}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Create a Loss/Defeated card (Legacy)
 * @param {Object} event
 * @param {boolean} isNew - Whether this is a new card (for animation)
 * @returns {string} HTML string
 */
export function createLossCard(event, isNew = false) {
  const rivalColors = getTeamColors(event.teamAbbreviation);
  const animClass = isNew ? ' card-enter' : '';
  const showStreak = event.losingStreak > 2;

  return `
    <div class="card loss-card-legacy${animClass} overflow-hidden" data-event-id="${event.id}" style="--glow-color: ${rivalColors.primary}; border-left: 3px solid ${rivalColors.primary};">
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-2" style="background: ${rivalColors.primary}10; border-bottom: 1px solid ${rivalColors.primary}20;">
        <span class="text-sm tracking-wider uppercase">
          <span class="headline font-bold" style="color: ${rivalColors.primary};">${event.teamAbbreviation}</span>
          <span style="color: var(--text-muted);"> • Defeated</span>
        </span>
        <span class="text-xs" style="color: var(--text-muted);">Final</span>
      </div>
      <!-- Body -->
      <div class="p-5">
        <div class="flex items-center justify-between">
          <img
            src="/logos/${event.teamAbbreviation.toLowerCase()}.png"
            alt="${event.teamName}"
            class="w-14 h-14 object-contain"
            style="opacity: 0.35; filter: saturate(0.5) grayscale(0.3);"
          />
          <div class="flex items-center gap-3">
            <span class="headline text-3xl font-bold tabular-nums" style="color: var(--text-muted);">${event.rivalScore}</span>
            <div class="flex items-center">
              <svg width="20" height="20" viewBox="0 0 10 10" fill="${accentRed}"><polygon points="10,0 10,10 0,5"/></svg>
            </div>
            <span class="headline text-3xl font-bold tabular-nums" style="color: var(--text-primary);">${event.opponentScore}</span>
          </div>
          <img
            src="/logos/${event.opponentAbbreviation.toLowerCase()}.png"
            alt="${event.opponentName}"
            class="w-14 h-14 object-contain"
          />
        </div>
      </div>
      ${showStreak ? `
      <!-- Losing Streak -->
      <div class="px-4 py-2 text-center" style="background: ${rivalColors.primary}10; border-top: 1px solid ${rivalColors.primary}20;">
        <span class="text-xs font-semibold uppercase tracking-wider" style="color: ${rivalColors.primary};">
          ${event.losingStreak} straight losses for ${event.teamAbbreviation}
        </span>
      </div>
      ` : ''}
    </div>
  `;
}

/**
 * Create a day header divider
 * @param {string} dateStr
 * @returns {string} HTML string
 */
export function createDayHeader(dateStr) {
  return `
    <div class="day-divider">
      <div class="day-divider-line"></div>
      <span class="day-divider-text">${dateStr}</span>
      <div class="day-divider-line"></div>
    </div>
  `;
}
