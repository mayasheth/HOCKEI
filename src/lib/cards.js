/**
 * Card components for the feed
 */

import { getTeamColors, accentRed } from './teamColors.js';

/**
 * Format shot type for display
 * @param {string|null} shotType
 * @returns {string|null}
 */
function formatShotType(shotType) {
  if (!shotType) return null;
  // Remove hyphens and remove "shot" suffix
  return shotType.replace(/-/g, ' ').replace(/\s*shot$/i, '');
}

/**
 * Create a Goal Against card
 * @param {Object} event
 * @returns {string} HTML string
 */
export function createGoalCard(event) {
  const rivalColors = getTeamColors(event.teamAbbreviation);
  const shotTypeDisplay = formatShotType(event.shotType);

  return `
    <div class="card goal-card overflow-hidden" style="border-left: 3px solid ${rivalColors.primary};">
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
 * Create a Loss/Defeated card
 * @param {Object} event
 * @returns {string} HTML string
 */
export function createLossCard(event) {
  const rivalColors = getTeamColors(event.teamAbbreviation);

  return `
    <div class="card loss-card overflow-hidden" style="border-left: 3px solid ${rivalColors.primary};">
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
    <div class="flex items-center gap-3 py-2">
      <div class="h-px flex-1" style="background-color: rgba(255,255,255,0.1);"></div>
      <span class="text-xs font-medium tracking-wider" style="color: var(--text-muted);">${dateStr}</span>
      <div class="h-px flex-1" style="background-color: rgba(255,255,255,0.1);"></div>
    </div>
  `;
}
