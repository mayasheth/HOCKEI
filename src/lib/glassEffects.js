/**
 * Glass UI Effects — Impact animations, cracks, and screen shake
 */

/**
 * Generate SVG crack pattern
 * @param {boolean} heavy - More intense cracks for loss cards
 * @returns {string} SVG markup
 */
export function generateCrackSVG(heavy = false) {
  const numArms = heavy ? Math.floor(Math.random() * 5) + 10 : Math.floor(Math.random() * 4) + 6;
  const size = heavy ? 320 : 180;
  const half = size / 2;
  let paths = '';
  const mainColor = heavy ? 'rgba(210, 225, 240, 0.8)' : 'rgba(200, 215, 230, 0.5)';
  const branchColor = heavy ? 'rgba(200, 215, 230, 0.5)' : 'rgba(200, 215, 230, 0.3)';
  const fineColor = heavy ? 'rgba(200, 215, 230, 0.25)' : 'rgba(200, 215, 230, 0.15)';

  for (let i = 0; i < numArms; i++) {
    const angle = (Math.PI * 2 * i / numArms) + (Math.random() - 0.5) * 0.5;
    const length = (heavy ? 70 : 35) + Math.random() * (heavy ? 90 : 50);
    let d = `M ${half} ${half}`;
    let cx = half, cy = half;
    const segments = heavy ? Math.floor(Math.random() * 3) + 4 : Math.floor(Math.random() * 2) + 3;

    for (let s = 0; s < segments; s++) {
      const segLen = length / segments;
      const bend = (Math.random() - 0.5) * 0.4;
      cx += Math.cos(angle + bend) * segLen;
      cy += Math.sin(angle + bend) * segLen;
      d += ` L ${cx.toFixed(1)} ${cy.toFixed(1)}`;

      // Primary branches
      if (Math.random() > 0.35) {
        const bAngle = angle + (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.9);
        const bLen = 12 + Math.random() * (heavy ? 35 : 20);
        let bx = cx, by = cy;
        let bd = `M ${cx.toFixed(1)} ${cy.toFixed(1)}`;
        const bSegs = Math.floor(Math.random() * 2) + 1;
        for (let bs = 0; bs < bSegs; bs++) {
          bx += Math.cos(bAngle + (Math.random() - 0.5) * 0.3) * (bLen / bSegs);
          by += Math.sin(bAngle + (Math.random() - 0.5) * 0.3) * (bLen / bSegs);
          bd += ` L ${bx.toFixed(1)} ${by.toFixed(1)}`;
        }
        paths += `<path d="${bd}" fill="none" stroke="${branchColor}" stroke-width="${heavy ? '0.7' : '0.4'}" stroke-linecap="round"/>`;

        // Sub-branches
        if (heavy && Math.random() > 0.5) {
          const sAngle = bAngle + (Math.random() - 0.5) * 1.2;
          const sLen = 8 + Math.random() * 15;
          const sx = bx + Math.cos(sAngle) * sLen;
          const sy = by + Math.sin(sAngle) * sLen;
          paths += `<line x1="${bx.toFixed(1)}" y1="${by.toFixed(1)}" x2="${sx.toFixed(1)}" y2="${sy.toFixed(1)}" stroke="${fineColor}" stroke-width="0.4" stroke-linecap="round"/>`;
        }
      }
    }

    const strokeW = heavy ? (1.0 + Math.random() * 0.6) : (0.5 + Math.random() * 0.4);
    paths += `<path d="${d}" fill="none" stroke="${mainColor}" stroke-width="${strokeW.toFixed(1)}" stroke-linecap="round"/>`;
  }

  // Concentric ring cracks (heavy only)
  if (heavy) {
    for (let r = 15; r < 45; r += 12 + Math.random() * 10) {
      const arcStart = Math.random() * Math.PI * 2;
      const arcSpan = 0.5 + Math.random() * 1.5;
      const x1 = half + Math.cos(arcStart) * r;
      const y1 = half + Math.sin(arcStart) * r;
      const x2 = half + Math.cos(arcStart + arcSpan) * r;
      const y2 = half + Math.sin(arcStart + arcSpan) * r;
      paths += `<path d="M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}" fill="none" stroke="${fineColor}" stroke-width="0.5" stroke-linecap="round"/>`;
    }
  }

  // Central impact point
  paths += `<circle cx="${half}" cy="${half}" r="${heavy ? 5 : 3}" fill="rgba(220, 235, 250, ${heavy ? 0.6 : 0.35})"/>`;
  if (heavy) {
    paths += `<circle cx="${half}" cy="${half}" r="2" fill="rgba(240, 245, 255, 0.8)"/>`;
  }

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`;
}

/**
 * Create a crack effect at the given position
 * @param {number} x - Center X position
 * @param {number} y - Center Y position
 * @param {boolean} heavy - More intense for loss cards
 */
export function createCrack(x, y, heavy = false) {
  const layer = document.getElementById('crack-layer');
  if (!layer) return;

  const svg = generateCrackSVG(heavy);
  const size = heavy ? 320 : 180;
  const el = document.createElement('div');
  el.className = `crack-effect ${heavy ? 'heavy' : ''}`;
  el.innerHTML = svg;
  el.style.left = (x - size / 2) + 'px';
  el.style.top = (y - size / 2) + 'px';
  el.style.position = 'absolute';
  layer.appendChild(el);

  requestAnimationFrame(() => el.classList.add('active'));

  // Leave ghost after fade
  setTimeout(() => {
    el.classList.remove('active');
    el.classList.add('ghost');
  }, heavy ? 13000 : 10000);
}

/**
 * Create an impact flash effect
 * @param {number} x - Center X position
 * @param {number} y - Center Y position
 * @param {string} color - Team color (with alpha for glow)
 */
export function createFlash(x, y, color) {
  const layer = document.getElementById('flash-layer');
  if (!layer) return;

  const el = document.createElement('div');
  el.className = 'impact-flash';
  el.style.width = '200px';
  el.style.height = '200px';
  el.style.left = (x - 100) + 'px';
  el.style.top = (y - 100) + 'px';
  el.style.background = `radial-gradient(circle, ${color} 0%, transparent 70%)`;
  el.style.position = 'absolute';
  layer.appendChild(el);

  requestAnimationFrame(() => el.classList.add('active'));
  setTimeout(() => el.remove(), 500);
}

/**
 * Shake the screen
 * @param {boolean} heavy - More intense shake for loss cards
 */
export function shakeScreen(heavy = false) {
  const arena = document.getElementById('arena');
  if (!arena) return;

  arena.classList.remove('shake-light', 'shake-heavy');
  void arena.offsetWidth; // force reflow
  arena.classList.add(heavy ? 'shake-heavy' : 'shake-light');
  setTimeout(() => arena.classList.remove('shake-light', 'shake-heavy'), heavy ? 220 : 140);
}

/**
 * Full impact sequence for a card
 * @param {HTMLElement} cardEl - The card element
 * @param {boolean} isLoss - Whether this is a loss card (heavier effects)
 * @param {string} teamColorGlow - Team color with alpha for flash
 */
export function triggerImpact(cardEl, isLoss = false, teamColorGlow = 'rgba(100,100,100,0.4)') {
  const rect = cardEl.getBoundingClientRect();
  const impactX = rect.left + rect.width / 2;
  const impactY = rect.top + rect.height / 2;

  // 1. Screen shake
  shakeScreen(isLoss);

  // 2. Crack effect
  createCrack(impactX, impactY, isLoss);

  // 3. Color flash (loss only)
  if (isLoss) {
    createFlash(impactX, impactY, teamColorGlow);
  }
}

/**
 * Check if we're on mobile (for layout decisions)
 */
export function isMobile() {
  return window.innerWidth <= 600;
}
