import { FighterPose, SkinPalette } from './types'

// ── Fighter visual scale ────────────────────────────────────────────────────
export const FIGHTER_SCALE = 2.0

// ── Attack phase timing (SF2-inspired) ──────────────────────────────────────
// SF2 key insight: startup is VISIBLE anticipation, then SNAP to active in 1-2 frames.
// Recovery is where the weight difference lives (light: short, heavy: long).
// "hold" is the impact pose held during hit-stop. Active is near-instant.
// SF2 timing: startup is SHORT (just enough to telegraph), active is INSTANT (1 tick),
// hold is LONG (the pose reads for 50%+ of the animation), recovery fills the rest.
export const ATTACK_PHASES: Record<string, { startup: number; active: number; hold: number }> = {
  jab:        { startup: 0.10, active: 0.15, hold: 0.60 },
  cross:      { startup: 0.12, active: 0.17, hold: 0.58 },
  hook:       { startup: 0.15, active: 0.20, hold: 0.58 },
  uppercut:   { startup: 0.18, active: 0.23, hold: 0.60 },
  kick:       { startup: 0.12, active: 0.17, hold: 0.60 },
  roundhouse: { startup: 0.15, active: 0.20, hold: 0.62 },
}

// Per-attack-type parameters
// CRITICAL: armAngle is rotation from VERTICAL (0°=down, 90°=horizontal, 135°=upward).
export const PUNCH_PARAMS: Record<string, { maxExtension: number; bodyLean: number; armAngle: number; headDip: number; windUpLean: number }> = {
  jab:      { maxExtension: 48, bodyLean: 12,  armAngle: 82, headDip: 3, windUpLean: -8 },
  cross:    { maxExtension: 65, bodyLean: 26, armAngle: 88, headDip: 6, windUpLean: -14 },
  hook:     { maxExtension: 38, bodyLean: 30, armAngle: 75, headDip: 4, windUpLean: -16 },
  uppercut: { maxExtension: 42, bodyLean: -6, armAngle: 135, headDip: -10, windUpLean: -5 },
}

// legAngle: 0°=down, 80°=nearly horizontal forward, 95°=above horizontal
export const KICK_PARAMS: Record<string, { maxExtension: number; bodyLean: number; legAngle: number; armRaise: number }> = {
  kick:       { maxExtension: 58, bodyLean: -16, legAngle: 80, armRaise: 12 },
  roundhouse: { maxExtension: 75, bodyLean: -24, legAngle: 95, armRaise: 16 },
}

// ── Skin tone palettes ──────────────────────────────────────────────────────
// Per-fighter skin tones — 8 distinct palettes for visual differentiation
export const SKIN_PALETTES: SkinPalette[] = [
  { base: '#e8b88a', shadow: '#c89870', highlight: '#fad0a8' }, // light warm
  { base: '#c68642', shadow: '#a06830', highlight: '#dca060' }, // medium warm
  { base: '#8d5524', shadow: '#6d3c16', highlight: '#a87040' }, // brown
  { base: '#6b4226', shadow: '#4e2e16', highlight: '#8a5c3a' }, // dark brown
  { base: '#e0ac69', shadow: '#bf8a4a', highlight: '#f0c888' }, // golden
  { base: '#f1c27d', shadow: '#d4a65c', highlight: '#ffe0a0' }, // pale warm
  { base: '#d4956a', shadow: '#b07a52', highlight: '#e8b490' }, // bronze
  { base: '#503020', shadow: '#382010', highlight: '#6a4838' }, // deep
]

// ── Named pose constants ────────────────────────────────────────────────────
export const POSE_GUARD: FighterPose = {
  fShA: 55, fElB: 110, bShA: 45, bElB: 120,
  fHiA: -10, fKnB: 20, bHiA: 8, bKnB: 25,
  bodyLean: 6, headOff: 0, torsoOff: 0, armOff: 0, legOff: 0,
  gloveScale: 1.0, bootScale: 1.0,
}

