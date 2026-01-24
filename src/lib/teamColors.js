/**
 * NHL team colors
 */

export const teamColors = {
  // Atlantic Division
  BOS: { primary: '#FFB81C', secondary: '#000000' },
  BUF: { primary: '#003087', secondary: '#FFB81C' },
  DET: { primary: '#CE1126', secondary: '#FFFFFF' },
  FLA: { primary: '#C8102E', secondary: '#041E42' },
  MTL: { primary: '#AF1E2D', secondary: '#192168' },
  OTT: { primary: '#C52032', secondary: '#000000' },
  TBL: { primary: '#002868', secondary: '#FFFFFF', darkMode: '#033ba3' },
  TOR: { primary: '#00205B', secondary: '#FFFFFF', darkMode: '#023ba6' },

  // Metropolitan Division
  CAR: { primary: '#CC0000', secondary: '#000000' },
  CBJ: { primary: '#002654', secondary: '#CE1126', darkMode: '#CE1126' },
  NJD: { primary: '#CE1126', secondary: '#000000' },
  NYI: { primary: '#00539B', secondary: '#F47D30', darkMode: '#F47D30' },
  NYR: { primary: '#0038A8', secondary: '#CE1126' },
  PHI: { primary: '#F74902', secondary: '#000000' },
  PIT: { primary: '#FCB514', secondary: '#000000' },
  WSH: { primary: '#C8102E', secondary: '#041E42' },

  // Central Division
  ARI: { primary: '#8C2633', secondary: '#E2D6B5' },
  UTA: { primary: '#6CACE3', secondary: '#FFFFFF' },
  CHI: { primary: '#CF0A2C', secondary: '#000000' },
  COL: { primary: '#6F263D', secondary: '#236192' },
  DAL: { primary: '#006847', secondary: '#8F8F8C' },
  MIN: { primary: '#154734', secondary: '#DDCBA4' },
  NSH: { primary: '#FFB81C', secondary: '#041E42' },
  STL: { primary: '#002F87', secondary: '#FCB514' },
  WPG: { primary: '#041E42', secondary: '#004C97', darkMode:'#004C97' },

  // Pacific Division
  ANA: { primary: '#F47A38', secondary: '#000000' },
  CGY: { primary: '#D2001C', secondary: '#FAAF19' },
  EDM: { primary: '#041E42', secondary: '#FF4C00', darkMode: '#FF4C00' },
  LAK: { primary: '#111111', secondary: '#A2AAAD', darkMode: '#A2AAAD' },
  SJS: { primary: '#006D75', secondary: '#000000' },
  SEA: { primary: '#001628', secondary: '#99D9D9', darkMode: '#99D9D9' },
  VAN: { primary: '#00205B', secondary: '#00843D', darkMode: '#023ba6' },
  VGK: { primary: '#B4975A', secondary: '#333F42' }
};

/**
 * Get team colors by abbreviation
 * Uses darkMode color as primary if available (for better contrast on dark backgrounds)
 * @param {string} abbreviation
 * @returns {{primary: string, secondary: string, originalPrimary?: string}}
 */
export function getTeamColors(abbreviation) {
  const colors = teamColors[abbreviation?.toUpperCase()] || { primary: '#666666', secondary: '#000000' };
  if (colors.darkMode) {
    return {
      primary: colors.darkMode,
      secondary: colors.secondary,
      originalPrimary: colors.primary
    };
  }
  return colors;
}

/**
 * Accent red color (energetic, sporty)
 */
export const accentRed = '#E53935';

/**
 * Muted accent red (for text, less saturated)
 */
export const accentRedMuted = '#C75050';
