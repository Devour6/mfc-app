import { ATTACK_PHASES } from './constants'
import { clamp } from './utils'

// ── Compute animation progress from engine state ────────────────────────────
// The fight engine provides frameCount (elapsed) and duration (remaining).
// Total frames = frameCount + duration. Progress = frameCount / total.
export const getAnimProgress = (fighterState: { animation: { frameCount: number; duration: number } }): number => {
  const { frameCount, duration } = fighterState.animation
  const total = frameCount + duration
  if (total <= 0) return 0
  return clamp(frameCount / total, 0, 1)
}

// ── Determine which phase of an attack we're in ─────────────────────────────
export const getAttackPhase = (t: number, attackType: string): 'startup' | 'active' | 'hold' | 'recovery' => {
  const phases = ATTACK_PHASES[attackType] || ATTACK_PHASES.jab
  if (t < phases.startup) return 'startup'
  if (t < phases.active) return 'active'
  if (t < phases.hold) return 'hold'
  return 'recovery'
}

// ── Sub-progress within a phase (0→1 within that phase) ─────────────────────
export const getPhaseProgress = (t: number, attackType: string, phase: 'startup' | 'active' | 'hold' | 'recovery'): number => {
  const phases = ATTACK_PHASES[attackType] || ATTACK_PHASES.jab
  let start: number, end: number
  switch (phase) {
    case 'startup': start = 0; end = phases.startup; break
    case 'active': start = phases.startup; end = phases.active; break
    case 'hold': start = phases.active; end = phases.hold; break
    case 'recovery': start = phases.hold; end = 1; break
  }
  if (end <= start) return 1
  return clamp((t - start) / (end - start), 0, 1)
}
