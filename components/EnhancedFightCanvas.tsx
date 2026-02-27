'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FightState, Fighter } from '@/types'
import { FIGHTER_MAX_HP } from '@/lib/fight-engine'

interface EnhancedFightCanvasProps {
  fightState: FightState
  fighters: Fighter[]
  onRoundStart?: (round: number) => void
  onSignificantMoment?: (moment: string, severity: 'low' | 'medium' | 'high') => void
}

interface RoundEvent {
  id: string
  round: number
  timestamp: number
  type: 'strike' | 'knockdown' | 'combo' | 'counter' | 'rally'
  severity: 'low' | 'medium' | 'high'
  description: string
  fighter: 1 | 2
}

interface VisualEffect {
  id: string
  type: 'impact' | 'blood' | 'stars' | 'sweat' | 'sparks' | 'block_flash' | 'combo_explosion' | 'screen_shake' | 'slow_motion'
  x: number
  y: number
  duration: number
  intensity: number
}

// ── Easing functions ────────────────────────────────────────────────────────
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInQuad = (t: number) => t * t
const easeInOutQuad = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
const easeOutBack = (t: number) => {
  const c = 1.7
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))

// Map a 0-100 fighter stat to a multiplier in [low, high] range.
// statMod(50, 0.7, 1.3) → 1.0 (midpoint). Used for stat-driven animation differentiation.
const statMod = (val: number, low: number, high: number) => low + (val / 100) * (high - low)

// ── Attack phase timing (SF2-inspired) ──────────────────────────────────────
// SF2 key insight: startup is VISIBLE anticipation, then SNAP to active in 1-2 frames.
// Recovery is where the weight difference lives (light: short, heavy: long).
// "hold" is the impact pose held during hit-stop. Active is near-instant.
const ATTACK_PHASES: Record<string, { startup: number; active: number; hold: number }> = {
  jab:        { startup: 0.20, active: 0.30, hold: 0.50 },
  cross:      { startup: 0.25, active: 0.35, hold: 0.55 },
  hook:       { startup: 0.30, active: 0.40, hold: 0.55 },
  uppercut:   { startup: 0.35, active: 0.45, hold: 0.60 },
  kick:       { startup: 0.25, active: 0.35, hold: 0.60 },
  roundhouse: { startup: 0.30, active: 0.40, hold: 0.65 },
}

// Per-attack-type parameters
// CRITICAL: armAngle is rotation from VERTICAL (0°=down, 90°=horizontal, 135°=upward).
// A cross punch must be ~88° so the fist goes TOWARD the opponent, not toward the floor.
const PUNCH_PARAMS: Record<string, { maxExtension: number; bodyLean: number; armAngle: number; headDip: number; windUpLean: number }> = {
  jab:      { maxExtension: 48, bodyLean: 12,  armAngle: 82, headDip: 3, windUpLean: -8 },
  cross:    { maxExtension: 65, bodyLean: 26, armAngle: 88, headDip: 6, windUpLean: -14 },
  hook:     { maxExtension: 38, bodyLean: 30, armAngle: 75, headDip: 4, windUpLean: -16 },
  uppercut: { maxExtension: 42, bodyLean: -6, armAngle: 135, headDip: -10, windUpLean: -5 },
}

// legAngle: 0°=down, 80°=nearly horizontal forward, 95°=above horizontal
const KICK_PARAMS: Record<string, { maxExtension: number; bodyLean: number; legAngle: number; armRaise: number }> = {
  kick:       { maxExtension: 58, bodyLean: -16, legAngle: 80, armRaise: 12 },
  roundhouse: { maxExtension: 75, bodyLean: -24, legAngle: 95, armRaise: 16 },
}

// ── Fighter visual scale + skin tone palettes ──────────────────────────────
const FIGHTER_SCALE = 2.0

// Per-fighter skin tones — 8 distinct palettes for visual differentiation
// Each: [base, shadow, highlight]
interface SkinPalette { base: string; shadow: string; highlight: string }

const SKIN_PALETTES: SkinPalette[] = [
  { base: '#e8b88a', shadow: '#c89870', highlight: '#fad0a8' }, // light warm
  { base: '#c68642', shadow: '#a06830', highlight: '#dca060' }, // medium warm
  { base: '#8d5524', shadow: '#6d3c16', highlight: '#a87040' }, // brown
  { base: '#6b4226', shadow: '#4e2e16', highlight: '#8a5c3a' }, // dark brown
  { base: '#e0ac69', shadow: '#bf8a4a', highlight: '#f0c888' }, // golden
  { base: '#f1c27d', shadow: '#d4a65c', highlight: '#ffe0a0' }, // pale warm
  { base: '#d4956a', shadow: '#b07a52', highlight: '#e8b490' }, // bronze
  { base: '#503020', shadow: '#382010', highlight: '#6a4838' }, // deep
]

// Hair style variants — different head grid patterns
const HAIR_STYLES = ['full', 'mohawk', 'short', 'bald', 'shaggy'] as const
type HairStyle = typeof HAIR_STYLES[number]

// Derive a fighter's visual identity from their ID (deterministic hash)
const hashString = (str: string): number => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

const getFighterPalette = (fighterId: string): SkinPalette =>
  SKIN_PALETTES[hashString(fighterId) % SKIN_PALETTES.length]

const getFighterHairStyle = (fighterId: string): HairStyle =>
  HAIR_STYLES[(hashString(fighterId + '_hair')) % HAIR_STYLES.length]

