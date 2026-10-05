// Skater-trail drawings from NHL goal tracking: skaters in ink, the puck as two side-by-side
// stripes in the rival's colours. Paths are in rink inches (2400 x 1020), scoring net on the right.
import { inks } from "../teams.js";

const NS = "http://www.w3.org/2000/svg";
export const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Quadratic smoothing through midpoints keeps the real path but loses the 5 fps stair-steps.
function smooth(pts) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += `Q${pts[i][0]} ${pts[i][1]} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  const l = pts[pts.length - 1];
  return d + `L${l[0]} ${l[1]}`;
}
// Offset a polyline sideways by d drawing units, for the two-colour stripe.
function offset(pts, d) {
  return pts.map((p, k) => {
    const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    return [Math.round(p[0] - (dy / L) * d), Math.round(p[1] + (dx / L) * d)];
  });
}
// Crop to the play: from just behind the earliest puck position to the end boards.
export function frameBox(tracks) {
  let x0 = 2400;
  tracks.forEach((g) => g && g.puck.forEach(([x]) => (x0 = Math.min(x0, x))));
  x0 = Math.max(0, Math.min(x0 - 80, 1440));
  return [x0, 0, 2420 - x0, 1020];
}
// Blue line, corner boards (28 ft radius), goal line, crease, net.
const RINK = `<g class="rink" aria-hidden="true"><path d="M1500 0V1020"/><path d="M1200 0H2064A336 336 0 0 1 2400 336V684A336 336 0 0 1 2064 1020H1200"/><path d="M2268 69V951"/><path d="M2268 438A72 72 0 0 0 2268 582"/><path class="net" d="M2268 474H2308V546H2268"/></g>`;

const trackCache = new Map();
// Tracking appears a few minutes after a goal; a miss is retried on the next request.
export function loadTrack(ppt, rival) {
  if (!ppt) return Promise.resolve(null);
  const key = `${ppt}|${rival}`;
  if (!trackCache.has(key)) {
    const p = fetch(`/api/tracks?u=${encodeURIComponent(ppt)}&r=${rival}`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((t) => { if (!t) trackCache.delete(key); return t; });
    trackCache.set(key, p);
  }
  return trackCache.get(key);
}

export class GoalDrawing {
  // inkPair overrides the puck's two colours (a favorite scoring on a rival uses one of each).
  constructor(rival, label, inkPair) {
    this.rival = rival;
    this.inkPair = inkPair;
    this.track = null;
    this.f = 0;
    this.el = document.createElementNS(NS, "svg");
    this.el.setAttribute("role", "img");
    this.el.setAttribute("aria-label", label);
    this.setBox([1440, 0, 980, 1020]);
    this.el.innerHTML = RINK + "<g></g>";
    this.layer = this.el.lastChild;
  }
  setBox(box) { this.box = box; this.el.setAttribute("viewBox", box.join(" ")); }
  setTrack(track, box) { this.track = track; this.setBox(box || frameBox([track])); this.el.classList.toggle("pending", !track); }
  // Draw up to fraction f of the 14 seconds; everyone on the ice advances together.
  draw(f) {
    this.f = f;
    if (!this.track) { this.layer.innerHTML = ""; return; }
    const cut = (pts) => pts.slice(0, Math.max(2, Math.round(pts.length * f)));
    const unit = this.box[2] / (this.el.clientWidth || 300);
    const [a, b] = this.inkPair || inks(this.rival), o = 1.2 * unit, puck = cut(this.track.puck);
    let html = "";
    this.track.rival.forEach((p) => (html += `<path class="trk def" d="${smooth(cut(p))}"/>`));
    this.track.opp.forEach((p) => (html += `<path class="trk att" d="${smooth(cut(p))}"/>`));
    html += `<path class="trk puck" style="stroke:${a}" d="${smooth(offset(puck, -o))}"/><path class="trk puck" style="stroke:${b}" d="${smooth(offset(puck, o))}"/>`;
    if (f >= 1) {
      const e = this.track.puck[this.track.puck.length - 1];
      html += `<circle class="endpt" style="fill:${a};stroke:${b}" cx="${e[0]}" cy="${e[1]}" r="${Math.round(this.box[2] * 0.012)}"/>`;
    }
    this.layer.innerHTML = html;
  }
  play(ms = 2200, delay = 0) {
    return new Promise((res) => {
      if (reduceMotion() || !this.track) { this.draw(1); return res(); }
      this.draw(0);
      setTimeout(() => {
        const t0 = performance.now();
        const step = (now) => { const f = Math.min(1, (now - t0) / ms); this.draw(f); f < 1 ? requestAnimationFrame(step) : res(); };
        requestAnimationFrame(step);
      }, delay);
    });
  }
}

export function onceVisible(el, fn) {
  const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); fn(); } }, { threshold: 0.15 });
  io.observe(el);
}