// SF2 Idle: 6-frame breathing loop. Arms MAINTAIN GUARD SHAPE — they just bob Y.
// The bounce comes from knees bending, not arm rotation. Head barely moves.
// Fists move 2-4× more than torso (SF2 reference: 4px fists vs 1px torso).
// All offsets are INTEGERS for pixel-perfect hard cuts between frames.
export const IDLE_FRAMES: FighterPose[] = [
  // Frame 0: bottom of bounce (deepest knee bend)
  { ...POSE_GUARD, fKnB: 30, bKnB: 34,
    headOff: 2, torsoOff: 4, armOff: 4, legOff: 2, gloveScale: 1.0, bootScale: 1.0 },
  // Frame 1: rising
  { ...POSE_GUARD, fKnB: 24, bKnB: 28,
    headOff: 1, torsoOff: 2, armOff: 2, legOff: 1, gloveScale: 1.0, bootScale: 1.0 },
  // Frame 2: peak (top — knees most straight)
  { ...POSE_GUARD, fKnB: 18, bKnB: 22,
    headOff: 0, torsoOff: 0, armOff: 0, legOff: 0, gloveScale: 1.0, bootScale: 1.0 },
  // Frame 3: start falling
  { ...POSE_GUARD, fKnB: 20, bKnB: 24,
    headOff: 0, torsoOff: 1, armOff: 1, legOff: 0, gloveScale: 1.0, bootScale: 1.0 },
  // Frame 4: falling fast
  { ...POSE_GUARD, fKnB: 26, bKnB: 30,
    headOff: 1, torsoOff: 3, armOff: 3, legOff: 1, gloveScale: 1.0, bootScale: 1.0 },
  // Frame 5: bottom again
  { ...POSE_GUARD, fKnB: 30, bKnB: 34,
    headOff: 2, torsoOff: 4, armOff: 4, legOff: 2, gloveScale: 1.0, bootScale: 1.0 },
]

// Asymmetric timing: slow rise (100ms × 3), fast fall (50ms × 3) = ~450ms cycle
export const IDLE_FRAME_MS = [100, 100, 100, 50, 50, 50]
export const IDLE_CYCLE_MS = IDLE_FRAME_MS.reduce((a, b) => a + b, 0)

// ── Punch poses ─────────────────────────────────────────────────────────────
export const POSE_JAB_CHAMBER: FighterPose = {
  fShA: 70, fElB: 140, bShA: 55, bElB: 125,
  fHiA: -12, fKnB: 25, bHiA: 10, bKnB: 30,
  bodyLean: -4, headOff: -1, torsoOff: 2, armOff: 0, legOff: 0,
  gloveScale: 0.9, bootScale: 1.0,
}
export const POSE_JAB_EXTEND: FighterPose = {
  fShA: -85, fElB: 2, bShA: 50, bElB: 130,
  fHiA: -14, fKnB: 20, bHiA: 12, bKnB: 28,
  bodyLean: 10, headOff: -2, torsoOff: -1, armOff: -1, legOff: 0,
  gloveScale: 1.2, bootScale: 1.0,
}
export const POSE_CROSS_CHAMBER: FighterPose = {
  fShA: 70, fElB: 140, bShA: 55, bElB: 125,
  fHiA: -12, fKnB: 25, bHiA: 10, bKnB: 30,
  bodyLean: -6, headOff: -1, torsoOff: 2, armOff: 0, legOff: 0,
  gloveScale: 0.9, bootScale: 1.0,
}
export const POSE_CROSS_EXTEND: FighterPose = {
  fShA: -88, fElB: 2, bShA: 50, bElB: 130,
  fHiA: -14, fKnB: 20, bHiA: 12, bKnB: 26,
  bodyLean: 14, headOff: -3, torsoOff: -1, armOff: -2, legOff: 0,
  gloveScale: 1.2, bootScale: 1.0,
}
export const POSE_HOOK_CHAMBER: FighterPose = {
  fShA: 70, fElB: 140, bShA: 55, bElB: 125,
  fHiA: -12, fKnB: 25, bHiA: 10, bKnB: 30,
  bodyLean: -8, headOff: -1, torsoOff: 2, armOff: 0, legOff: 0,
  gloveScale: 0.9, bootScale: 1.0,
}
export const POSE_HOOK_EXTEND: FighterPose = {
  fShA: -78, fElB: 70, bShA: 50, bElB: 130,
  fHiA: -14, fKnB: 22, bHiA: 12, bKnB: 28,
  bodyLean: 12, headOff: -2, torsoOff: -1, armOff: -2, legOff: 0,
  gloveScale: 1.2, bootScale: 1.0,
}
export const POSE_UPPER_CHAMBER: FighterPose = {
  fShA: 70, fElB: 140, bShA: 55, bElB: 125,
  fHiA: -12, fKnB: 25, bHiA: 10, bKnB: 30,
  bodyLean: -5, headOff: 3, torsoOff: 5, armOff: 0, legOff: 0,
  gloveScale: 0.9, bootScale: 1.0,
}
export const POSE_UPPER_EXTEND: FighterPose = {
  fShA: -140, fElB: 15, bShA: 50, bElB: 130,
  fHiA: -15, fKnB: 15, bHiA: 12, bKnB: 22,
  bodyLean: -6, headOff: -6, torsoOff: -3, armOff: -4, legOff: 0,
  gloveScale: 1.2, bootScale: 1.0,
}

