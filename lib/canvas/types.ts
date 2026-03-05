import { FightState, Fighter } from '@/types'

// ── Component props ─────────────────────────────────────────────────────────
export interface EnhancedFightCanvasProps {
  fightState: FightState
  fighters: Fighter[]
  onRoundStart?: (round: number) => void
  onSignificantMoment?: (moment: string, severity: 'low' | 'medium' | 'high') => void
}

// ── Round events ────────────────────────────────────────────────────────────
export interface RoundEvent {
  id: string
  round: number
  timestamp: number
  type: 'strike' | 'knockdown' | 'combo' | 'counter' | 'rally'
  severity: 'low' | 'medium' | 'high'
  description: string
  fighter: 1 | 2
}

// ── Visual effects ──────────────────────────────────────────────────────────
export interface VisualEffect {
  id: string
  type: 'impact' | 'blood' | 'stars' | 'sweat' | 'sparks' | 'block_flash' | 'combo_explosion' | 'screen_shake' | 'slow_motion'
  x: number
  y: number
  duration: number
  intensity: number
}

// ── Pose system ─────────────────────────────────────────────────────────────
// SF2-style discrete pose system: named poses define complete joint state
// for each animation keyframe. Snap between poses instead of smooth interpolation.
export interface FighterPose {
  fShA: number; fElB: number   // front shoulder angle, front elbow bend
  bShA: number; bElB: number   // back shoulder angle, back elbow bend
  fHiA: number; fKnB: number   // front hip angle, front knee bend
  bHiA: number; bKnB: number   // back hip angle, back knee bend
  bodyLean: number              // torso rotation (raw — multiply by facing when applied)
  headOff: number               // head Y offset (positive = down)
  torsoOff: number              // torso Y offset
  armOff: number                // shoulder attachment Y offset
  legOff: number                // hip attachment Y offset
  gloveScale: number            // glove squash/stretch (1.0 = normal, 1.3 = impact, 0.85 = chamber)
  bootScale: number             // boot squash/stretch
}

// ── Skin palettes ───────────────────────────────────────────────────────────
export interface SkinPalette {
  base: string
  shadow: string
  highlight: string
}

// ── Hair styles ─────────────────────────────────────────────────────────────
export const HAIR_STYLES = ['full', 'mohawk', 'short', 'bald', 'shaggy'] as const
export type HairStyle = typeof HAIR_STYLES[number]

// ── Crowd reaction state ────────────────────────────────────────────────────
// Passed to drawCrowdAtmosphere so the crowd reacts to fight events beyond HP.
export interface CrowdReactionState {
  f1AnimState: string
  f2AnimState: string
  f1Combo: number
  f2Combo: number
}
