# HOCKEI Theme Concept: "Broadcast"
**Version:** 1.0
**Date:** February 2026

---

## Design Philosophy

### The Concept: Premium Sports Broadcast
Think ESPN's flagship graphics, not local news. The Athletic's editorial sophistication, not Bleacher Report clickbait. This is sports media for adults who appreciate good design.

The core insight: **Let team colors be the only chromatic elements.** The app itself becomes a neutral stage—a sophisticated broadcast set—where team colors are the stars. This solves the "32 different color schemes" problem elegantly.

### Emotional Tone
- **Confident, not aggressive** — We don't need to shout. The facts speak for themselves.
- **Knowing, not mean-spirited** — A raised eyebrow, not a pointed finger.
- **Premium, not flashy** — Quality materials, restrained ornamentation.
- **Dramatic through typography and composition** — Not through gimmicks.

---

## Color System

### Base Palette (Monochromatic Warmth)

```css
--bg-deep: #0a0a09;        /* Near-black with warm undertone */
--bg-surface: #141311;      /* Card/surface background */
--bg-elevated: #1c1a17;     /* Hover states, elevated surfaces */
--bg-spotlight: #242220;    /* Highlighted areas */

--text-primary: #f5f3ef;    /* Warm off-white */
--text-secondary: #a8a49c;  /* Muted warm gray */
--text-tertiary: #6b675f;   /* Very muted */

--border-subtle: rgba(245, 243, 239, 0.06);
--border-visible: rgba(245, 243, 239, 0.12);
```

### Why Warm Near-Black?
- Pure black (#000) is lifeless and creates harsh contrast
- The warm undertone feels like broadcast studio lighting
- Creates subtle depth that pure black lacks
- Harmonizes with the full spectrum of team colors

### Team Color Philosophy
- Team colors are the ONLY chromatic elements in the UI
- No app-wide accent color (no red, no blue)
- Team colors appear at full saturation on key moments
- Gradients and glows use team colors exclusively

---

## Typography

### Display: Bebas Neue
- All-caps, condensed, bold
- Classic sports broadcast/newspaper headline feel
- Used for: Loss announcements, big numbers, section headers

### Headlines: DM Sans (Bold/Semibold)
- Modern, geometric, highly readable
- Slight personality without being quirky
- Used for: Team names, card headers, nav

### Body: DM Sans (Regular/Medium)
- Clean and professional
- Excellent readability at small sizes
- Used for: Descriptions, stats, timestamps

### Monospace: JetBrains Mono
- For scores, time displays, stats
- Tabular figures for alignment
- Technical credibility

### Type Scale
```css
--text-hero: 4rem;      /* 64px - Big loss announcements */
--text-display: 2.5rem; /* 40px - Scores */
--text-headline: 1.5rem;/* 24px - Section titles */
--text-title: 1.125rem; /* 18px - Card headers */
--text-body: 0.9375rem; /* 15px - Body text */
--text-caption: 0.8125rem;/* 13px - Timestamps, labels */
--text-micro: 0.6875rem;/* 11px - Badges, tiny labels */
```

---

## Logo Concept

### Primary Mark: "H" Monogram
A bold, geometric "H" that references:
1. Hockey stick angles (the verticals have a subtle lean)
2. Scoreboard/LED display segments
3. Arena architecture

### Execution
- Constructed from thick strokes
- Optional: negative space forms a subtle "goal" shape
- Works as favicon at 16px
- Can be animated (segments light up)

### Wordmark
"HOCKEI" in Bebas Neue, tracked out
- The "I" at the end is slightly emphasized (different weight or subtle color)
- Nods to the playful acronym without being overt

### Lockup Options
1. **Monogram only** — For favicon, app icon, small spaces
2. **Wordmark only** — For nav bar
3. **Stacked** — Monogram above wordmark for larger applications

---

## Component Concepts

### Navigation Bar
- Frosted glass effect on scroll (subtle blur)
- Logo left, minimal text links right
- Active state: subtle underline that appears with team color of first selected rival
- No heavy borders, floats above content

### Loss Card (Primary Event)
```
┌─────────────────────────────────────────────────────┐
│ [TEAM COLOR GRADIENT BAR - full width, 4px]        │
├─────────────────────────────────────────────────────┤
│                                                     │
│   [Faded Logo]        2 — 5        [Bright Logo]   │
│      (large)         FINAL           (large)       │
│                                                     │
│   ─────────────────────────────────────────────    │
│                                                     │
│   DEFEATED                           Jan 28, 2026  │
│   [Team Name in team color]                        │
│                                                     │
│   [Losing streak banner if applicable]             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Key differences from current:
- Horizontal gradient bar at top (team color → transparent)
- Much larger score display (tabular mono)
- "DEFEATED" as dramatic label in Bebas Neue
- Team name in their color, not generic text
- More vertical breathing room

### Goal Against Card (Secondary Event)
```
┌─────────────────────────────────────────────────────┐
│ [Thin team color left border]                       │
│                                                     │
│  [Small logo] BOS • 2nd 14:32          [PP badge]  │
│                                                     │
│  Goal against: Pastrnak (wrist shot)               │
│  Assisted by Marchand, McAvoy                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

Key differences:
- More compact than loss cards (visual hierarchy)
- Left border instead of top bar (less prominent)
- Single-line information density

### Stats/Curse Card
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  [Logo] TORONTO MAPLE LEAFS                        │
│         Playing tonight vs BOS                      │
│                                                     │
│  ───────────────────────────────────────────────   │
│                                                     │
│  "0-6 in Saturday home games"                      │
│  [severity indicator: ████░]                       │
│                                                     │
│  "Haven't won after leading by 2+"                 │
│  [severity indicator: █████]                       │
│                                                     │
│  [+ 3 more stats]                                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Empty State
Large, centered, typographic moment:
```
         WATCHING

   [animated dot dot dot]

      No misfortune yet.
```

The word "WATCHING" in Bebas Neue, very large, with team colors subtly cycling through if multiple rivals selected.

---

## Motion Principles

### Entrance Choreography
- Cards enter with staggered delays (50ms between each)
- Subtle slide-up (8px) + fade, not scale
- Duration: 400ms with ease-out

### Live Game Indicator
- Subtle pulse on the team color elements
- Dot that breathes (opacity pulse, not size)

### Score Reveals (for live games)
- Numbers can "flip" like an old scoreboard
- Or: type-on effect, one digit at a time

### Hover States
- Subtle lift (translateY: -2px)
- Background lightens slightly
- No dramatic transforms

---

## Responsive Behavior

### Desktop (>768px)
- Max-width container (680px)
- Cards can have more horizontal information

### Mobile
- Full-width cards with 16px margins
- Stacked layouts where needed
- Touch targets minimum 44px

---

## Implementation Notes

### CSS Custom Properties
All colors, spacing, and type scales defined as CSS variables for easy theming and potential future "light mode" or alternative themes.

### Team Color Integration
```javascript
// Team colors used for:
// 1. Top gradient bar on loss cards
// 2. Left border on goal cards
// 3. Team name text color
// 4. Glow effects
// 5. Severity indicators
```

### Performance
- Prefer CSS animations over JS
- Use `will-change` sparingly
- Lazy load team logos below fold

---

## Files to Create

1. `theme-broadcast.css` — Complete CSS theme
2. `theme-broadcast-demo.html` — Interactive prototype
3. Logo SVG files

---

## Next Steps

1. Build interactive HTML prototype
2. Test with full range of team colors
3. Refine based on feedback
4. Implement in Astro components