// ── Kick poses ──────────────────────────────────────────────────────────────
export const POSE_KICK_CHAMBER: FighterPose = {
  fShA: 40, fElB: 90, bShA: 55, bElB: 80,
  fHiA: -50, fKnB: 95, bHiA: 5, bKnB: 22,
  bodyLean: -4, headOff: 1, torsoOff: 0, armOff: -4, legOff: 0,
  gloveScale: 1.0, bootScale: 0.9,
}
export const POSE_KICK_EXTEND: FighterPose = {
  fShA: 35, fElB: 85, bShA: 50, bElB: 75,
  fHiA: -85, fKnB: 5, bHiA: 8, bKnB: 20,
  bodyLean: -12, headOff: -1, torsoOff: 1, armOff: -8, legOff: 0,
  gloveScale: 1.0, bootScale: 1.15,
}
export const POSE_ROUNDHOUSE_CHAMBER: FighterPose = {
  fShA: 40, fElB: 90, bShA: 55, bElB: 80,
  fHiA: -50, fKnB: 95, bHiA: 5, bKnB: 22,
  bodyLean: -5, headOff: 1, torsoOff: 0, armOff: -5, legOff: 0,
  gloveScale: 1.0, bootScale: 0.9,
}
export const POSE_ROUNDHOUSE_EXTEND: FighterPose = {
  fShA: 35, fElB: 85, bShA: 50, bElB: 75,
  fHiA: -100, fKnB: 3, bHiA: 8, bKnB: 20,
  bodyLean: -14, headOff: -2, torsoOff: 2, armOff: -10, legOff: 0,
  gloveScale: 1.0, bootScale: 1.15,
}

// ── Attack weight classification ────────────────────────────────────────────
// SF2 reference: light attacks are snappy/minimal recoil, heavy are committal/dramatic.
// Used for scaling hit sparks, recoil, screen shake, and smear frames.
export type AttackWeight = 'light' | 'medium' | 'heavy'
export const ATTACK_WEIGHT: Record<string, AttackWeight> = {
  jab: 'light',
  cross: 'medium',
  hook: 'medium',
  uppercut: 'heavy',
  kick: 'medium',
  roundhouse: 'heavy',
}

// ── Defensive poses (scaled by attack weight) ───────────────────────────────
// Light: small head snap, minimal body movement (SF2: jab recoil)
export const POSE_HIT_RECOIL_LIGHT: FighterPose = {
  fShA: 40, fElB: 80, bShA: 35, bElB: 90,
  fHiA: -8, fKnB: 28, bHiA: 10, bKnB: 28,
  bodyLean: -8, headOff: 5, torsoOff: 2, armOff: 3, legOff: 1,
  gloveScale: 1.0, bootScale: 1.0,
}
// Medium: upper body rocks back (SF2: cross/hook/kick recoil)
export const POSE_HIT_RECOIL_MEDIUM: FighterPose = {
  fShA: 25, fElB: 50, bShA: 20, bElB: 45,
  fHiA: -8, fKnB: 36, bHiA: 10, bKnB: 35,
  bodyLean: -14, headOff: 8, torsoOff: 4, armOff: 5, legOff: 2,
  gloveScale: 1.0, bootScale: 1.0,
}
// Heavy: full body pushed back, deep stagger (SF2: uppercut/roundhouse recoil)
export const POSE_HIT_RECOIL: FighterPose = {
  fShA: 20, fElB: 30, bShA: 15, bElB: 25,
  fHiA: -8, fKnB: 42, bHiA: 10, bKnB: 40,
  bodyLean: -20, headOff: 12, torsoOff: 6, armOff: 8, legOff: 3,
  gloveScale: 1.0, bootScale: 1.0,
}

