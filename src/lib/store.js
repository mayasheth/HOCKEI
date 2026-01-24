/**
 * Client-side store for managing selected rivals
 * Uses localStorage for persistence
 */

const STORAGE_KEY = 'rival-watch-rivals';

/**
 * Get selected rivals from localStorage
 * @returns {Set<string>}
 */
export function getSelectedRivals() {
  if (typeof localStorage === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return new Set(JSON.parse(stored));
    }
  } catch {
    // Invalid stored data
  }
  return new Set();
}

/**
 * Save selected rivals to localStorage
 * @param {Set<string>} rivals
 */
export function saveSelectedRivals(rivals) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...rivals]));
}

/**
 * Toggle a rival selection
 * @param {string} abbreviation
 * @returns {Set<string>} - Updated set
 */
export function toggleRival(abbreviation) {
  const rivals = getSelectedRivals();
  if (rivals.has(abbreviation)) {
    rivals.delete(abbreviation);
  } else {
    rivals.add(abbreviation);
  }
  saveSelectedRivals(rivals);
  return rivals;
}

/**
 * Clear all selected rivals
 * @returns {Set<string>} - Empty set
 */
export function clearAllRivals() {
  const empty = new Set();
  saveSelectedRivals(empty);
  return empty;
}
