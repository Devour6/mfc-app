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

// ── Attack phase timing ─────────────────────────────────────────────────────
// Each attack has 4 phases: startup (wind-up) → active (strike) → hold (impact freeze) → recovery
// Values represent the normalized time boundary where each phase ends (0 to 1)
const ATTACK_PHASES: Record<string, { startup: number; active: number; hold: number }> = {
  jab:        { startup: 0.15, active: 0.40, hold: 0.55 },
  cross:      { startup: 0.20, active: 0.45, hold: 0.60 },
  hook:       { startup: 0.25, active: 0.50, hold: 0.60 },
  uppercut:   { startup: 0.30, active: 0.55, hold: 0.65 },
  kick:       { startup: 0.20, active: 0.50, hold: 0.65 },
  roundhouse: { startup: 0.25, active: 0.55, hold: 0.70 },
}

// Per-attack-type parameters for punches — higher extensions + angles for readable attacks
const PUNCH_PARAMS: Record<string, { maxExtension: number; bodyLean: number; armAngle: number; headDip: number; windUpLean: number }> = {
  jab:      { maxExtension: 35, bodyLean: 6,  armAngle: 35, headDip: 2, windUpLean: -4 },
  cross:    { maxExtension: 50, bodyLean: 14, armAngle: 50, headDip: 4, windUpLean: -8 },
  hook:     { maxExtension: 28, bodyLean: 18, armAngle: 80, headDip: 3, windUpLean: -10 },
  uppercut: { maxExtension: 38, bodyLean: 12, armAngle: 95, headDip: 8, windUpLean: -6 },
}

// Per-attack-type parameters for kicks — higher extensions for readable kicks
const KICK_PARAMS: Record<string, { maxExtension: number; bodyLean: number; legAngle: number; armRaise: number }> = {
  kick:       { maxExtension: 45, bodyLean: -12, legAngle: 65, armRaise: 8 },
  roundhouse: { maxExtension: 55, bodyLean: -18, legAngle: 90, armRaise: 12 },
}

