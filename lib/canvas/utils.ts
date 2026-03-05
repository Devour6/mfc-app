import { FighterPose, SkinPalette, HAIR_STYLES, HairStyle } from './types'
import { SKIN_PALETTES } from './constants'

// ── Easing functions ────────────────────────────────────────────────────────
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
export const easeInQuad = (t: number) => t * t
export const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

// Map a 0-100 fighter stat to a multiplier in [low, high] range.
// statMod(50, 0.7, 1.3) → 1.0 (midpoint). Used for stat-driven animation differentiation.
export const statMod = (val: number, low: number, high: number) => low + (val / 100) * (high - low)

// ── Pose interpolation ──────────────────────────────────────────────────────
export const lerpPose = (a: FighterPose, b: FighterPose, t: number): FighterPose => ({
  fShA: lerp(a.fShA, b.fShA, t), fElB: lerp(a.fElB, b.fElB, t),
  bShA: lerp(a.bShA, b.bShA, t), bElB: lerp(a.bElB, b.bElB, t),
  fHiA: lerp(a.fHiA, b.fHiA, t), fKnB: lerp(a.fKnB, b.fKnB, t),
  bHiA: lerp(a.bHiA, b.bHiA, t), bKnB: lerp(a.bKnB, b.bKnB, t),
  bodyLean: lerp(a.bodyLean, b.bodyLean, t),
  headOff: lerp(a.headOff, b.headOff, t),
  torsoOff: lerp(a.torsoOff, b.torsoOff, t),
  armOff: lerp(a.armOff, b.armOff, t),
  legOff: lerp(a.legOff, b.legOff, t),
  gloveScale: lerp(a.gloveScale, b.gloveScale, t),
  bootScale: lerp(a.bootScale, b.bootScale, t),
})

// ── Pixel drawing helpers ───────────────────────────────────────────────────
// Pixel size constant for 16-bit sprite look
export const P = 4

export const px = (ctx: CanvasRenderingContext2D, x: number, y: number, c: string) => {
  ctx.fillStyle = c
  ctx.fillRect(x, y, P, P)
}

// Pixel with outline
export const pxo = (ctx: CanvasRenderingContext2D, x: number, y: number, c: string) => {
  ctx.fillStyle = '#111'
  ctx.fillRect(x - 1, y - 1, P + 2, P + 2)
  ctx.fillStyle = c
  ctx.fillRect(x, y, P, P)
}

export const drawSprite = (ctx: CanvasRenderingContext2D, ox: number, oy: number, grid: string[][]) => {
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const c = grid[row][col]
      if (c) px(ctx, ox + col * P, oy + row * P, c)
    }
  }
}

// ── Color helpers ───────────────────────────────────────────────────────────
export const shade = (hex: string): string => {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 40)
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 40)
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 40)
  return `rgb(${r},${g},${b})`
}

export const highlight = (hex: string): string => {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + 50)
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + 50)
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + 50)
  return `rgb(${r},${g},${b})`
}

// ── Fighter identity helpers ────────────────────────────────────────────────
// Derive a fighter's visual identity from their ID (deterministic hash)
export const hashString = (str: string): number => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export const getFighterPalette = (fighterId: string): SkinPalette =>
  SKIN_PALETTES[hashString(fighterId) % SKIN_PALETTES.length]

export const getFighterHairStyle = (fighterId: string): HairStyle =>
  HAIR_STYLES[(hashString(fighterId + '_hair')) % HAIR_STYLES.length]
