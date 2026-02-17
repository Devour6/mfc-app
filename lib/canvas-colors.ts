/**
 * Canvas Color Constants — MFC Visual System
 *
 * All canvas colors must come from this file.
 * System tokens match tailwind.config.js exactly.
 * No hardcoded hex values in canvas components.
 */

// ─── Core System Tokens ─────────────────────────────────────────────
// Mirror of tailwind.config.js colors

export const COLORS = {
  bg: '#0a0a0f',
  surface: '#12121a',
  surface2: '#1a1a26',
  border: '#2a2a3a',
  accent: '#ff4444',
  accent2: '#4488ff',
  gold: '#ffd700',
  green: '#22c55e',
  red: '#ef4444',
  text: '#e8e8f0',
  text2: '#888899',
  white: '#ffffff',
  black: '#000000',
} as const

// ─── RGBA Helper ─────────────────────────────────────────────────────
// Use this for any color that needs transparency.

export function rgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// ─── Arena Environment ───────────────────────────────────────────────

export const ARENA = {
  // Background gradient (top to bottom)
  bgTop: COLORS.bg,
  bgMid: COLORS.bg,
  bgBottom: COLORS.surface,

  // Ring floor gradient
  floorTop: COLORS.surface2,
  floorMid: COLORS.surface,
  floorBottom: COLORS.bg,

  // Ring floor texture lines
  floorTexture: rgba(COLORS.white, 0.02),

  // Ring shadow
  ringShadow: rgba(COLORS.black, 0.3),

  // Ropes (3 ropes: accent, gold, green)
  rope1: COLORS.accent,
  rope2: COLORS.gold,
  rope3: COLORS.green,

  // Corner posts
  postFill: COLORS.border,
  postLED: COLORS.green,

  // MFC logo watermark
  logoFill: rgba(COLORS.accent, 0.1),
  logoGlow: COLORS.accent,

  // Simple ring ropes (FightCanvas)
  ropeSimple: rgba(COLORS.accent, 0.3),
  cornerPost: COLORS.accent,

  // MFC logo (FightCanvas)
  logoSimple: rgba(COLORS.accent, 0.04),
} as const

// ─── Crowd & Atmosphere ──────────────────────────────────────────────

export const CROWD = {
  silhouette: (excitement: number) => rgba(COLORS.surface, 0.4 + excitement * 0.3),
  cameraFlash: (intensity: number) => rgba(COLORS.white, 0.6 + intensity * 0.4),
  lightGlow: (intensity: number) => rgba(COLORS.white, intensity * 0.4),
  lightGlowEnd: rgba(COLORS.white, 0),
  spotlightBeam: (intensity: number) => `rgba(255,255,200,${intensity * 0.1})`,
  spotlightEnd: 'rgba(255,255,200,0)',
  soundWave: (excitement: number) => rgba(COLORS.white, excitement * 0.1),
} as const

// ─── Fighters ────────────────────────────────────────────────────────

export const FIGHTER = {
  red: COLORS.accent,
  blue: COLORS.accent2,
  eyes: COLORS.white,
  pupils: COLORS.black,
  mouth: COLORS.black,
  gloves: COLORS.white,
  glovePunch: COLORS.gold,
  gloveGlow: COLORS.gold,
  boots: COLORS.black,
  shorts: COLORS.border,
  shortsHit: COLORS.accent,
  chestHighlight: rgba(COLORS.white, 0.15),
  blockOutline: COLORS.white,
  motionLines: rgba(COLORS.white, 0.3),
  shadow: rgba(COLORS.black, 0.4),
  hitFlash: rgba(COLORS.white, 0.3),
  bloodyMouth: COLORS.accent,
} as const

// ─── HP & Stamina Bars ──────────────────────────────────────────────

export const BARS = {
  hpBackground: COLORS.surface2,
  hpLow: COLORS.accent,
  staminaBackground: COLORS.border,
  staminaFill: COLORS.accent2,
  namePlate: rgba(COLORS.black, 0.7),
} as const

// ─── HUD ─────────────────────────────────────────────────────────────

export const HUD = {
  background: rgba(COLORS.surface, 0.9),
  roundTimerBg: rgba(COLORS.black, 0.7),
  roundNumber: COLORS.gold,
  timerText: COLORS.white,
  statsText: COLORS.text,
  intensityLabel: COLORS.gold,
  intensityBarBg: rgba(COLORS.surface2, 0.8),
  intensityLow: (pulse: number) => `rgba(34,197,94,${pulse})`,      // green
  intensityMid: (pulse: number) => `rgba(255,215,0,${pulse})`,      // gold
  intensityHigh: (pulse: number) => `rgba(255,68,68,${pulse})`,     // accent
  intensityGlow: COLORS.accent,
  momentumPositive: COLORS.green,
  momentumNegative: COLORS.accent,
  centerLine: (pulse: number) => rgba(COLORS.white, 0.8 + pulse * 0.2),
  labelText: COLORS.white,
  crowdTextHigh: (pulse: number) => rgba(COLORS.gold, pulse),
  crowdTextMid: (pulse: number) => rgba(COLORS.gold, pulse),
} as const

// ─── Visual Effects ──────────────────────────────────────────────────

export const FX = {
  // Impact
  impactCenter: (intensity: number) => rgba(COLORS.white, intensity),
  impactMid: (intensity: number) => rgba(COLORS.gold, intensity * 0.8),
  impactOuter: (intensity: number) => rgba(COLORS.accent, intensity * 0.6),
  impactEdge: rgba(COLORS.accent, 0),
  impactLines: (intensity: number) => rgba(COLORS.white, intensity),
  impactFlash: (intensity: number) => rgba(COLORS.white, (intensity - 0.8) * 0.1),

  // Sparks
  sparkTrail: (intensity: number) => rgba(COLORS.gold, intensity * 0.8),
  sparkCore: (intensity: number) => rgba(COLORS.white, intensity),

  // Blood
  bloodDrop: (intensity: number, fade: number) => rgba(COLORS.accent, intensity * (1 - fade)),
  bloodTrail: (intensity: number) => rgba(COLORS.accent, intensity * 0.4),
  bloodSimple: COLORS.accent,

  // Stars (stun)
  starColor: (intensity: number) => rgba(COLORS.gold, intensity),
  starSimple: COLORS.gold,

  // Block flash
  blockShield: (intensity: number) => rgba(COLORS.accent2, intensity),
  blockGlow: (intensity: number) => rgba(COLORS.accent2, intensity * 0.3),
  blockSparks: (intensity: number) => rgba(COLORS.white, intensity),

  // Combo explosion
  comboRing: (alpha: number) => `rgba(255,68,68,${alpha})`,
  comboText: (intensity: number) => rgba(COLORS.gold, intensity),
  comboParticle: (intensity: number, variation: number) =>
    `rgba(255,${Math.round(68 + variation * 100)},0,${intensity})`,

  // Screen shake flash
  shakeFlash: (alpha: number) => rgba(COLORS.white, alpha),

  // Motion trails
  punchTrail: COLORS.gold,
  kickTrail: COLORS.accent,

  // Sweat
  sweatDrops: rgba(COLORS.accent2, 0.6),
} as const