export default function EnhancedFightCanvas({
  fightState,
  fighters,
  onRoundStart,
  onSignificantMoment
}: EnhancedFightCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [roundEvents, setRoundEvents] = useState<RoundEvent[]>([])
  const [visualEffects, setVisualEffects] = useState<VisualEffect[]>([])

  // Position interpolation for smooth animation between 80ms fight ticks
  const prevPositionsRef = useRef<{
    f1: { x: number; y: number }
    f2: { x: number; y: number }
    timestamp: number
  } | null>(null)
  const renderPositionsRef = useRef<{
    f1: { x: number; y: number }
    f2: { x: number; y: number }
  }>({ f1: { x: 180, y: 0 }, f2: { x: 300, y: 0 } })

  // Knockback state per fighter — offset + velocity with friction decay
  const knockbackRef = useRef<{
    f1: { offset: number; velocity: number }
    f2: { offset: number; velocity: number }
  }>({ f1: { offset: 0, velocity: 0 }, f2: { offset: 0, velocity: 0 } })

  // Track previous animation state to detect transitions (e.g. entering 'hit')
  const prevAnimRef = useRef<{
    f1: string
    f2: string
  }>({ f1: 'idle', f2: 'idle' })

  // Hit-stop: cache animation progress at moment of freeze
  const hitStopProgressRef = useRef<{
    f1: number
    f2: number
  }>({ f1: 0, f2: 0 })

  const [roundStats, setRoundStats] = useState<{
    [round: number]: {
      fighter1Strikes: number
      fighter2Strikes: number
      significantMoments: number
    }
  }>({})
  const [showRoundCard, setShowRoundCard] = useState(false)
  const [lastRound, setLastRound] = useState(0)

  // Update interpolation targets when fight state changes
  useEffect(() => {
    if (!fightState.fighter1 || !fightState.fighter2) return
    const now = Date.now()
    prevPositionsRef.current = {
      f1: { ...renderPositionsRef.current.f1 },
      f2: { ...renderPositionsRef.current.f2 },
      timestamp: now,
    }
  }, [fightState.fighter1?.position.x, fightState.fighter2?.position.x])

  // Detect transitions into 'hit' state → trigger knockback
  useEffect(() => {
    if (!fightState.fighter1 || !fightState.fighter2) return
    const f1State = fightState.fighter1.animation.state
    const f2State = fightState.fighter2.animation.state

    if (f1State === 'hit' && prevAnimRef.current.f1 !== 'hit') {
      knockbackRef.current.f1.velocity = fightState.fighter1.position.facing * -18
    }
    if (f2State === 'hit' && prevAnimRef.current.f2 !== 'hit') {
      knockbackRef.current.f2.velocity = fightState.fighter2.position.facing * -18
    }

    prevAnimRef.current.f1 = f1State
    prevAnimRef.current.f2 = f2State
  }, [fightState.fighter1?.animation.state, fightState.fighter2?.animation.state])

  // Handle round transitions
  useEffect(() => {
    if (fightState.round !== lastRound && fightState.round > 0) {
      setShowRoundCard(true)
      setLastRound(fightState.round)
      onRoundStart?.(fightState.round)
      setTimeout(() => setShowRoundCard(false), 3000)
      setRoundStats(prev => ({
        ...prev,
        [fightState.round]: {
          fighter1Strikes: 0,
          fighter2Strikes: 0,
          significantMoments: 0
        }
      }))
    }
  }, [fightState.round, lastRound, onRoundStart])

  // Enhanced combat detection with proper visual effects
  useEffect(() => {
    if (!fightState.fighter1 || !fightState.fighter2) return
    const canvas = canvasRef.current
    if (!canvas) return

    const f1X = (fightState.fighter1.position.x / 480) * canvas.width
    const f2X = (fightState.fighter2.position.x / 480) * canvas.width
    const contactX = (f1X + f2X) / 2

    const isF1Striking = fightState.fighter1.animation.state === 'punching' || fightState.fighter1.animation.state === 'kicking'
    const isF2Striking = fightState.fighter2.animation.state === 'punching' || fightState.fighter2.animation.state === 'kicking'

    if (isF1Striking) {
      const isHeavy = Math.random() > 0.7
      const isKick = fightState.fighter1.animation.state === 'kicking'
      const impactY = isKick ? canvas.height * 0.68 : canvas.height * 0.62

      addVisualEffect({
        type: 'impact',
        x: contactX,
        y: impactY,
        duration: isHeavy ? 800 : 500,
        intensity: isHeavy ? 1.0 : 0.8
      })

      addVisualEffect({
        type: 'sparks',
        x: contactX,
        y: impactY,
        duration: isHeavy ? 1200 : 800,
        intensity: isHeavy ? 0.9 : 0.6
      })

      if (isHeavy) {
        addVisualEffect({
          type: 'screen_shake',
          x: canvas.width / 2,
          y: canvas.height / 2,
          duration: 300,
          intensity: isKick ? 1.0 : 0.8
        })
      }
    }

    if (isF2Striking) {
      const isHeavy = Math.random() > 0.7
      const isKick = fightState.fighter2.animation.state === 'kicking'
      const impactY = isKick ? canvas.height * 0.68 : canvas.height * 0.62

      addVisualEffect({
        type: 'impact',
        x: contactX,
        y: impactY,
        duration: isHeavy ? 800 : 500,
        intensity: isHeavy ? 1.0 : 0.8
      })

      addVisualEffect({
        type: 'sparks',
        x: contactX,
        y: impactY,
        duration: isHeavy ? 1200 : 800,
        intensity: isHeavy ? 0.9 : 0.6
      })

      if (isHeavy) {
        addVisualEffect({
          type: 'screen_shake',
          x: canvas.width / 2,
          y: canvas.height / 2,
          duration: 300,
          intensity: isKick ? 1.0 : 0.8
        })
      }
    }

    // Detect knockdowns
    if (fightState.fighter1.animation.state === 'down' || fightState.fighter2.animation.state === 'down') {
      const knockedFighter = fightState.fighter1.animation.state === 'down' ? 1 : 2
      const knockerFighter = knockedFighter === 1 ? 2 : 1
      const knockedX = (knockedFighter === 1 ? fightState.fighter1.position.x : fightState.fighter2.position.x / 480) * canvas.width

      addRoundEvent({
        type: 'knockdown',
        severity: 'high',
        description: `${fighters[knockerFighter - 1].name} SCORES A KNOCKDOWN!`,
        fighter: knockerFighter
      })

      addVisualEffect({ type: 'impact', x: knockedX, y: canvas.height * 0.65, duration: 2000, intensity: 1.0 })
      addVisualEffect({ type: 'blood', x: knockedX, y: canvas.height * 0.60, duration: 3000, intensity: 0.8 })
      addVisualEffect({ type: 'stars', x: knockedX, y: canvas.height * 0.50, duration: 4000, intensity: 1.0 })
      onSignificantMoment?.('knockdown', 'high')
    }

    // Blood effects on hits when HP is low
    if (fightState.fighter1.animation.state === 'hit' && fightState.fighter1.hp < FIGHTER_MAX_HP * 0.6) {
      const hitX = (fightState.fighter1.position.x / 480) * canvas.width
      addVisualEffect({ type: 'blood', x: hitX, y: canvas.height * 0.60, duration: 1500, intensity: 0.6 })
    }
    if (fightState.fighter2.animation.state === 'hit' && fightState.fighter2.hp < FIGHTER_MAX_HP * 0.6) {
      const hitX = (fightState.fighter2.position.x / 480) * canvas.width
      addVisualEffect({ type: 'blood', x: hitX, y: canvas.height * 0.60, duration: 1500, intensity: 0.6 })
    }

    // Block flash effects
    if (fightState.fighter1.animation.state === 'blocking') {
      const blockX = (fightState.fighter1.position.x / 480) * canvas.width
      addVisualEffect({ type: 'block_flash', x: blockX, y: canvas.height * 0.60, duration: 300, intensity: 0.7 })
    }
    if (fightState.fighter2.animation.state === 'blocking') {
      const blockX = (fightState.fighter2.position.x / 480) * canvas.width
      addVisualEffect({ type: 'block_flash', x: blockX, y: canvas.height * 0.60, duration: 300, intensity: 0.7 })
    }

    // Combo detection
    if (fightState.fighter1.combo.count > 3 || fightState.fighter2.combo.count > 3) {
      const comboFighter = fightState.fighter1.combo.count > 3 ? 1 : 2
      const comboX = (comboFighter === 1 ? fightState.fighter1.position.x : fightState.fighter2.position.x / 480) * canvas.width

      addRoundEvent({
        type: 'combo',
        severity: 'medium',
        description: `${fighters[comboFighter - 1].name} lands a devastating combo!`,
        fighter: comboFighter
      })
      addVisualEffect({ type: 'combo_explosion', x: comboX, y: canvas.height * 0.65, duration: 1200, intensity: 0.9 })
    }
  }, [fightState.fighter1?.hp, fightState.fighter2?.hp, fightState.fighter1?.animation, fightState.fighter2?.animation])

  // Canvas setup and animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false

    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.clientWidth
        canvas.height = parent.clientHeight
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const animate = () => {
      // Update knockback physics each render frame
      for (const key of ['f1', 'f2'] as const) {
        const kb = knockbackRef.current[key]
        kb.offset += kb.velocity
        kb.velocity *= 0.85 // friction
        kb.offset *= 0.92   // spring back to center
        kb.offset = clamp(kb.offset, -30, 30)
        if (Math.abs(kb.offset) < 0.5 && Math.abs(kb.velocity) < 0.5) {
          kb.offset = 0
          kb.velocity = 0
        }
      }

      drawEnhancedFrame(ctx, canvas.width, canvas.height)
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [fightState, fighters, visualEffects])

  const addRoundEvent = (event: Omit<RoundEvent, 'id' | 'round' | 'timestamp'>) => {
    const newEvent: RoundEvent = {
      id: Date.now().toString(),
      round: fightState.round,
      timestamp: Date.now(),
      ...event
    }
    setRoundEvents(prev => [newEvent, ...prev.slice(0, 9)])
    setRoundStats(prev => {
      const currentRoundStats = prev[fightState.round] || { fighter1Strikes: 0, fighter2Strikes: 0, significantMoments: 0 }
      const fighterKey = event.fighter === 1 ? 'fighter1Strikes' : 'fighter2Strikes'
      return {
        ...prev,
        [fightState.round]: {
          ...currentRoundStats,
          [fighterKey]: currentRoundStats[fighterKey] + 1,
          significantMoments: currentRoundStats.significantMoments + 1
        }
      }
    })
  }

  const addVisualEffect = (effect: Omit<VisualEffect, 'id'>) => {
    const newEffect: VisualEffect = {
      id: Date.now().toString(),
      ...effect
    }
    setVisualEffects(prev => [...prev, newEffect])
    setTimeout(() => {
      setVisualEffects(prev => prev.filter(e => e.id !== newEffect.id))
    }, effect.duration)
  }

  // ── Compute animation progress from engine state ──────────────────────────
  // The fight engine provides frameCount (elapsed) and duration (remaining).
  // Total frames = frameCount + duration. Progress = frameCount / total.
  const getAnimProgress = (fighterState: typeof fightState.fighter1): number => {
    const { frameCount, duration } = fighterState.animation
    const total = frameCount + duration
    if (total <= 0) return 0
    return clamp(frameCount / total, 0, 1)
  }

  // ── Determine which phase of an attack we're in ───────────────────────────
  const getAttackPhase = (t: number, attackType: string): 'startup' | 'active' | 'hold' | 'recovery' => {
    const phases = ATTACK_PHASES[attackType] || ATTACK_PHASES.jab
    if (t < phases.startup) return 'startup'
    if (t < phases.active) return 'active'
    if (t < phases.hold) return 'hold'
    return 'recovery'
  }

  // ── Sub-progress within a phase (0→1 within that phase) ───────────────────
  const getPhaseProgress = (t: number, attackType: string, phase: 'startup' | 'active' | 'hold' | 'recovery'): number => {
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

  const drawEnhancedFrame = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, '#000814')
    gradient.addColorStop(0.6, '#001d3d')
    gradient.addColorStop(1, '#003566')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    drawEnhancedRing(ctx, width, height)
    drawCrowdAtmosphere(ctx, width, height)

    if (fightState.fighter1 && fightState.fighter2) {
      drawEnhancedFighter(ctx, fightState.fighter1, fighters[0], width, height, '#ff4444', 1)
      drawEnhancedFighter(ctx, fightState.fighter2, fighters[1], width, height, '#4488ff', 2)
    }

    drawVisualEffects(ctx)
    drawSF2HUD(ctx, width, height)
  }

  const drawEnhancedRing = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const floorY = height * 0.75
    const ringWidth = width * 0.9
    const ringX = width * 0.05

    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.fillRect(ringX + 5, floorY + 5, ringWidth, height * 0.2)

    const floorGradient = ctx.createLinearGradient(ringX, floorY, ringX, floorY + height * 0.2)
    floorGradient.addColorStop(0, '#2a1810')
    floorGradient.addColorStop(0.5, '#1a1008')
    floorGradient.addColorStop(1, '#0f0504')
    ctx.fillStyle = floorGradient
    ctx.fillRect(ringX, floorY, ringWidth, height * 0.2)

    ctx.fillStyle = 'rgba(255,255,255,0.02)'
    for (let i = 0; i < 10; i++) {
      ctx.fillRect(ringX + (ringWidth / 10) * i, floorY, 1, height * 0.2)
    }

    const ropeColors = ['#ff4444', '#ffaa44', '#44ff44']
    for (let i = 1; i <= 3; i++) {
      const ropeY = floorY - i * (height * 0.08)
      ctx.shadowBlur = 10
      ctx.shadowColor = ropeColors[i - 1]
      ctx.strokeStyle = ropeColors[i - 1]
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(ringX, ropeY)
      ctx.lineTo(ringX + ringWidth, ropeY)
      ctx.stroke()
    }
    ctx.shadowBlur = 0

    ctx.fillStyle = '#333'
    ctx.fillRect(ringX - 8, floorY - height * 0.26, 8, height * 0.26)
    ctx.fillRect(ringX + ringWidth, floorY - height * 0.26, 8, height * 0.26)

    ctx.fillStyle = '#00ff88'
    for (let i = 0; i < 5; i++) {
      const ledY = floorY - height * 0.24 + i * (height * 0.04)
      ctx.fillRect(ringX - 6, ledY, 4, 2)
      ctx.fillRect(ringX + ringWidth + 2, ledY, 4, 2)
    }

    ctx.save()
    ctx.shadowBlur = 20
    ctx.shadowColor = '#ff4444'
    ctx.font = 'bold 36px "Press Start 2P"'
    ctx.fillStyle = 'rgba(255,68,68,0.1)'
    ctx.textAlign = 'center'
    ctx.fillText('MFC', width / 2, floorY + height * 0.1)
    ctx.font = 'bold 12px "Press Start 2P"'
    ctx.fillText('FIGHTING CHAMPIONSHIP', width / 2, floorY + height * 0.15)
    ctx.restore()
  }

  const drawCrowdAtmosphere = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const time = Date.now() * 0.001
    const fightIntensity = 1 - (Math.min(fightState.fighter1?.hp || FIGHTER_MAX_HP, fightState.fighter2?.hp || FIGHTER_MAX_HP) / FIGHTER_MAX_HP)
    const crowdExcitement = 0.3 + fightIntensity * 0.7

    for (let i = 0; i < width; i += 20) {
      const baseHeight = 40 + Math.sin(i * 0.1) * 15
      const animatedHeight = baseHeight + Math.sin(time * 3 + i * 0.1) * crowdExcitement * 10
      const crowdY = height * 0.35
      const alpha = 0.15 + crowdExcitement * 0.15
      const crowdGrad = ctx.createLinearGradient(i, crowdY, i, crowdY + animatedHeight)
      crowdGrad.addColorStop(0, `rgba(20,20,30,${alpha})`)
      crowdGrad.addColorStop(1, 'rgba(20,20,30,0)')
      ctx.fillStyle = crowdGrad
      ctx.fillRect(i, crowdY, 15, animatedHeight)
    }

    if (Math.random() < fightIntensity * 0.02) {
      const flashX = Math.random() * width
      const flashY = height * (0.1 + Math.random() * 0.15)
      ctx.fillStyle = `rgba(255,255,255,${0.6 + Math.random() * 0.4})`
      ctx.beginPath()
      ctx.arc(flashX, flashY, 2 + Math.random() * 3, 0, Math.PI * 2)
      ctx.fill()
    }

    const lightPositions = [width * 0.2, width * 0.5, width * 0.8]
    lightPositions.forEach((lx, index) => {
      const baseIntensity = 0.8 + Math.sin(time + index) * 0.2
      const excitedIntensity = baseIntensity + crowdExcitement * 0.4
      const lightGradient = ctx.createRadialGradient(lx, height * 0.1, 0, lx, height * 0.1, 150)
      lightGradient.addColorStop(0, `rgba(255,255,255,${excitedIntensity * 0.4})`)
      lightGradient.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = lightGradient
      ctx.fillRect(lx - 150, height * 0.1, 300, height * 0.4)

      if (fightIntensity > 0.6) {
        const beamGradient = ctx.createLinearGradient(lx, height * 0.1, lx, height * 0.6)
        beamGradient.addColorStop(0, `rgba(255,255,200,${excitedIntensity * 0.1})`)
        beamGradient.addColorStop(1, 'rgba(255,255,200,0)')
        ctx.fillStyle = beamGradient
        ctx.fillRect(lx - 30, height * 0.1, 60, height * 0.5)
      }
    })

    if (fightIntensity > 0.4) {
      ctx.strokeStyle = `rgba(255,255,255,${crowdExcitement * 0.1})`
      ctx.lineWidth = 1
      for (let i = 0; i < 5; i++) {
        const waveY = height * 0.1 + i * 8
        ctx.beginPath()
        for (let wx = 0; wx < width; wx += 5) {
          const waveHeight = Math.sin((wx + time * 200) * 0.02 + i) * crowdExcitement * 3
          if (wx === 0) ctx.moveTo(wx, waveY + waveHeight)
          else ctx.lineTo(wx, waveY + waveHeight)
        }
        ctx.stroke()
      }
    }
  }

  const drawEnhancedFighter = (
    ctx: CanvasRenderingContext2D,
    fighterState: typeof fightState.fighter1,
    fighterData: Fighter,
    width: number,
    height: number,
    color: string,
    fighterNumber: 1 | 2
  ) => {
    const floorY = height * 0.75

    // Interpolate position for smooth motion between 80ms fight ticks
    const targetX = (fighterState.position.x / 480) * width
    const posKey = fighterNumber === 1 ? 'f1' : 'f2'
    const prev = prevPositionsRef.current
    const TICK_MS = 80

    if (prev) {
      const elapsed = Date.now() - prev.timestamp
      const t = Math.min(1, elapsed / TICK_MS)
      const smooth = t * t * (3 - 2 * t) // smoothstep
      renderPositionsRef.current[posKey].x += (targetX - renderPositionsRef.current[posKey].x) * smooth
    } else {
      renderPositionsRef.current[posKey].x = targetX
    }

    // Apply knockback offset
    const knockbackOffset = knockbackRef.current[posKey].offset
    const baseX = renderPositionsRef.current[posKey].x + knockbackOffset
    const baseY = floorY - 20

    // Hit-stop: when hitStopFrames > 0, add vibration but freeze pose
    // SF2: 1-2 pixel horizontal oscillation on both sprites during freeze
    const isInHitStop = fighterState.modifiers.hitStopFrames > 0
    let hitStopVibX = 0
    let hitStopVibY = 0
    if (isInHitStop) {
      const vibTime = Date.now() * 0.06
      hitStopVibX = Math.sin(vibTime) * 2.0  // SF2-style horizontal vibration
      hitStopVibY = Math.cos(vibTime * 1.5) * 1.0
    }

    const x = baseX + hitStopVibX
    const y = baseY + hitStopVibY

    ctx.save()

    // Enhanced screen shake for heavy hits — coherent sine-based instead of random
    if (fighterState.animation.state === 'hit') {
      const time = Date.now() * 0.001
      const animProgress = getAnimProgress(fighterState)
      // Exponential decay: shake hard initially, fade out
      const decay = Math.exp(-animProgress * 3)
      const shakeIntensity = (fighterState.hp < FIGHTER_MAX_HP * 0.25 ? 10 : 6) * decay
      const shakePhase = time * 25
      ctx.translate(
        Math.sin(shakePhase) * shakeIntensity,
        Math.cos(shakePhase * 1.3) * shakeIntensity * 0.7
      )
      ctx.globalAlpha = 0.8 + animProgress * 0.2
    }

    // SF2: Defender white flash — flash the sprite white on initial hit impact
    const isHitFlash = fighterState.animation.state === 'hit' && isInHitStop

    if (fighterState.animation.state === 'down') {
      const time = Date.now() * 0.001
      ctx.translate(
        Math.sin(time * 10) * 12,
        Math.cos(time * 8) * 6
      )
    }

    ctx.globalAlpha *= Math.max(0.7, fighterState.stamina / 100)

    // Shadow — wider to match beefier fighter silhouette
    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.save()
    ctx.scale(1, 0.2)
    ctx.beginPath()
    ctx.arc(x, (floorY + 10) / 0.2, 30 * FIGHTER_SCALE, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // Compute animation progress (used by drawHumanoidFighter)
    let animProgress = getAnimProgress(fighterState)

    // Hit-stop freeze: if in hit-stop, cache and use the frozen progress
    if (isInHitStop) {
      if (hitStopProgressRef.current[posKey] === 0 && animProgress > 0) {
        hitStopProgressRef.current[posKey] = animProgress
      }
      animProgress = hitStopProgressRef.current[posKey]
    } else {
      hitStopProgressRef.current[posKey] = 0
    }

    // Forward lunge: during active/hold phase, the whole body steps toward the opponent
    let lungeOffset = 0
    const isAttacking = fighterState.animation.state === 'punching' || fighterState.animation.state === 'kicking'
    if (isAttacking && animProgress > 0) {
      const atkType = fighterState.animation.attackType || 'jab'
      const phase = getAttackPhase(animProgress, atkType)
      const phaseT = getPhaseProgress(animProgress, atkType, phase)
      const lungeDistance = fighterState.animation.state === 'kicking' ? 38 : 30
      if (phase === 'startup') {
        lungeOffset = fighterState.position.facing * lerp(0, -4, easeInQuad(phaseT))
      } else if (phase === 'active') {
        lungeOffset = fighterState.position.facing * lerp(-4, lungeDistance, easeOutCubic(phaseT))
      } else if (phase === 'hold') {
        lungeOffset = fighterState.position.facing * lungeDistance
      } else {
        lungeOffset = fighterState.position.facing * lerp(lungeDistance, 0, easeInOutQuad(phaseT))
      }
    }

    // Scale the fighter up — anchor at feet so they grow upward
    const feetY = y + 25 // approximate feet position
    const drawX = x + lungeOffset
    ctx.save()
    ctx.translate(drawX, feetY)
    ctx.scale(FIGHTER_SCALE, FIGHTER_SCALE)
    ctx.translate(-drawX, -feetY)

    // SF2 white flash: when in hit-stop, flicker the fighter color to white
    const drawColor = isHitFlash && Math.sin(Date.now() * 0.02) > 0 ? '#ffffff' : color
    const palette = getFighterPalette(fighterData.id)
    const hairStyle = getFighterHairStyle(fighterData.id)
    drawHumanoidFighter(ctx, drawX, y, drawColor, fighterState, fighterNumber, animProgress, fighterData.stats, palette, hairStyle)

    // Hit spark — drawn inside scale transform so it matches fighter size
    if (isHitFlash) {
      const sparkX = drawX + fighterState.position.facing * 30 // in front of fighter
      const sparkY = y - 20
      const sparkTime = Date.now() * 0.01
      const sparkSize = 8 + Math.sin(sparkTime * 3) * 4
      ctx.save()
      ctx.fillStyle = '#fff'
      ctx.fillRect(sparkX - sparkSize, sparkY - 2, sparkSize * 2, 4)
      ctx.fillRect(sparkX - 2, sparkY - sparkSize, 4, sparkSize * 2)
      ctx.fillStyle = '#ffdd00'
      ctx.fillRect(sparkX - sparkSize * 0.7, sparkY - sparkSize * 0.7, 3, 3)
      ctx.fillRect(sparkX + sparkSize * 0.7, sparkY - sparkSize * 0.7, 3, 3)
      ctx.fillRect(sparkX - sparkSize * 0.7, sparkY + sparkSize * 0.7, 3, 3)
      ctx.fillRect(sparkX + sparkSize * 0.7, sparkY + sparkSize * 0.7, 3, 3)
      ctx.restore()
    }

    // Motion trails — inside scale transform so they match fighter position
    if (fighterState.animation.state === 'punching') {
      drawMotionTrail(ctx, drawX, y, fighterState.position.facing, 'punching')
    }
    if (fighterState.animation.state === 'kicking') {
      drawMotionTrail(ctx, drawX, y, fighterState.position.facing, 'kicking')
    }

    ctx.restore() // end scale transform

    // Sweat particles at screen scale (not fighter scale)
    if (fighterState.hp < FIGHTER_MAX_HP * 0.5) {
      drawSweatParticles(ctx, x, y - 80 * FIGHTER_SCALE)
    }

    ctx.restore()

    drawEnhancedFighterInfo(ctx, fighterData, fighterState, x, y - 80 * FIGHTER_SCALE, color, fighterNumber)
  }

  // ── Main humanoid fighter drawing with frame-based keyframe animation ─────
  // fighterStats drives visual differentiation per GDD: "two different fighters
  // should look and fight differently based on their stats and gear."
  const drawHumanoidFighter = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    fighterState: typeof fightState.fighter1,
    fighterNumber: 1 | 2,
    animProgress: number,
    fighterStats?: Fighter['stats'],
    palette?: SkinPalette,
    hairStyle?: HairStyle
  ) => {
    const skin = palette || SKIN_PALETTES[0]
    const hair = hairStyle || 'full'
    const facing = fighterState.position.facing
    const state = fighterState.animation.state
    const attackType = fighterState.animation.attackType || 'jab'

    // Stat-driven modifiers: each maps a 0-100 stat to a multiplier range
    const spdMod = fighterStats ? statMod(fighterStats.speed, 0.7, 1.4) : 1.0
    const agrMod = fighterStats ? statMod(fighterStats.aggression, 0.6, 1.5) : 1.0
    const strMod = fighterStats ? statMod(fighterStats.strength, 0.85, 1.15) : 1.0
    const defMod = fighterStats ? statMod(fighterStats.defense, 0.8, 1.3) : 1.0

    ctx.save()

    let headY = y - 50
    let torsoY = y - 35
    let armY = y - 30    // shoulder attachment Y
    let legY = y - 10    // hip attachment Y
    let bodyLean = 0

    // ── Joint angles: 8 DOF (4 limbs × 2 joints each) ──────────────────
    // Shoulder/Hip: degrees from vertical (0=down, 90=horizontal)
    // Elbow/Knee: degrees of bend (0=straight, higher=more bent)
    let fShA = 55, fElB = 110   // front arm: shoulder angle, elbow bend (guard default)
    let bShA = 45, bElB = 120   // back arm (slightly different for asymmetry)
    let fHiA = -10, fKnB = 20   // front leg: forward toward opponent (negative)
    let bHiA = 8, bKnB = 25     // back leg: behind fighter (positive)
    let punchGlow = false
    let kickGlow = false

    switch (state) {
      case 'idle': {
        // SF2-style fighting crouch with jointed limbs
        // Asymmetric timing (slow rise, fast fall = gravity feel)
        const time = Date.now() * 0.001
        const cycleSpeed = 3.5 * spdMod
        const phase = ((time * cycleSpeed + fighterNumber * Math.PI) % (Math.PI * 2)) / (Math.PI * 2)
        const bounceAmp = 4.0 * agrMod    // bigger bounce for more visible idle
        let bounce: number
        if (phase < 0.55) {
          bounce = Math.sin((phase / 0.55) * Math.PI * 0.5) * bounceAmp
        } else {
          bounce = Math.cos(((phase - 0.55) / 0.45) * Math.PI * 0.5) * bounceAmp
        }
        const crouchDepth = 5 * agrMod
        headY += bounce * 0.3 + crouchDepth * 0.3
        torsoY += bounce * 0.7 + crouchDepth * 0.5
        armY += bounce * 1.5 + crouchDepth * 0.3
        legY += bounce * 0.5 - crouchDepth * 0.2
        bodyLean = facing * 6 * agrMod

        // Arms: fighting guard — bent elbows, fists near chin, bobbing
        const defBoost = (defMod - 1) * 8
        fShA = 55 + bounce * 3 + defBoost
        fElB = 110 + bounce * 5 + defBoost * 1.5
        bShA = 45 + bounce * 2 + defBoost * 0.7
        bElB = 120 + bounce * 4 + defBoost

        // Legs: fighting crouch — front leg forward, back leg behind
        fHiA = -10
        fKnB = 20 + bounce * 2 + crouchDepth * 0.5
        bHiA = 8
        bKnB = 25 + bounce * 3 + crouchDepth * 0.5
        break
      }

      case 'punching': {
        punchGlow = true
        const params = PUNCH_PARAMS[attackType] || PUNCH_PARAMS.jab
        const phase = getAttackPhase(animProgress, attackType)
        const phaseT = getPhaseProgress(animProgress, attackType, phase)
        const isHook = attackType === 'hook'
        const isUppercut = attackType === 'uppercut'

        // Back arm stays in guard throughout
        bShA = 55; bElB = 125

        // Legs: planted deep for stability (front forward, back behind)
        fHiA = -12; fKnB = 25 * strMod
        bHiA = 10; bKnB = 30 * strMod

        // Target pose at full extension — NEGATIVE angle = toward opponent
        const targetShA = -params.armAngle
        const targetElB = isHook ? 75 : isUppercut ? 25 : 5

        switch (phase) {
          case 'startup': {
            const t = easeInQuad(phaseT)
            // Chamber: pull arm BACK tight (positive = behind body = wind-up)
            fShA = lerp(55, 70, t)
            fElB = lerp(110, 140, t)
            bodyLean = facing * lerp(0, params.windUpLean, t)
            headY -= lerp(0, params.headDip * 0.3, t)
            torsoY += lerp(0, 3, t)
            break
          }
          case 'active': {
            // SNAP TO POSE — full extension in first 15% of active phase
            const t = phaseT < 0.15 ? phaseT / 0.15 : 1.0
            fShA = lerp(70, targetShA, t)
            fElB = lerp(140, targetElB, t)
            bodyLean = facing * lerp(params.windUpLean, params.bodyLean * strMod, t)
            headY -= lerp(params.headDip * 0.3, params.headDip, t)
            torsoY += lerp(3, -1, t)
            break
          }
          case 'hold': {
            fShA = targetShA
            fElB = targetElB
            bodyLean = facing * params.bodyLean * strMod
            headY -= params.headDip
            torsoY -= 1
            break
          }
          case 'recovery': {
            const t = easeInOutQuad(phaseT)
            fShA = lerp(targetShA, 55, t)
            fElB = lerp(targetElB, 110, t)
            bodyLean = facing * lerp(params.bodyLean * strMod, 3, t)
            headY -= lerp(params.headDip, 0, t)
            torsoY -= lerp(1, 0, t)
            break
          }
        }
        break
      }

      case 'kicking': {
        kickGlow = true
        const params = KICK_PARAMS[attackType] || KICK_PARAMS.kick
        const phase = getAttackPhase(animProgress, attackType)
        const phaseT = getPhaseProgress(animProgress, attackType, phase)
        const isRoundhouse = attackType === 'roundhouse'

        // Arms: raise for balance, open guard
        fShA = 40; fElB = 90
        bShA = 55; bElB = 80

        // Plant leg: back leg stays grounded (positive = behind)
        bHiA = 5; bKnB = 22

        // Target kick angles — NEGATIVE = toward opponent
        const targetHiA = -params.legAngle
        const targetKnB = isRoundhouse ? 5 : 8

        switch (phase) {
          case 'startup': {
            // CHAMBER: knee comes UP, leg bends TIGHT — classic Muay Thai chamber
            const t = easeInQuad(phaseT)
            fHiA = lerp(-10, -50, t)
            fKnB = lerp(20, 95, t)   // tight chamber — knee bent ~95°
            bodyLean = facing * lerp(0, params.bodyLean * 0.3, t)
            armY -= lerp(0, params.armRaise * 0.5, t)
            headY += lerp(0, 2, t)
            break
          }
          case 'active': {
            // SNAP: extend from chamber — this is the money shot
            const t = phaseT < 0.15 ? phaseT / 0.15 : 1.0
            fHiA = lerp(-50, targetHiA, t)
            fKnB = lerp(95, targetKnB, t)
            bodyLean = facing * lerp(params.bodyLean * 0.3, params.bodyLean * strMod, t)
            armY -= lerp(params.armRaise * 0.5, params.armRaise, t)
            headY += lerp(2, 0, t)
            break
          }
          case 'hold': {
            fHiA = targetHiA
            fKnB = targetKnB
            bodyLean = facing * params.bodyLean * strMod
            armY -= params.armRaise
            break
          }
          case 'recovery': {
            // Return THROUGH chamber (40%) then to stance (60%)
            const t = easeInOutQuad(phaseT)
            if (t < 0.4) {
              const rt = t / 0.4
              fHiA = lerp(targetHiA, -40, rt)
              fKnB = lerp(targetKnB, 70, rt)
            } else {
              const rt = (t - 0.4) / 0.6
              fHiA = lerp(-40, -10, rt)
              fKnB = lerp(70, 20, rt)
            }
            bodyLean = facing * lerp(params.bodyLean * strMod, 0, t)
            armY -= lerp(params.armRaise, 0, t)
            break
          }
        }
        break
      }

      case 'hit': {
        const recoilT = animProgress < 0.15
          ? easeOutBack(animProgress / 0.15)
          : animProgress < 0.4
            ? 1.0
            : lerp(1, 0, easeInOutQuad((animProgress - 0.4) / 0.6))

        bodyLean = -facing * 25 * recoilT
        headY += 14 * recoilT
        torsoY += 5 * recoilT
        armY += 8 * recoilT
        legY += 3 * recoilT

        // Arms go slack — drop from guard (visible difference from guarding)
        fShA = lerp(55, 25, recoilT)
        fElB = lerp(110, 40, recoilT)
        bShA = lerp(45, 20, recoilT)
        bElB = lerp(120, 35, recoilT)

        // Knees buckle visibly
        fKnB = 20 + 18 * recoilT
        bKnB = 25 + 12 * recoilT

        if (animProgress > 0.4) {
          const staggerPhase = (animProgress - 0.4) / 0.6
          const stagger = Math.sin(staggerPhase * Math.PI * 3) * 4 * (1 - staggerPhase)
          headY += stagger
        }
        break
      }

      case 'blocking': {
        const blockT = animProgress < 0.2
          ? easeOutCubic(animProgress / 0.2)
          : animProgress > 0.8
            ? lerp(1, 0, easeInOutQuad((animProgress - 0.8) / 0.2))
            : 1

        // High guard: elbows VERY tight, fists covering face
        fShA = lerp(55, 70 * defMod, blockT)
        fElB = lerp(110, 140 * defMod, blockT)
        bShA = lerp(45, 65 * defMod, blockT)
        bElB = lerp(120, 145 * defMod, blockT)
        bodyLean = -facing * 4 * blockT
        headY += 2 * blockT

        // Legs: brace and sink slightly
        fKnB = 20 + 10 * blockT
        bKnB = 25 + 8 * blockT
        break
      }

      case 'dodging': {
        const dodgeT = animProgress < 0.25
          ? easeOutCubic(animProgress / 0.25)
          : lerp(1, 0, easeInOutQuad((animProgress - 0.25) / 0.75))

        headY += 15 * dodgeT
        torsoY += 8 * dodgeT
        bodyLean = -facing * 18 * dodgeT

        // Arms tuck in during dodge
        fShA = lerp(55, 30, dodgeT)
        fElB = lerp(110, 135, dodgeT)
        bShA = lerp(45, 25, dodgeT)
        bElB = lerp(120, 135, dodgeT)

        // Deep duck — knees bend hard
        fKnB = 20 + 22 * dodgeT
        bKnB = 25 + 18 * dodgeT
        break
      }

      case 'walking': {
        const total = fighterState.animation.frameCount + fighterState.animation.duration
        const walkDir = fighterState.animation.walkDirection || 'forward'
        const isForward = walkDir === 'forward'
        const walkPhase = total > 0 ? (fighterState.animation.frameCount / total) * Math.PI * 2 : 0

        const strideScale = strMod
        const swingAngle = (isForward ? 25 : 15) * strideScale

        // Leg swing with visible knee bends
        const legSwing = Math.sin(walkPhase) * swingAngle
        const oppLegSwing = Math.sin(walkPhase + Math.PI) * swingAngle
        const kneeOnPlant = Math.abs(Math.cos(walkPhase)) * 18

        fHiA = legSwing
        fKnB = 15 + kneeOnPlant
        bHiA = oppLegSwing
        bKnB = 15 + Math.abs(Math.cos(walkPhase + Math.PI)) * 18

        // Arm counter-swing (opposite to legs)
        const armSwing = Math.sin(walkPhase + Math.PI) * 15
        const oppArmSwing = Math.sin(walkPhase) * 15

        if (isForward) {
          fShA = 55 + armSwing
          fElB = 100 + armSwing * 0.5
          bShA = 45 + oppArmSwing
          bElB = 100 + oppArmSwing * 0.5
          bodyLean = facing * 8 * agrMod
        } else {
          fShA = 60 + armSwing * 0.5
          fElB = 115
          bShA = 50 + oppArmSwing * 0.5
          bElB = 115
          bodyLean = facing * -4 * defMod
        }

        // Vertical bob
        const normalizedPhase = (walkPhase % (Math.PI * 2)) / (Math.PI * 2)
        const bobAmp = 3 * strMod
        let verticalBob: number
        if (normalizedPhase < 0.4) {
          verticalBob = -Math.sin((normalizedPhase / 0.4) * Math.PI * 0.5) * bobAmp
        } else {
          verticalBob = -Math.cos(((normalizedPhase - 0.4) / 0.6) * Math.PI * 0.5) * bobAmp
        }
        torsoY += verticalBob * 0.7
        headY += verticalBob * 0.2
        armY += verticalBob * 0.8
        legY += verticalBob * 0.3
        break
      }

      case 'down': {
        drawKnockedDownHumanoid(ctx, x, y, color, 0, skin)
        ctx.restore()
        return
      }
    }

    // Apply body lean rotation
    ctx.translate(x, y)
    ctx.rotate(bodyLean * Math.PI / 180)
    ctx.translate(-x, -y)

    // Draw body parts back-to-front with joint angles
    // Wider leg stance (±20px) for SF2 fighting game look

    // Back leg
    const backLegX = facing === 1 ? x - 20 : x + 20
    drawLeg(ctx, backLegX, legY, color, facing, bHiA, bKnB, skin, false)

    // Back arm
    const backArmX = facing === 1 ? x - 26 : x + 26
    drawArm(ctx, backArmX, armY, color, facing, bShA, bElB, skin, false)

    // Torso
    drawTorso(ctx, x, torsoY, color, state, skin)

    // Head
    drawHead(ctx, x, headY, color, facing, state, fighterState.hp, skin, hair)

    // Front arm (punching arm)
    const frontArmX = facing === 1 ? x + 26 : x - 26
    drawArm(ctx, frontArmX, armY, color, facing, fShA, fElB, skin, punchGlow)

    // Front leg (kicking leg)
    const frontLegX = facing === 1 ? x + 20 : x - 20
    drawLeg(ctx, frontLegX, legY, color, facing, fHiA, fKnB, skin, kickGlow)

    ctx.restore()
  }

  // Pixel size constant for 16-bit sprite look
  const P = 4

  const px = (ctx: CanvasRenderingContext2D, x: number, y: number, c: string) => {
    ctx.fillStyle = c
    ctx.fillRect(x, y, P, P)
  }

  const pxo = (ctx: CanvasRenderingContext2D, x: number, y: number, c: string) => {
    ctx.fillStyle = '#111'
    ctx.fillRect(x - 1, y - 1, P + 2, P + 2)
    ctx.fillStyle = c
    ctx.fillRect(x, y, P, P)
  }

  const drawSprite = (ctx: CanvasRenderingContext2D, ox: number, oy: number, grid: string[][]) => {
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const c = grid[row][col]
        if (c) px(ctx, ox + col * P, oy + row * P, c)
      }
    }
  }

  const shade = (hex: string): string => {
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 40)
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 40)
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 40)
    return `rgb(${r},${g},${b})`
  }

  const highlight = (hex: string): string => {
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + 50)
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + 50)
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + 50)
    return `rgb(${r},${g},${b})`
  }

  const drawHead = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, facing: number, state: string, hp: number, palette?: SkinPalette, hairStyle?: HairStyle) => {
    const O = '#111'
    const C = color       // hair/headband color
    const Cs = shade(color)
    const Ch = highlight(color)
    const p = palette || SKIN_PALETTES[0]
    const SK = p.base
    const SS = p.shadow
    const SH = p.highlight
    const W = '#fff'
    const hs = hairStyle || 'full'

    // Head: 7x10 grid — hair, headband, face, chin, neck
    // Slightly narrower than old 8-wide for better head:shoulder ratio (7:12 = 1.71x)
    const ox = x - P * 3 - P / 2
    const oy = y - P * 5

    // Hair style variants — different top 3 rows
    let hairRows: string[][]
    switch (hs) {
      case 'mohawk':
        hairRows = [
          ['', '', '',  C, '', '', ''],        // mohawk spike
          ['', '', '',  C, '', '', ''],        // mohawk
          ['',  O, SK,  C, SK, SK,  O],        // sides shaved
        ]
        break
      case 'short':
        hairRows = [
          ['', '',  O,  O,  O, '', ''],        // close-cropped top
          ['',  O,  C,  C,  C,  O, ''],        // thin layer
          [ O,  C,  C,  C,  C,  C,  O],        // close-cropped
        ]
        break
      case 'bald':
        hairRows = [
          ['', '',  O,  O,  O, '', ''],        // skull curve
          ['',  O, SH, SH, SH,  O, ''],       // scalp
          [ O, SH, SH, SH, SH, SH,  O],      // scalp
        ]
        break
      case 'shaggy':
        hairRows = [
          ['',  C,  C,  C,  C,  C, ''],        // wider messy top
          [ C,  C,  C,  C,  C,  C,  C],        // overhanging
          [ C,  C,  C,  C,  C,  C,  C],        // full coverage
        ]
        break
      default: // 'full'
        hairRows = [
          ['', '',  O,  O,  O, '', ''],        // hair top
          ['',  O,  C,  C,  C,  O, ''],        // hair
          [ O,  C,  C,  C,  C,  C,  O],        // hair full width
        ]
    }

    const head: string[][] = [
      ...hairRows,
      [ O, Ch,  C,  C,  C, Cs,  O],        // headband (fighter color)
      [ O, SH, SK, SK, SK, SS,  O],        // forehead
      [ O, SK, SK, SK, SK, SK,  O],        // eyes line
      [ O, SK, SK, SK, SK, SK,  O],        // nose
      [ O, SK, SK, SK, SK, SK,  O],        // mouth
      ['',  O, SK, SK, SK,  O, ''],        // chin
      ['', '',  O,  O,  O, '', ''],        // neck
    ]
    drawSprite(ctx, ox, oy, head)

    // Eyes and mouth — positioned within the 7-wide grid (inner cols 1-5)
    if (state === 'hit') {
      // X eyes + open mouth
      px(ctx, ox + P * 1, oy + P * 5, '#ff0')
      px(ctx, ox + P * 5, oy + P * 5, '#ff0')
      px(ctx, ox + P * 2, oy + P * 7, '#c00')
      px(ctx, ox + P * 3, oy + P * 7, '#c00')
      px(ctx, ox + P * 4, oy + P * 7, '#c00')
    } else if (hp < FIGHTER_MAX_HP * 0.25) {
      // Tired squint eyes + blood drip
      px(ctx, ox + P * 1, oy + P * 5, '#800')
      px(ctx, ox + P * 5, oy + P * 5, '#800')
      px(ctx, ox + P * 3, oy + P * 7, '#c00')
    } else {
      // Normal eyes: white with dark pupil
      px(ctx, ox + P * 1, oy + P * 5, W)
      px(ctx, ox + P * 5, oy + P * 5, W)
      const pupilOff = facing > 0 ? 1 : 0
      px(ctx, ox + P * (1 + pupilOff), oy + P * 5, '#111')
      px(ctx, ox + P * (5 - (1 - pupilOff)), oy + P * 5, '#111')
      // Determined mouth — tight line
      px(ctx, ox + P * 2, oy + P * 7, '#444')
      px(ctx, ox + P * 3, oy + P * 7, '#333')
      px(ctx, ox + P * 4, oy + P * 7, '#444')
    }
  }

  const drawTorso = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, state: string, palette?: SkinPalette) => {
    const O = '#111'
    const p = palette || SKIN_PALETTES[0]
    const SK = p.base
    const SS = p.shadow
    const SH = p.highlight
    const C = color                           // shorts color
    const Cs = shade(color)
    const Ch = highlight(color)
    const T = state === 'hit' ? '#cc0000' : C // shorts flash red on hit
    const Ts = state === 'hit' ? '#990000' : Cs

    // Muscular torso: 12x13 — wide shoulders (deltoid caps), V-taper to waist
    // SF2 reference: shoulder width should be 1.5-1.8x head width
    // Head is 7 wide → torso 12 wide = 1.71x ratio (perfect SF2 range)
    const ox = x - P * 6
    const oy = y

    const torso: string[][] = [
      ['',  O,  O,  O,  O,  O,  O,  O,  O,  O,  O, ''],      // shoulder line (12 wide)
      [ O, SH, SH, SK, SK, SK, SK, SK, SK, SS, SS,  O],       // deltoids + upper chest
      [ O, SH, SK, SH, SK, SK, SK, SK, SS, SK, SS,  O],       // chest with pec highlight
      [ O, SK, SK, SK, SH, SK, SK, SH, SK, SK, SK,  O],       // mid chest + pec shadow
      ['',  O, SK, SK, SS, SK, SK, SS, SK, SK,  O, ''],       // abs (V-taper starts: 10 wide)
      ['',  O, SK, SK, SK, SS, SS, SK, SK, SK,  O, ''],       // lower abs
      ['', '',  O, SK, SK, SK, SK, SK, SK,  O, '', ''],       // waist (8 wide — V-taper)
      ['', '',  O,  O,  T,  T,  T,  T,  O,  O, '', ''],       // waistband
      ['', '', '',  O,  T,  T,  T,  T,  O, '', '', ''],        // shorts
      ['', '', '',  O,  T,  T,  T,  T,  O, '', '', ''],        // shorts
      ['', '', '',  O, Ts,  O,  O, Ts,  O, '', '', ''],        // shorts hem
      ['', '', '', '',  O, '', '',  O, '', '', '', ''],         // gap between legs
    ]
    drawSprite(ctx, ox, oy, torso)
  }

  // ── Two-segment arm with shoulder + elbow joints ────────────────────────
  // shoulderAngle: degrees from vertical (0=down, 90=horizontal toward opponent)
  // elbowBend: degrees of elbow bend (0=straight, higher=more bent toward body)
  const drawArm = (
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    color: string,
    facing: number,
    shoulderAngle: number,
    elbowBend: number,
    palette?: SkinPalette,
    isPunching?: boolean,
  ) => {
    const p = palette || SKIN_PALETTES[0]
    const SK = p.base, SS = p.shadow, SH = p.highlight
    const C = color
    const Cs = shade(color)
    const G = isPunching ? '#ffdd00' : color
    const GS = isPunching ? '#cc9900' : shade(color)
    const GH = isPunching ? '#ffe866' : highlight(color)

    ctx.save()
    ctx.translate(x, y)

    // ── Segment 1: Upper arm (shoulder → elbow) ──
    ctx.rotate(facing * shoulderAngle * Math.PI / 180)
    const ox = -P * 2 // center on 4-wide
    const upperLen = 4
    for (let i = 0; i < upperLen; i++) {
      pxo(ctx, ox, i * P, SH)
      pxo(ctx, ox + P, i * P, SK)
      pxo(ctx, ox + P * 2, i * P, SK)
      pxo(ctx, ox + P * 3, i * P, SS)
    }

    // ── Segment 2: Forearm (elbow → glove) ──
    ctx.translate(0, upperLen * P) // move to elbow joint
    ctx.rotate(-facing * elbowBend * Math.PI / 180) // bend toward body
    const foreLen = 3
    for (let i = 0; i < foreLen; i++) {
      pxo(ctx, ox, i * P, C)
      pxo(ctx, ox + P, i * P, C)
      pxo(ctx, ox + P * 2, i * P, C)
      pxo(ctx, ox + P * 3, i * P, Cs)
    }

    // ── Glove — 5x4 blocks ──
    const gloveY = foreLen * P
    const gloveGrid: string[][] = [
      [GH,  G,  G,  G, GS],
      [ G,  G,  G,  G,  G],
      [ G,  G,  G,  G,  G],
      [GS,  G,  G,  G, GS],
    ]
    for (let gy = 0; gy < gloveGrid.length; gy++) {
      for (let gx = 0; gx < gloveGrid[gy].length; gx++) {
        pxo(ctx, ox - P / 2 + gx * P, gloveY + gy * P, gloveGrid[gy][gx])
      }
    }

    if (isPunching) {
      ctx.fillStyle = 'rgba(255,221,0,0.4)'
      ctx.fillRect(ox - P * 2, gloveY - P, P * 8, P * 6)
    }

    ctx.restore()
  }

  // ── Two-segment leg with hip + knee joints ──────────────────────────────
  // hipAngle: degrees from vertical (0=down, negative=toward opponent, positive=away)
  // kneeBend: degrees of knee bend (0=straight, positive=bends backward naturally)
  const drawLeg = (
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    color: string,
    facing: number,
    hipAngle: number,
    kneeBend: number,
    palette?: SkinPalette,
    isKicking?: boolean,
  ) => {
    const p = palette || SKIN_PALETTES[0]
    const SK = p.base, SS = p.shadow, SH = p.highlight
    const C = color
    const Cs = shade(color)

    ctx.save()
    ctx.translate(x, y)

    // ── Segment 1: Thigh (hip → knee) ──
    ctx.rotate(facing * hipAngle * Math.PI / 180)
    const ox = -P * 2 // center on 4-wide
    const thighLen = 4
    for (let i = 0; i < thighLen; i++) {
      if (i < 2) {
        pxo(ctx, ox, i * P, C)
        pxo(ctx, ox + P, i * P, C)
        pxo(ctx, ox + P * 2, i * P, C)
        pxo(ctx, ox + P * 3, i * P, Cs)
      } else {
        pxo(ctx, ox, i * P, SH)
        pxo(ctx, ox + P, i * P, SK)
        pxo(ctx, ox + P * 2, i * P, SK)
        pxo(ctx, ox + P * 3, i * P, SS)
      }
    }

    // ── Segment 2: Shin + boot (knee → foot) ──
    ctx.translate(0, thighLen * P) // knee joint
    ctx.rotate(facing * kneeBend * Math.PI / 180) // bend backward naturally
    const shinLen = 4
    for (let i = 0; i < shinLen; i++) {
      pxo(ctx, ox, i * P, C)
      pxo(ctx, ox + P, i * P, C)
      pxo(ctx, ox + P * 2, i * P, C)
      pxo(ctx, ox + P * 3, i * P, Cs)
    }

    // Boot — 5x3
    const bootY = shinLen * P
    const B = '#222', BD = '#111', BH = '#333'
    pxo(ctx, ox - P / 2, bootY, BD)
    pxo(ctx, ox + P / 2, bootY, BH)
    pxo(ctx, ox + P * 3 / 2, bootY, B)
    pxo(ctx, ox + P * 5 / 2, bootY, B)
    pxo(ctx, ox + P * 7 / 2, bootY, BD)
    pxo(ctx, ox - P / 2, bootY + P, BD)
    pxo(ctx, ox + P / 2, bootY + P, B)
    pxo(ctx, ox + P * 3 / 2, bootY + P, B)
    pxo(ctx, ox + P * 5 / 2, bootY + P, BD)
    pxo(ctx, ox + P * 7 / 2, bootY + P, BD)
    pxo(ctx, ox - P / 2, bootY + P * 2, BD)
    pxo(ctx, ox + P / 2, bootY + P * 2, BD)
    pxo(ctx, ox + P * 3 / 2, bootY + P * 2, BD)
    pxo(ctx, ox + P * 5 / 2, bootY + P * 2, BD)
    pxo(ctx, ox + P * 7 / 2, bootY + P * 2, BD)

    if (isKicking) {
      ctx.fillStyle = 'rgba(255,100,0,0.4)'
      ctx.fillRect(ox - P * 2, bootY - P, P * 8, P * 5)
    }

    ctx.restore()
  }

  const drawKnockedDownHumanoid = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, _animationFrame: number, palette?: SkinPalette) => {
    const p = palette || SKIN_PALETTES[0]
    const SK = p.base
    const SS = p.shadow
    const SH = p.highlight
    const C = color
    const Cs = shade(color)
    const G = '#ffdd00' // glove
    const GS = '#cc9900'

    ctx.save()
    ctx.translate(x, y + 20)

    // Body lying flat — head on left, feet on right (wider proportions)
    // Head (hair + skin + headband)
    pxo(ctx, -7 * P, -2 * P, C)
    pxo(ctx, -6 * P, -2 * P, C)
    pxo(ctx, -7 * P, -P, SH)
    pxo(ctx, -6 * P, -P, SK)
    pxo(ctx, -7 * P, 0, SK)
    pxo(ctx, -6 * P, 0, SS)

    // Torso (wider — skin upper body + shorts, 2 rows thick)
    for (let i = -5; i <= 0; i++) {
      pxo(ctx, i * P, -2 * P, i < -3 ? SH : SK)
      pxo(ctx, i * P, -P, i < -3 ? SK : SK)
      pxo(ctx, i * P, 0, i < -3 ? SK : SS)
    }
    // Shorts section
    for (let i = 1; i <= 4; i++) {
      pxo(ctx, i * P, -P, C)
      pxo(ctx, i * P, 0, Cs)
    }

    // Arms (wider — skin + bigger gloves)
    pxo(ctx, -8 * P, -2 * P, SK)
    pxo(ctx, -8 * P, -P, SK)
    pxo(ctx, -9 * P, -2 * P, G)
    pxo(ctx, -9 * P, -P, G)
    pxo(ctx, -10 * P, -P, GS)
    pxo(ctx, -8 * P, P, SK)
    pxo(ctx, -9 * P, P, G)

    // Legs (wider — skin + boots)
    for (let i = 5; i <= 7; i++) {
      pxo(ctx, i * P, -P, SK)
      pxo(ctx, i * P, 0, SS)
    }
    pxo(ctx, 8 * P, -P, '#222')
    pxo(ctx, 8 * P, 0, '#111')
    pxo(ctx, 9 * P, -P, '#222')
    pxo(ctx, 9 * P, 0, '#111')

    // Spinning stars above
    const time = Date.now() * 0.003
    for (let i = 0; i < 3; i++) {
      const starX = -5 * P + i * P * 4
      const starY = -4 * P + Math.sin(time + i * 2) * P * 2
      px(ctx, starX, starY, '#ffdd00')
      px(ctx, starX + P, starY, '#ffdd00')
      px(ctx, starX, starY + P, '#ffdd00')
      px(ctx, starX + P, starY + P, '#ffdd00')
    }

    ctx.restore()
  }

  const drawSweatParticles = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const time = Date.now() * 0.001
    for (let i = 0; i < 5; i++) {
      const sx = x + Math.floor((Math.sin(time * 2 + i * 1.3) * 15) / P) * P
      const sy = y + Math.floor((Math.sin(time * 3 + i) * 10 + i * 6) / P) * P
      px(ctx, sx, sy, 'rgba(150,200,255,0.6)')
    }
  }

  const drawMotionTrail = (ctx: CanvasRenderingContext2D, x: number, y: number, facing: number, actionType: string) => {
    const time = Date.now() * 0.001
    const trailCount = 5

    ctx.save()
    for (let i = 0; i < trailCount; i++) {
      ctx.globalAlpha = (trailCount - i) / trailCount * 0.4

      if (actionType === 'punching') {
        const tx = x + facing * (P * 3 + i * P * 2)
        const ty = y - P * 7 + Math.floor(Math.sin(time * 10 + i) * P)
        px(ctx, tx, ty, '#ffdd00')
        px(ctx, tx + facing * P, ty, '#fff')
        px(ctx, tx + facing * P * 2, ty, '#fff')
      } else if (actionType === 'kicking') {
        const tx = x + facing * (P * 2 + i * P)
        const ty = y - P * 3 + i * P
        px(ctx, tx, ty, '#ff6600')
        px(ctx, tx + facing * P, ty, '#ff8800')
      }
    }
    ctx.restore()
  }

  const drawEnhancedFighterInfo = (
    ctx: CanvasRenderingContext2D,
    fighter: Fighter,
    fighterState: typeof fightState.fighter1,
    x: number,
    y: number,
    color: string,
    fighterNumber: 1 | 2
  ) => {
    // Minimal name tag only — HP/stamina bars are in the SF2-style top HUD
    ctx.save()
    ctx.font = '10px "Press Start 2P"'
    const nameWidth = ctx.measureText(fighter.name).width + 12
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(x - nameWidth / 2, y - 18, nameWidth, 16)
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.fillText(fighter.name, x, y - 6)
    ctx.restore()
  }

  const drawVisualEffects = (ctx: CanvasRenderingContext2D) => {
    visualEffects.forEach(effect => {
      ctx.save()
      switch (effect.type) {
        case 'impact': drawImpactEffect(ctx, effect); break
        case 'sparks': drawSparksEffect(ctx, effect); break
        case 'blood': drawBloodEffect(ctx, effect); break
        case 'stars': drawStarsEffect(ctx, effect); break
        case 'block_flash': drawBlockFlashEffect(ctx, effect); break
        case 'combo_explosion': drawComboExplosionEffect(ctx, effect); break
        case 'screen_shake': drawScreenShakeEffect(ctx, effect); break
        case 'slow_motion': break
      }
      ctx.restore()
    })
  }

  const drawImpactEffect = (ctx: CanvasRenderingContext2D, effect: VisualEffect) => {
    const radius = 40 * effect.intensity
    const time = Date.now() * 0.01

    const gradient = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, radius)
    gradient.addColorStop(0, `rgba(255,255,255,${effect.intensity})`)
    gradient.addColorStop(0.3, `rgba(255,200,0,${effect.intensity * 0.8})`)
    gradient.addColorStop(0.7, `rgba(255,68,68,${effect.intensity * 0.6})`)
    gradient.addColorStop(1, 'rgba(255,68,68,0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = `rgba(255,255,255,${effect.intensity})`
    ctx.lineWidth = 3
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + time * 0.1
      const startRadius = radius * 0.2
      const endRadius = radius * (0.6 + Math.sin(time + i) * 0.2)
      ctx.beginPath()
      ctx.moveTo(effect.x + Math.cos(angle) * startRadius, effect.y + Math.sin(angle) * startRadius)
      ctx.lineTo(effect.x + Math.cos(angle) * endRadius, effect.y + Math.sin(angle) * endRadius)
      ctx.stroke()
    }

    if (effect.intensity > 0.8) {
      ctx.fillStyle = `rgba(255,255,255,${(effect.intensity - 0.8) * 0.1})`
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    }
  }

  const drawSparksEffect = (ctx: CanvasRenderingContext2D, effect: VisualEffect) => {
    const time = Date.now() * 0.005
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2
      const distance = Math.random() * 50 * effect.intensity
      const sparkX = effect.x + Math.cos(angle + time) * distance
      const sparkY = effect.y + Math.sin(angle + time) * distance
      const size = 1 + Math.random() * 3

      ctx.strokeStyle = `rgba(255,255,0,${effect.intensity * 0.8})`
      ctx.lineWidth = size
      ctx.beginPath()
      ctx.moveTo(sparkX, sparkY)
      ctx.lineTo(sparkX - Math.cos(angle) * 8, sparkY - Math.sin(angle) * 8)
      ctx.stroke()

      ctx.fillStyle = `rgba(255,255,255,${effect.intensity})`
      ctx.beginPath()
      ctx.arc(sparkX, sparkY, size / 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const drawBloodEffect = (ctx: CanvasRenderingContext2D, effect: VisualEffect) => {
    const gravity = 0.5
    const time = (Date.now() % effect.duration) / effect.duration
    for (let i = 0; i < 12; i++) {
      const initialVelX = (Math.random() - 0.5) * 8
      const initialVelY = -Math.random() * 6
      const dropX = effect.x + initialVelX * time + (Math.random() - 0.5) * 20
      const dropY = effect.y + initialVelY * time + 0.5 * gravity * time * time * 100
      const size = 1 + Math.random() * 3

      ctx.fillStyle = `rgba(150,0,0,${effect.intensity * (1 - time)})`
      ctx.beginPath()
      ctx.arc(dropX, dropY, size, 0, Math.PI * 2)
      ctx.fill()

      if (time > 0.2) {
        ctx.strokeStyle = `rgba(100,0,0,${effect.intensity * 0.4})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(dropX, dropY)
        ctx.lineTo(dropX, dropY - 5)
        ctx.stroke()
      }
    }
  }

  const drawStarsEffect = (ctx: CanvasRenderingContext2D, effect: VisualEffect) => {
    const time = Date.now() * 0.005
    ctx.fillStyle = `rgba(255,255,0,${effect.intensity})`
    ctx.font = 'bold 20px "Press Start 2P"'
    ctx.textAlign = 'center'
    for (let i = 0; i < 5; i++) {
      const starX = effect.x + (i - 2) * 25 + Math.sin(time * 2 + i) * 10
      const starY = effect.y + Math.sin(time * 3 + i) * 15
      const rotation = time + i
      const scale = Math.round((0.8 + Math.sin(time * 4 + i) * 0.3) * 2) / 2
      ctx.save()
      ctx.translate(Math.round(starX), Math.round(starY))
      ctx.rotate(rotation)
      ctx.scale(scale, scale)
      ctx.fillText('\u2605', 0, 0)
      ctx.restore()
    }
  }

  const drawBlockFlashEffect = (ctx: CanvasRenderingContext2D, effect: VisualEffect) => {
    const time = Date.now() * 0.02
    const flashIntensity = effect.intensity * (1 - Math.sin(time))

    ctx.strokeStyle = `rgba(0,100,255,${flashIntensity})`
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(effect.x, effect.y, 30, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = `rgba(200,200,255,${flashIntensity * 0.3})`
    ctx.beginPath()
    ctx.arc(effect.x, effect.y, 25, 0, Math.PI * 2)
    ctx.fill()

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const sparkX = effect.x + Math.cos(angle) * 35
      const sparkY = effect.y + Math.sin(angle) * 35
      ctx.fillStyle = `rgba(255,255,255,${flashIntensity})`
      ctx.beginPath()
      ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const drawComboExplosionEffect = (ctx: CanvasRenderingContext2D, effect: VisualEffect) => {
    const time = Date.now() * 0.01
    const explosionRadius = 60 * effect.intensity

    for (let ring = 0; ring < 3; ring++) {
      const ringRadius = explosionRadius * (0.3 + ring * 0.35)
      const ringAlpha = effect.intensity * (1 - ring * 0.3) * Math.sin(time * 2 + ring)
      ctx.strokeStyle = `rgba(255,100,0,${ringAlpha})`
      ctx.lineWidth = 5 - ring
      ctx.beginPath()
      ctx.arc(effect.x, effect.y, ringRadius, 0, Math.PI * 2)
      ctx.stroke()
    }

    ctx.fillStyle = `rgba(255,255,0,${effect.intensity})`
    ctx.font = 'bold 24px "Press Start 2P"'
    ctx.textAlign = 'center'
    ctx.save()
    ctx.translate(effect.x, effect.y - 40)
    const comboScale = Math.round((1 + Math.sin(time * 5) * 0.2) * 2) / 2
    ctx.scale(comboScale, comboScale)
    ctx.fillText('COMBO!', 0, 0)
    ctx.restore()

    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2
      const distance = explosionRadius * (0.5 + Math.sin(time * 3 + i) * 0.5)
      const particleX = effect.x + Math.cos(angle) * distance
      const particleY = effect.y + Math.sin(angle) * distance
      ctx.fillStyle = `rgba(255,${100 + Math.sin(time + i) * 100},0,${effect.intensity})`
      ctx.beginPath()
      ctx.arc(particleX, particleY, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const drawScreenShakeEffect = (ctx: CanvasRenderingContext2D, effect: VisualEffect) => {
    const time = Date.now() * 0.001
    const shakeIntensity = effect.intensity * 12
    const progress = Math.min(1, (Date.now() % effect.duration) / effect.duration)
    const decay = Math.exp(-progress * 4)
    const offsetX = (Math.sin(time * 40) + Math.sin(time * 25) * 0.5) * shakeIntensity * decay
    const offsetY = (Math.cos(time * 35) + Math.cos(time * 20) * 0.5) * shakeIntensity * 0.6 * decay
    ctx.translate(offsetX, offsetY)

    const flashAlpha = effect.intensity * 0.08 * decay
    ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`
    ctx.fillRect(-offsetX, -offsetY, ctx.canvas.width, ctx.canvas.height)
  }

  // ── SF2-style HUD: wide HP bars across top, centered timer, round dots ────
  const drawSF2HUD = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const f1 = fightState.fighter1
    const f2 = fightState.fighter2
    if (!f1 || !f2) return

    const hudY = 12          // top edge padding
    const barHeight = 18     // HP bar height
    const timerWidth = 56    // space reserved for timer in center
    const hudPadding = 16    // left/right edge padding
    const barGap = 8         // gap between bar and timer

    // Total bar width for each fighter = (available width - timer - gaps - padding) / 2
    const barWidth = (width - timerWidth - barGap * 2 - hudPadding * 2) / 2

    // ── Background panel ────────────────────────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.75)'
    ctx.fillRect(0, 0, width, hudY + barHeight + 42)

    // ── Fighter names ───────────────────────────────────────────────────
    ctx.font = '10px "Press Start 2P"'
    ctx.fillStyle = '#ff4444'
    ctx.textAlign = 'left'
    ctx.fillText(fighters[0]?.name?.toUpperCase() || 'P1', hudPadding, hudY + 10)
    ctx.fillStyle = '#4488ff'
    ctx.textAlign = 'right'
    ctx.fillText(fighters[1]?.name?.toUpperCase() || 'P2', width - hudPadding, hudY + 10)

    // ── HP bars ─────────────────────────────────────────────────────────
    // P1 bar: fills RIGHT to LEFT (depletes from left edge)
    // P2 bar: fills LEFT to RIGHT (depletes from right edge)
    const barY = hudY + 16
    const p1BarX = hudPadding
    const p2BarX = width - hudPadding - barWidth

    // Background track
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(p1BarX, barY, barWidth, barHeight)
    ctx.fillRect(p2BarX, barY, barWidth, barHeight)

    // HP fill — color transitions: green → yellow → orange → red
    const hpColor = (ratio: number): string => {
      if (ratio > 0.5) return '#22cc44'
      if (ratio > 0.25) return '#ddaa00'
      if (ratio > 0.1) return '#ff6600'
      return '#cc2222'
    }

    // P1: bar fills from right edge toward left (depletes from left)
    const f1Ratio = Math.max(0, f1.hp / FIGHTER_MAX_HP)
    const f1FillWidth = barWidth * f1Ratio
    const f1Color = hpColor(f1Ratio)
    ctx.fillStyle = f1Color
    ctx.fillRect(p1BarX + barWidth - f1FillWidth, barY + 1, f1FillWidth, barHeight - 2)
    // Inner highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.fillRect(p1BarX + barWidth - f1FillWidth, barY + 1, f1FillWidth, Math.floor(barHeight / 3))

    // P2: bar fills from left edge toward right (depletes from right)
    const f2Ratio = Math.max(0, f2.hp / FIGHTER_MAX_HP)
    const f2FillWidth = barWidth * f2Ratio
    const f2Color = hpColor(f2Ratio)
    ctx.fillStyle = f2Color
    ctx.fillRect(p2BarX, barY + 1, f2FillWidth, barHeight - 2)
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.fillRect(p2BarX, barY + 1, f2FillWidth, Math.floor(barHeight / 3))

    // HP segment lines (5 segments per bar like SF2)
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'
    ctx.lineWidth = 1
    for (let i = 1; i < 5; i++) {
      const segX1 = p1BarX + (barWidth / 5) * i
      ctx.beginPath(); ctx.moveTo(segX1, barY); ctx.lineTo(segX1, barY + barHeight); ctx.stroke()
      const segX2 = p2BarX + (barWidth / 5) * i
      ctx.beginPath(); ctx.moveTo(segX2, barY); ctx.lineTo(segX2, barY + barHeight); ctx.stroke()
    }

    // Bar borders
    ctx.strokeStyle = '#888'
    ctx.lineWidth = 2
    ctx.strokeRect(p1BarX, barY, barWidth, barHeight)
    ctx.strokeRect(p2BarX, barY, barWidth, barHeight)

    // ── Timer ───────────────────────────────────────────────────────────
    const timerX = width / 2
    const timerY = barY + barHeight / 2

    // Timer background circle
    ctx.fillStyle = '#111'
    ctx.strokeStyle = '#666'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(timerX, timerY, 22, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Timer text — bold countdown
    const clockVal = Math.max(0, fightState.clock ?? 0)
    ctx.font = 'bold 16px "Press Start 2P"'
    ctx.fillStyle = clockVal <= 10 ? '#ff4444' : '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(clockVal), timerX, timerY)
    ctx.textBaseline = 'alphabetic'

    // ── Round indicator + dots ──────────────────────────────────────────
    const roundY = barY + barHeight + 10
    ctx.font = '8px "Press Start 2P"'
    ctx.fillStyle = '#aaa'
    ctx.textAlign = 'center'

    // Round label
    ctx.fillText(`ROUND ${fightState.round}`, timerX, roundY + 8)

    // Round win dots — P1 left of timer, P2 right of timer
    // Track rounds won from roundScores
    const maxRounds = fightState.maxRounds || 3
    const roundsToWin = Math.ceil(maxRounds / 2) // best of 3 → need 2
    const scores = fightState.roundScores || []

    let p1Wins = 0
    let p2Wins = 0
    for (const s of scores) {
      if (s.winner === 1) p1Wins++
      else if (s.winner === 2) p2Wins++
    }

    const dotRadius = 4
    const dotSpacing = 14
    const dotY = roundY + 20

    // P1 dots (left side of center)
    for (let i = 0; i < roundsToWin; i++) {
      const dx = timerX - 30 - i * dotSpacing
      ctx.beginPath()
      ctx.arc(dx, dotY, dotRadius, 0, Math.PI * 2)
      if (i < p1Wins) {
        ctx.fillStyle = '#ff4444'
        ctx.fill()
      } else {
        ctx.strokeStyle = '#555'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
    }

    // P2 dots (right side of center)
    for (let i = 0; i < roundsToWin; i++) {
      const dx = timerX + 30 + i * dotSpacing
      ctx.beginPath()
      ctx.arc(dx, dotY, dotRadius, 0, Math.PI * 2)
      if (i < p2Wins) {
        ctx.fillStyle = '#4488ff'
        ctx.fill()
      } else {
        ctx.strokeStyle = '#555'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
    }

    // ── Stamina bars (thin, below HP) ───────────────────────────────────
    const stamY = barY + barHeight + 3
    const stamHeight = 4

    // P1 stamina (right-aligned like P1 HP)
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(p1BarX, stamY, barWidth, stamHeight)
    const f1StamFill = (f1.stamina / 100) * barWidth
    ctx.fillStyle = '#3388cc'
    ctx.fillRect(p1BarX + barWidth - f1StamFill, stamY, f1StamFill, stamHeight)

    // P2 stamina (left-aligned like P2 HP)
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(p2BarX, stamY, barWidth, stamHeight)
    const f2StamFill = (f2.stamina / 100) * barWidth
    ctx.fillStyle = '#3388cc'
    ctx.fillRect(p2BarX, stamY, f2StamFill, stamHeight)

    // ── Phase overlays (center screen) ──────────────────────────────────
    const phase = fightState.phase
    const centerY = height * 0.45

    if (phase === 'ko') {
      // SF2-style "K.O." — big red text with drop shadow
      ctx.save()
      ctx.font = 'bold 48px "Press Start 2P"'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#000'
      ctx.fillText('K.O.', width / 2 + 3, centerY + 3)
      ctx.fillStyle = '#ff2222'
      ctx.shadowBlur = 20
      ctx.shadowColor = '#ff0000'
      ctx.fillText('K.O.', width / 2, centerY)
      ctx.shadowBlur = 0
      ctx.restore()
    } else if (phase === 'decision') {
      ctx.save()
      ctx.font = 'bold 28px "Press Start 2P"'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#000'
      ctx.fillText('DECISION', width / 2 + 2, centerY + 2)
      ctx.fillStyle = '#ffd700'
      ctx.shadowBlur = 15
      ctx.shadowColor = '#ffaa00'
      ctx.fillText('DECISION', width / 2, centerY)
      ctx.shadowBlur = 0
      ctx.restore()
    } else if (phase === 'repricing') {
      // Between-round repricing window — show countdown and recovery info
      const repTime = fightState.repricingTimeLeft ?? 0
      ctx.save()

      // Darken the arena slightly during repricing
      ctx.fillStyle = 'rgba(0,0,20,0.3)'
      ctx.fillRect(0, hudY + barHeight + 42, width, height)

      // "REPRICING" banner
      ctx.font = 'bold 20px "Press Start 2P"'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#000'
      ctx.fillText('REPRICING', width / 2 + 2, centerY - 18)
      ctx.fillStyle = '#00ddff'
      ctx.shadowBlur = 12
      ctx.shadowColor = '#00aaff'
      ctx.fillText('REPRICING', width / 2, centerY - 20)
      ctx.shadowBlur = 0

      // Countdown
      ctx.font = 'bold 32px "Press Start 2P"'
      ctx.fillStyle = repTime <= 3 ? '#ff4444' : '#ffffff'
      ctx.fillText(String(repTime), width / 2, centerY + 20)

      // Recovery info if available
      const rec = fightState.lastRecovery
      if (rec) {
        ctx.font = '10px "Press Start 2P"'
        ctx.fillStyle = '#22cc44'
        ctx.textAlign = 'left'
        ctx.fillText(`+${rec.fighter1.total} HP`, hudPadding + 10, centerY + 50)
        ctx.textAlign = 'right'
        ctx.fillText(`+${rec.fighter2.total} HP`, width - hudPadding - 10, centerY + 50)
      }

      ctx.restore()
    }
  }

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Round Card Overlay */}
      <AnimatePresence>
        {showRoundCard && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-20 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-red-600 to-red-800 text-white p-8 text-center shadow-2xl"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 10 }}
              transition={{ type: "spring", bounce: 0.5 }}
            >
              <div className="font-pixel text-4xl mb-2">ROUND {fightState.round}</div>
              <div className="text-lg opacity-90">FIGHT!</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Real-time Event Log */}
      <div className="absolute bottom-4 left-4 w-80 max-h-32 overflow-hidden">
        <AnimatePresence>
          {roundEvents.slice(0, 3).map((event, index) => (
            <motion.div
              key={event.id}
              className={`mb-2 p-2 text-sm font-pixel ${
                event.severity === 'high' ? 'bg-red-600/80 text-white' :
                event.severity === 'medium' ? 'bg-yellow-600/80 text-white' :
                'bg-gray-600/80 text-white'
              }`}
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              style={{ zIndex: 10 - index }}
            >
              {event.description}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Round Stats Display */}
      <div className="absolute top-20 right-4 bg-black/70 text-white p-3 text-xs font-ui">
        <div className="font-pixel text-sm mb-2">ROUND STATS</div>
        {Object.entries(roundStats).slice(-3).map(([round, stats]) => (
          <div key={round} className="mb-1">
            <div>R{round}: {fighters[0]?.name} {stats.fighter1Strikes} - {stats.fighter2Strikes} {fighters[1]?.name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
