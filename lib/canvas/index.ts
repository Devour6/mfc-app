// ── Canvas module barrel export ──────────────────────────────────────────────
// Modular fight canvas: types, constants, utils, renderers, animation controller.

export type { EnhancedFightCanvasProps, RoundEvent, VisualEffect, FighterPose, SkinPalette, HairStyle } from './types'
export { HAIR_STYLES } from './types'

export type { AttackWeight } from './constants'
export {
  FIGHTER_SCALE, ATTACK_PHASES, PUNCH_PARAMS, KICK_PARAMS,
  SKIN_PALETTES, POSE_GUARD, IDLE_FRAMES, IDLE_FRAME_MS, IDLE_CYCLE_MS,
  PUNCH_POSES, KICK_POSES,
  ATTACK_WEIGHT, HIT_RECOIL_BY_WEIGHT,
  KB_INITIAL_VELOCITY, KB_FRICTION, KB_SPRING, KB_MAX_OFFSET,
  POSE_HIT_RECOIL, POSE_HIT_RECOIL_LIGHT, POSE_HIT_RECOIL_MEDIUM,
  POSE_BLOCK_HIGH, POSE_DODGE_DUCK, POSE_DODGE_LEAN,
} from './constants'

export {
  easeOutCubic, easeInQuad, easeInOutQuad, lerp, clamp, statMod, lerpPose,
  P, px, pxo, drawSprite, shade, highlight,
  hashString, getFighterPalette, getFighterHairStyle,
} from './utils'

export { getAnimProgress, getAttackPhase, getPhaseProgress } from './animation-controller'

export { drawEnhancedRing, drawCrowdAtmosphere } from './stage-renderer'

export { drawVisualEffects, drawHitSpark, drawSmearFrame, drawImpactFlash, drawMotionTrail, drawSweatParticles } from './effects-renderer'

export { drawSF2HUD, drawFighterNameTag } from './hud-renderer'

export { drawEnhancedFighter } from './fighter-renderer'