// ── Knockback physics by attack weight ───────────────────────────────────
// SF2: light hits snap back fast, heavy hits skid with delayed recovery.
export const KB_INITIAL_VELOCITY: Record<AttackWeight, number> = { light: 10, medium: 18, heavy: 28 }
export const KB_FRICTION: Record<AttackWeight, number> = { light: 0.75, medium: 0.85, heavy: 0.90 }
export const KB_SPRING: Record<AttackWeight, number> = { light: 0.88, medium: 0.92, heavy: 0.95 }
export const KB_MAX_OFFSET: Record<AttackWeight, number> = { light: 15, medium: 30, heavy: 40 }

// Lookup: returns the appropriate recoil pose for an attack weight
export const HIT_RECOIL_BY_WEIGHT: Record<AttackWeight, FighterPose> = {
  light: POSE_HIT_RECOIL_LIGHT,
  medium: POSE_HIT_RECOIL_MEDIUM,
  heavy: POSE_HIT_RECOIL,
}

export const POSE_BLOCK_HIGH: FighterPose = {
  fShA: 70, fElB: 140, bShA: 65, bElB: 145,
  fHiA: -10, fKnB: 30, bHiA: 8, bKnB: 33,
  bodyLean: -4, headOff: 2, torsoOff: 0, armOff: 0, legOff: 0,
  gloveScale: 1.0, bootScale: 1.0,
}
export const POSE_DODGE_DUCK: FighterPose = {
  fShA: 30, fElB: 135, bShA: 25, bElB: 135,
  fHiA: -10, fKnB: 42, bHiA: 8, bKnB: 43,
  bodyLean: -8, headOff: 10, torsoOff: 5, armOff: 0, legOff: 0,
  gloveScale: 1.0, bootScale: 1.0,
}
// Lean-back dodge: sway away (speed fighters). Upright stance, head pulls back.
export const POSE_DODGE_LEAN: FighterPose = {
  fShA: 50, fElB: 120, bShA: 45, bElB: 125,
  fHiA: -5, fKnB: 25, bHiA: 5, bKnB: 28,
  bodyLean: -18, headOff: -3, torsoOff: -2, armOff: -3, legOff: 0,
  gloveScale: 1.0, bootScale: 1.0,
}

// ── Victory / defeat poses ──────────────────────────────────────────────────
// Victory: arms raised high, slight back arch, wide celebratory stance.
export const POSE_VICTORY: FighterPose = {
  fShA: -30, fElB: 35, bShA: -35, bElB: 30,
  fHiA: 5, fKnB: 22, bHiA: -5, bKnB: 24,
  bodyLean: -5, headOff: -4, torsoOff: -2, armOff: -3, legOff: 0,
  gloveScale: 1.1, bootScale: 1.0,
}
// Defeat (decision loss): slumped forward, arms hanging, head dropped.
export const POSE_DEFEAT: FighterPose = {
  fShA: 75, fElB: 95, bShA: 70, bElB: 100,
  fHiA: 5, fKnB: 30, bHiA: -3, bKnB: 32,
  bodyLean: 12, headOff: 6, torsoOff: 3, armOff: 4, legOff: 0,
  gloveScale: 0.9, bootScale: 1.0,
}

// ── Pose lookup maps ────────────────────────────────────────────────────────
export const PUNCH_POSES: Record<string, { chamber: FighterPose; extend: FighterPose }> = {
  jab:      { chamber: POSE_JAB_CHAMBER, extend: POSE_JAB_EXTEND },
  cross:    { chamber: POSE_CROSS_CHAMBER, extend: POSE_CROSS_EXTEND },
  hook:     { chamber: POSE_HOOK_CHAMBER, extend: POSE_HOOK_EXTEND },
  uppercut: { chamber: POSE_UPPER_CHAMBER, extend: POSE_UPPER_EXTEND },
}
export const KICK_POSES: Record<string, { chamber: FighterPose; extend: FighterPose }> = {
  kick:       { chamber: POSE_KICK_CHAMBER, extend: POSE_KICK_EXTEND },
  roundhouse: { chamber: POSE_ROUNDHOUSE_CHAMBER, extend: POSE_ROUNDHOUSE_EXTEND },
}