// ── Fighter visual scale + skin tones ───────────────────────────────────────
const FIGHTER_SCALE = 1.3
const SKIN = '#e8b88a'
const SKIN_S = '#c89870' // skin shadow
const SKIN_H = '#fad0a8' // skin highlight

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
      knockbackRef.current.f1.velocity = fightState.fighter1.position.facing * -12
    }
    if (f2State === 'hit' && prevAnimRef.current.f2 !== 'hit') {
      knockbackRef.current.f2.velocity = fightState.fighter2.position.facing * -12
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
    drawMomentumIndicator(ctx, width, height)
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

    // Hit-stop: when hitStopFrames > 0, add subtle vibration but freeze pose
    const isInHitStop = fighterState.modifiers.hitStopFrames > 0
    let hitStopVibX = 0
    let hitStopVibY = 0
    if (isInHitStop) {
      const vibTime = Date.now() * 0.05
      hitStopVibX = Math.sin(vibTime) * 1.5
      hitStopVibY = Math.cos(vibTime * 1.3) * 1.0
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
      const shakeIntensity = (fighterState.hp < FIGHTER_MAX_HP * 0.25 ? 8 : 5) * decay
      const shakePhase = time * 25
      ctx.translate(
        Math.sin(shakePhase) * shakeIntensity,
        Math.cos(shakePhase * 1.3) * shakeIntensity * 0.7
      )
      ctx.globalAlpha = 0.8 + animProgress * 0.2 // Fade back in as hit recovers
    }

    if (fighterState.animation.state === 'down') {
      const time = Date.now() * 0.001
      ctx.translate(
        Math.sin(time * 10) * 12,
        Math.cos(time * 8) * 6
      )
    }

    ctx.globalAlpha *= Math.max(0.7, fighterState.stamina / 100)

    // Shadow — scaled to match fighter size
    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.save()
    ctx.scale(1, 0.2)
    ctx.beginPath()
    ctx.arc(x, (floorY + 10) / 0.2, 25 * FIGHTER_SCALE, 0, Math.PI * 2)
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
      const lungeDistance = fighterState.animation.state === 'kicking' ? 28 : 22
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

    drawHumanoidFighter(ctx, drawX, y, color, fighterState, fighterNumber, animProgress)

    ctx.restore() // end scale transform

    // Particle effects (drawn at original scale, outside the fighter scale)
    if (fighterState.hp < FIGHTER_MAX_HP * 0.5) {
      drawSweatParticles(ctx, x, y - 80 * FIGHTER_SCALE)
    }
    if (fighterState.animation.state === 'punching') {
      drawMotionTrail(ctx, x, y, fighterState.position.facing, 'punching')
    }
    if (fighterState.animation.state === 'kicking') {
      drawMotionTrail(ctx, x, y, fighterState.position.facing, 'kicking')
    }

    ctx.restore()

    drawEnhancedFighterInfo(ctx, fighterData, fighterState, x, y - 80 * FIGHTER_SCALE, color, fighterNumber)
  }

  // ── Main humanoid fighter drawing with frame-based keyframe animation ─────
  const drawHumanoidFighter = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    fighterState: typeof fightState.fighter1,
    fighterNumber: 1 | 2,
    animProgress: number
  ) => {
    const facing = fighterState.position.facing
    const state = fighterState.animation.state
    const attackType = fighterState.animation.attackType || 'jab'

    ctx.save()

    let headY = y - 50
    let torsoY = y - 35
    let armY = y - 30
    let legY = y - 10
    let bodyLean = 0
    let armExtension = 0
    let legExtension = 0
    let isKicking = false
    let frontArmAngle: number | undefined
    let frontLegAngle: number | undefined
    let isGuardArms = false
    let walkPhase: number | undefined

    switch (state) {
      case 'idle': {
        // Proper fighting stance: slight bounce, guard arms up
        const time = Date.now() * 0.001
        const bounce = Math.sin(time * 3 + fighterNumber * Math.PI) * 1.5
        headY += bounce
        torsoY += bounce * 0.8
        armY += bounce * 0.6
        legY += bounce * 0.3
        bodyLean = facing * 2 // Slight lean toward opponent
        isGuardArms = true
        break
      }

      case 'punching': {
        const params = PUNCH_PARAMS[attackType] || PUNCH_PARAMS.jab
        const phase = getAttackPhase(animProgress, attackType)
        const phaseT = getPhaseProgress(animProgress, attackType, phase)

        switch (phase) {
          case 'startup': {
            // Wind-up: arm retracts hard, lean back — exaggerated for readability
            const t = easeInQuad(phaseT)
            armExtension = lerp(0, -14, t) // Pull arm back visibly
            bodyLean = facing * lerp(0, params.windUpLean, t)
            headY -= lerp(0, params.headDip * 0.3, t)
            break
          }
          case 'active': {
            // Strike: arm snaps forward with easeOutCubic (fast start, smooth stop)
            const t = easeOutCubic(phaseT)
            armExtension = lerp(-14, params.maxExtension, t)
            bodyLean = facing * lerp(params.windUpLean, params.bodyLean, t)
            headY -= lerp(params.headDip * 0.3, params.headDip, t)
            frontArmAngle = lerp(0, params.armAngle, t)
            break
          }
          case 'hold': {
            // Full extension held
            armExtension = params.maxExtension
            bodyLean = facing * params.bodyLean
            headY -= params.headDip
            frontArmAngle = params.armAngle
            break
          }
          case 'recovery': {
            // Return to guard with easeInOutQuad
            const t = easeInOutQuad(phaseT)
            armExtension = lerp(params.maxExtension, 0, t)
            bodyLean = facing * lerp(params.bodyLean, 2, t)
            headY -= lerp(params.headDip, 0, t)
            frontArmAngle = lerp(params.armAngle, 0, t)
            break
          }
        }
        break
      }

      case 'kicking': {
        isKicking = true
        const params = KICK_PARAMS[attackType] || KICK_PARAMS.kick
        const phase = getAttackPhase(animProgress, attackType)
        const phaseT = getPhaseProgress(animProgress, attackType, phase)

        switch (phase) {
          case 'startup': {
            // Chamber: leg pulls up hard — exaggerated for readability
            const t = easeInQuad(phaseT)
            legExtension = lerp(0, -10, t)  // Chamber high
            bodyLean = facing * lerp(0, params.bodyLean * 0.3, t)
            armY -= lerp(0, params.armRaise * 0.5, t)
            break
          }
          case 'active': {
            // Kick extends with snap
            const t = easeOutCubic(phaseT)
            legExtension = lerp(-10, params.maxExtension, t)
            bodyLean = facing * lerp(params.bodyLean * 0.3, params.bodyLean, t)
            armY -= lerp(params.armRaise * 0.5, params.armRaise, t)
            frontLegAngle = lerp(0, params.legAngle, t)
            break
          }
          case 'hold': {
            legExtension = params.maxExtension
            bodyLean = facing * params.bodyLean
            armY -= params.armRaise
            frontLegAngle = params.legAngle
            break
          }
          case 'recovery': {
            const t = easeInOutQuad(phaseT)
            legExtension = lerp(params.maxExtension, 0, t)
            bodyLean = facing * lerp(params.bodyLean, 0, t)
            armY -= lerp(params.armRaise, 0, t)
            frontLegAngle = lerp(params.legAngle, 0, t)
            break
          }
        }
        break
      }

      case 'hit': {
        // Dramatic recoil with easeOutBack (overshoot) in first 30%, slow recovery
        const hitPhase = animProgress < 0.3
          ? easeOutBack(animProgress / 0.3) // Fast snap into recoil
          : lerp(1, 0, easeInOutQuad((animProgress - 0.3) / 0.7)) // Slow recovery

        bodyLean = -facing * 20 * hitPhase
        headY += 10 * hitPhase // Head snaps back
        torsoY += 3 * hitPhase
        // Horizontal stagger oscillation
        const stagger = Math.sin(animProgress * Math.PI * 4) * 3 * (1 - animProgress)
        headY += stagger
        break
      }

      case 'blocking': {
        // Arms raise high, body tucks chin, snaps fast
        const blockT = animProgress < 0.2
          ? easeOutCubic(animProgress / 0.2) // Snap into block
          : animProgress > 0.8
            ? lerp(1, 0, easeInOutQuad((animProgress - 0.8) / 0.2)) // Release
            : 1 // Hold

        armY -= 14 * blockT
        bodyLean = -facing * 4 * blockT
        headY += 2 * blockT // Tuck chin
        break
      }

      case 'dodging': {
        // Quick duck + lean away, fast onset → slow recovery
        const dodgeT = animProgress < 0.25
          ? easeOutCubic(animProgress / 0.25) // Fast duck
          : lerp(1, 0, easeInOutQuad((animProgress - 0.25) / 0.75)) // Slow recovery

        headY += 15 * dodgeT  // Duck down
        torsoY += 8 * dodgeT
        bodyLean = -facing * 18 * dodgeT // Lean away
        break
      }

      case 'walking': {
        // Leg cycling animation
        const total = fighterState.animation.frameCount + fighterState.animation.duration
        walkPhase = total > 0 ? (fighterState.animation.frameCount / total) * Math.PI * 2 : 0
        bodyLean = facing * 3
        break
      }

      case 'down': {
        drawKnockedDownHumanoid(ctx, x, y, color, 0)
        ctx.restore()
        return
      }
    }

    // Apply body lean rotation
    ctx.translate(x, y)
    ctx.rotate(bodyLean * Math.PI / 180)
    ctx.translate(-x, -y)

    // Draw body parts back-to-front
    // Arm/leg attachment must be OUTSIDE the torso (10 blocks = 40px wide, ±20 from center)

    // Back leg
    const backLegX = facing === 1 ? x - 12 : x + 12
    drawLeg(ctx, backLegX, legY, color, false, 0, false, undefined, walkPhase !== undefined ? walkPhase + Math.PI : undefined)

    // Back arm — behind the torso
    const backArmX = facing === 1 ? x - 22 : x + 22
    drawArm(ctx, backArmX, armY, color, facing, false, 0, false, undefined, isGuardArms)

    // Torso
    drawTorso(ctx, x, torsoY, color, state)

    // Head
    drawHead(ctx, x, headY, color, facing, state, fighterState.hp)

    // Front arm (punching arm) — outside the torso edge
    const frontArmX = facing === 1 ? x + 22 : x - 22
    drawArm(ctx, frontArmX, armY, color, facing, true, armExtension, state === 'punching', frontArmAngle, isGuardArms)

    // Front leg (kicking leg)
    const frontLegX = facing === 1 ? x + 12 : x - 12
    drawLeg(ctx, frontLegX, legY, color, true, legExtension, isKicking, frontLegAngle, walkPhase)

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

  const drawHead = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, facing: number, state: string, hp: number) => {
    const O = '#111'
    const C = color       // hair/headband color
    const Cs = shade(color)
    const SK = SKIN       // skin tone
    const SS = SKIN_S     // skin shadow
    const SH = SKIN_H     // skin highlight
    const W = '#fff'

    // Wider head: 8x9 grid — hair on top, skin face below
    const ox = x - P * 4
    const oy = y - P * 5

    const head: string[][] = [
      ['', '',  O,  O,  O,  O, '', ''],
      ['',  O,  C,  C,  C,  C,  O, ''],
      [ O,  C,  C,  C,  C,  C,  C,  O],   // hair
      [ O, SH,  SK, SK, SK, SK, SS,  O],   // forehead
      [ O,  SK, SK, SK, SK, SK, SK,  O],   // eyes line
      [ O,  SK, SK, SK, SK, SK, SK,  O],   // nose
      [ O,  SK, SK, SK, SK, SK, SK,  O],   // mouth
      ['',  O,  SK, SK, SK, SK,  O, ''],   // chin
      ['', '',  O,  O,  O,  O, '', ''],    // neck
    ]
    drawSprite(ctx, ox, oy, head)

    // Eyes and mouth
    if (state === 'hit') {
      // X eyes + open mouth
      px(ctx, ox + P * 2, oy + P * 4, '#ff0')
      px(ctx, ox + P * 5, oy + P * 4, '#ff0')
      px(ctx, ox + P * 3, oy + P * 6, '#c00')
      px(ctx, ox + P * 4, oy + P * 6, '#c00')
    } else if (hp < FIGHTER_MAX_HP * 0.25) {
      // Tired squint eyes + blood
      px(ctx, ox + P * 2, oy + P * 4, '#800')
      px(ctx, ox + P * 5, oy + P * 4, '#800')
      px(ctx, ox + P * 3, oy + P * 6, '#c00')
    } else {
      // Normal eyes: white with pupil
      px(ctx, ox + P * 2, oy + P * 4, W)
      px(ctx, ox + P * 5, oy + P * 4, W)
      const pupilOff = facing > 0 ? 1 : 0
      px(ctx, ox + P * (2 + pupilOff), oy + P * 4, '#000')
      px(ctx, ox + P * (5 + pupilOff), oy + P * 4, '#000')
      // Determined mouth
      px(ctx, ox + P * 3, oy + P * 6, '#333')
      px(ctx, ox + P * 4, oy + P * 6, '#333')
    }
  }

  const drawTorso = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, state: string) => {
    const O = '#111'
    const SK = SKIN
    const SS = SKIN_S
    const SH = SKIN_H
    const C = color                           // shorts color
    const Cs = shade(color)
    const T = state === 'hit' ? '#cc0000' : C // shorts flash red on hit

    // Wider torso: 10x12 — skin upper body with muscle definition, colored shorts
    const ox = x - P * 5
    const oy = y

    const torso: string[][] = [
      ['', '',  O,  O,  O,  O,  O,  O, '', ''],   // shoulders
      ['',  O, SH,  SK, SK, SK, SK, SS,  O, ''],   // upper chest
      [ O, SH,  SK, SH, SK, SK, SS, SK, SS,  O],   // chest + pecs
      [ O,  SK, SK, SK, SK, SK, SK, SK, SK,  O],   // mid chest
      [ O,  SK, SK, SS, SK, SK, SS, SK, SK,  O],   // abs definition
      [ O,  SK, SK, SK, SS, SS, SK, SK, SK,  O],   // lower abs
      ['',  O,  SK, SK, SK, SK, SK, SK,  O, ''],   // waist
      ['',  O,  O,   T,  T,  T,  T,  O,  O, ''],   // waistband
      ['', '',  O,   T,  T,  T,  T,  O, '', ''],    // shorts
      ['', '',  O,   T,  T,  T,  T,  O, '', ''],    // shorts
      ['', '',  O,  Cs,  O,  O, Cs,  O, '', ''],    // shorts hem
      ['', '', '',   O, '',  '',  O, '', '', ''],    // gap between legs
    ]
    drawSprite(ctx, ox, oy, torso)
  }

  const drawArm = (
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    color: string,
    facing: number,
    isFront: boolean,
    extension: number,
    isPunching: boolean,
    armAngle?: number,
    isGuard?: boolean
  ) => {
    const SK = SKIN
    const SS = SKIN_S
    const SH = SKIN_H
    const C = color            // fighter color for wraps
    const Cs = shade(color)
    const G = isPunching && isFront ? '#ffdd00' : color
    const GS = isPunching && isFront ? '#cc9900' : shade(color)
    const GH = isPunching && isFront ? '#ffe866' : highlight(color)

    ctx.save()
    ctx.translate(x, y)

    if (isFront && isPunching && armAngle !== undefined) {
      ctx.rotate(facing * armAngle * Math.PI / 180)
    } else if (isGuard) {
      ctx.rotate(facing * 35 * Math.PI / 180)
    }

    const armLen = Math.floor((25 + Math.max(0, extension)) / P)
    const ox = -P  // center on 3-wide

    // Upper arm — skin tones, 3 blocks wide
    const upperLen = Math.max(2, Math.floor(armLen * 0.4))
    for (let i = 0; i < upperLen; i++) {
      pxo(ctx, ox - P, i * P, SH)
      pxo(ctx, ox, i * P, SK)
      pxo(ctx, ox + P, i * P, SS)
    }

    // Forearm — fighter-colored wraps/tape for visual contrast against torso
    const forearmStart = upperLen * P
    const forearmLen = Math.max(2, Math.floor(armLen * 0.4))
    for (let i = 0; i < forearmLen; i++) {
      pxo(ctx, ox - P, forearmStart + i * P, C)
      pxo(ctx, ox, forearmStart + i * P, C)
      pxo(ctx, ox + P, forearmStart + i * P, Cs)
    }

    // Glove — 4x3 blocks (yellow for active punch, fighter color otherwise)
    const gloveY = (upperLen + forearmLen) * P
    const gloveGrid: string[][] = [
      [GH,  G,  G, GS],
      [ G,  G,  G,  G],
      [GS,  G,  G, GS],
    ]
    for (let gy = 0; gy < gloveGrid.length; gy++) {
      for (let gx = 0; gx < gloveGrid[gy].length; gx++) {
        pxo(ctx, ox - P + gx * P, gloveY + gy * P, gloveGrid[gy][gx])
      }
    }

    // Punch glow — bigger and brighter
    if (isPunching && isFront) {
      ctx.fillStyle = 'rgba(255,221,0,0.4)'
      ctx.fillRect(ox - P * 2, gloveY - P, P * 6, P * 5)
    }

    ctx.restore()
  }

  const drawLeg = (
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    color: string,
    isFront: boolean,
    extension: number,
    isKicking: boolean,
    legAngle?: number,
    walkPhase?: number
  ) => {
    const SK = SKIN
    const SS = SKIN_S
    const SH = SKIN_H
    const C = color          // shorts/shin guard color
    const Cs = shade(color)

    ctx.save()
    ctx.translate(x, y)

    if (isKicking && isFront && legAngle !== undefined) {
      ctx.rotate(legAngle * Math.PI / 180)
    } else if (walkPhase !== undefined) {
      const swing = Math.sin(walkPhase) * 20
      ctx.rotate(swing * Math.PI / 180)
    }

    const legLen = Math.floor((35 + Math.max(0, extension)) / P)
    const ox = -P  // center on 3-wide

    // Thigh — shorts top, then skin
    const thighLen = Math.max(2, Math.floor(legLen * 0.4))
    for (let i = 0; i < thighLen; i++) {
      if (i < 2) {
        // Shorts portion — fighter color
        pxo(ctx, ox - P, i * P, C)
        pxo(ctx, ox, i * P, C)
        pxo(ctx, ox + P, i * P, Cs)
      } else {
        // Exposed thigh — skin tones
        pxo(ctx, ox - P, i * P, SH)
        pxo(ctx, ox, i * P, SK)
        pxo(ctx, ox + P, i * P, SS)
      }
    }

    // Shin — fighter-colored shin guards for visual contrast
    const shinStart = thighLen * P
    const shinLen = Math.max(2, Math.floor(legLen * 0.4))
    for (let i = 0; i < shinLen; i++) {
      pxo(ctx, ox - P, shinStart + i * P, C)
      pxo(ctx, ox, shinStart + i * P, C)
      pxo(ctx, ox + P, shinStart + i * P, Cs)
    }

    // Boot — 4x2 dark blocks
    const bootY = (thighLen + shinLen) * P
    const B = '#222'
    const BD = '#111'
    pxo(ctx, ox - P, bootY, BD)
    pxo(ctx, ox, bootY, B)
    pxo(ctx, ox + P, bootY, B)
    pxo(ctx, ox + P * 2, bootY, BD)
    pxo(ctx, ox - P, bootY + P, BD)
    pxo(ctx, ox, bootY + P, BD)
    pxo(ctx, ox + P, bootY + P, BD)
    pxo(ctx, ox + P * 2, bootY + P, BD)

    // Kick glow — bigger
    if (isKicking && isFront) {
      ctx.fillStyle = 'rgba(255,100,0,0.4)'
      ctx.fillRect(ox - P * 2, bootY - P, P * 6, P * 4)
    }

    ctx.restore()
  }

  const drawKnockedDownHumanoid = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, _animationFrame: number) => {
    const SK = SKIN
    const SS = SKIN_S
    const SH = SKIN_H
    const C = color
    const Cs = shade(color)
    const G = '#ffdd00' // glove
    const GS = '#cc9900'

    ctx.save()
    ctx.translate(x, y + 20)

    // Body lying flat — head on left, feet on right
    // Head (skin + hair)
    pxo(ctx, -6 * P, -2 * P, C)
    pxo(ctx, -5 * P, -2 * P, C)
    pxo(ctx, -6 * P, -P, SH)
    pxo(ctx, -5 * P, -P, SK)
    pxo(ctx, -6 * P, 0, SK)
    pxo(ctx, -5 * P, 0, SS)

    // Torso (skin upper body + shorts)
    for (let i = -4; i <= 0; i++) {
      pxo(ctx, i * P, -P, i < -2 ? SH : SK)
      pxo(ctx, i * P, 0, i < -2 ? SK : SS)
    }
    // Shorts section
    for (let i = 1; i <= 3; i++) {
      pxo(ctx, i * P, -P, C)
      pxo(ctx, i * P, 0, Cs)
    }

    // Arms (skin + gloves)
    pxo(ctx, -7 * P, -P, SK)
    pxo(ctx, -8 * P, -P, G)
    pxo(ctx, -8 * P, 0, GS)
    pxo(ctx, -7 * P, P, SK)
    pxo(ctx, -8 * P, P, G)

    // Legs (skin + boots)
    for (let i = 4; i <= 5; i++) {
      pxo(ctx, i * P, -P, SK)
      pxo(ctx, i * P, 0, SS)
    }
    pxo(ctx, 6 * P, -P, '#222')
    pxo(ctx, 6 * P, 0, '#111')
    pxo(ctx, 7 * P, -P, '#222')
    pxo(ctx, 7 * P, 0, '#111')

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
    const nameWidth = ctx.measureText(fighter.name).width + 20
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(x - nameWidth / 2, y - 25, nameWidth, 20)

    ctx.fillStyle = color
    ctx.font = '12px "Press Start 2P"'
    ctx.textAlign = 'center'
    ctx.fillText(fighter.name, x, y - 10)

    const barWidth = 100
    const barHeight = 8
    const barX = x - barWidth / 2
    const hpY = y - 5

    ctx.fillStyle = '#1a1a26'
    ctx.fillRect(barX, hpY, barWidth, barHeight)

    const segmentCount = 5
    const hpPerSegment = FIGHTER_MAX_HP / segmentCount
    for (let i = 0; i < segmentCount; i++) {
      const segmentWidth = barWidth / segmentCount
      const segmentX = barX + i * segmentWidth
      const segmentHP = Math.max(0, fighterState.hp - i * hpPerSegment)

      if (segmentHP > 0) {
        const segmentFill = Math.min(1, segmentHP / hpPerSegment)
        const segmentColor = segmentHP > hpPerSegment * 0.5 ? color : '#ff4444'
        ctx.fillStyle = segmentColor
        ctx.fillRect(segmentX + 1, hpY + 1, (segmentWidth - 2) * segmentFill, barHeight - 2)
      }
    }

    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.strokeRect(barX, hpY, barWidth, barHeight)

    const stamY = hpY + barHeight + 3
    ctx.fillStyle = '#333'
    ctx.fillRect(barX, stamY, barWidth, 4)
    const stamWidth = (fighterState.stamina / 100) * barWidth
    ctx.fillStyle = '#44aaff'
    ctx.fillRect(barX, stamY, stamWidth, 4)
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

  const drawMomentumIndicator = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const indicatorY = height - 80
    const indicatorWidth = 250
    const indicatorX = width / 2 - indicatorWidth / 2

    const f1HP = fightState.fighter1?.hp || FIGHTER_MAX_HP
    const f2HP = fightState.fighter2?.hp || FIGHTER_MAX_HP
    const momentum = (f1HP - f2HP) / FIGHTER_MAX_HP

    const avgHP = (f1HP + f2HP) / 2
    const fightIntensity = 1 - (avgHP / FIGHTER_MAX_HP)
    const time = Date.now() * 0.001

    const bgAlpha = 0.7 + Math.sin(time * 2) * fightIntensity * 0.2
    ctx.fillStyle = `rgba(0,0,0,${bgAlpha})`
    ctx.fillRect(indicatorX - 10, indicatorY - 25, indicatorWidth + 20, 50)

    ctx.fillStyle = '#ffd700'
    ctx.font = 'bold 10px "Inter"'
    ctx.textAlign = 'center'
    ctx.fillText('FIGHT INTENSITY', width / 2, indicatorY - 15)

    const intensityBarWidth = indicatorWidth * 0.8
    const intensityX = width / 2 - intensityBarWidth / 2
    ctx.fillStyle = 'rgba(30,30,40,0.8)'
    ctx.fillRect(intensityX, indicatorY - 8, intensityBarWidth, 6)

    const intensityFill = intensityBarWidth * fightIntensity
    const pulseIntensity = 1 + Math.sin(time * 8) * fightIntensity * 0.3

    if (fightIntensity < 0.3) {
      ctx.fillStyle = `rgba(100,200,100,${pulseIntensity})`
    } else if (fightIntensity < 0.7) {
      ctx.fillStyle = `rgba(255,200,0,${pulseIntensity})`
    } else {
      ctx.fillStyle = `rgba(255,50,50,${pulseIntensity})`
      ctx.shadowBlur = 10
      ctx.shadowColor = '#ff3333'
    }
    ctx.fillRect(intensityX, indicatorY - 8, intensityFill, 6)
    ctx.shadowBlur = 0

    const centerX = indicatorX + indicatorWidth / 2
    const momentumWidth = Math.abs(momentum) * (indicatorWidth / 2)

    if (momentum > 0) {
      ctx.fillStyle = '#44ff44'
      ctx.fillRect(centerX, indicatorY + 5, momentumWidth, 10)
    } else {
      ctx.fillStyle = '#ff4444'
      ctx.fillRect(centerX - momentumWidth, indicatorY + 5, momentumWidth, 10)
    }

    ctx.strokeStyle = `rgba(255,255,255,${0.8 + Math.sin(time * 4) * 0.2})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(centerX, indicatorY)
    ctx.lineTo(centerX, indicatorY + 15)
    ctx.stroke()

    const labelScale = Math.round((1 + fightIntensity * 0.1) * 2) / 2
    ctx.save()
    ctx.scale(labelScale, labelScale)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 10px "Inter"'
    ctx.textAlign = 'left'
    ctx.fillText(fighters[0]?.name || 'Fighter 1', (indicatorX - 5) / labelScale, (indicatorY + 35) / labelScale)
    ctx.textAlign = 'right'
    ctx.fillText(fighters[1]?.name || 'Fighter 2', (indicatorX + indicatorWidth + 5) / labelScale, (indicatorY + 35) / labelScale)
    ctx.restore()

    if (fightIntensity > 0.8) {
      ctx.fillStyle = `rgba(255,255,0,${Math.sin(time * 6) * 0.5 + 0.5})`
      ctx.font = 'bold 12px "Press Start 2P"'
      ctx.textAlign = 'center'
      ctx.fillText('CROWD ON THEIR FEET!', width / 2, indicatorY + 55)
    } else if (fightIntensity > 0.5) {
      ctx.fillStyle = `rgba(255,200,0,${Math.sin(time * 4) * 0.3 + 0.7})`
      ctx.font = '10px "Inter"'
      ctx.textAlign = 'center'
      ctx.fillText('The tension is building...', width / 2, indicatorY + 50)
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
