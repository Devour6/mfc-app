'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FightState, Fighter } from '@/types'
import { FIGHTER_MAX_HP } from '@/lib/fight-engine'
import { RoundEvent, VisualEffect } from '@/lib/canvas/types'
import { clamp } from '@/lib/canvas/utils'
import { ATTACK_WEIGHT, KB_INITIAL_VELOCITY, KB_FRICTION, KB_SPRING, KB_MAX_OFFSET } from '@/lib/canvas/constants'
import type { AttackWeight } from '@/lib/canvas/constants'
import { drawEnhancedRing, drawCrowdAtmosphere, drawStageMood } from '@/lib/canvas/stage-renderer'
import { drawEnhancedFighter } from '@/lib/canvas/fighter-renderer'
import { drawVisualEffects, drawImpactFlash } from '@/lib/canvas/effects-renderer'
import { drawSF2HUD } from '@/lib/canvas/hud-renderer'

interface EnhancedFightCanvasProps {
  fightState: FightState
  fighters: Fighter[]
  onRoundStart?: (round: number) => void
  onSignificantMoment?: (moment: string, severity: 'low' | 'medium' | 'high') => void
}

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
  const prevAnimRef = useRef<{ f1: string; f2: string }>({ f1: 'idle', f2: 'idle' })

  // Knockback weight — persists between frames to drive weight-dependent physics
  const knockbackWeightRef = useRef<{ f1: AttackWeight; f2: AttackWeight }>({ f1: 'medium', f2: 'medium' })

  // Hit-stop: cache animation progress at moment of freeze
  const hitStopProgressRef = useRef<{ f1: number; f2: number }>({ f1: 0, f2: 0 })

  const [roundStats, setRoundStats] = useState<{
    [round: number]: {
      fighter1Strikes: number
      fighter2Strikes: number
      significantMoments: number
    }
  }>({})
  const [showRoundCard, setShowRoundCard] = useState(false)
  const [lastRound, setLastRound] = useState(0)

  // ── Update interpolation targets when fight state changes ──────────────
  useEffect(() => {
    if (!fightState.fighter1 || !fightState.fighter2) return
    const now = Date.now()
    prevPositionsRef.current = {
      f1: { ...renderPositionsRef.current.f1 },
      f2: { ...renderPositionsRef.current.f2 },
      timestamp: now,
    }
  }, [fightState.fighter1?.position.x, fightState.fighter2?.position.x])

  // ── Detect transitions into 'hit' state → trigger knockback ────────────
  useEffect(() => {
    if (!fightState.fighter1 || !fightState.fighter2) return
    const f1State = fightState.fighter1.animation.state
    const f2State = fightState.fighter2.animation.state

    if (f1State === 'hit' && prevAnimRef.current.f1 !== 'hit') {
      // SF2: knockback velocity scales with attacker's attack weight
      const atkType = fightState.fighter2.animation.attackType || 'jab'
      const weight: AttackWeight = ATTACK_WEIGHT[atkType] || 'medium'
      knockbackRef.current.f1.velocity = fightState.fighter1.position.facing * -KB_INITIAL_VELOCITY[weight]
      knockbackWeightRef.current.f1 = weight
    }
    if (f2State === 'hit' && prevAnimRef.current.f2 !== 'hit') {
      const atkType = fightState.fighter1.animation.attackType || 'jab'
      const weight: AttackWeight = ATTACK_WEIGHT[atkType] || 'medium'
      knockbackRef.current.f2.velocity = fightState.fighter2.position.facing * -KB_INITIAL_VELOCITY[weight]
      knockbackWeightRef.current.f2 = weight
    }

    prevAnimRef.current.f1 = f1State
    prevAnimRef.current.f2 = f2State
  }, [fightState.fighter1?.animation.state, fightState.fighter2?.animation.state])

  // ── Handle round transitions ───────────────────────────────────────────
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

  // ── Enhanced combat detection with visual effects ──────────────────────
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

      addVisualEffect({ type: 'impact', x: contactX, y: impactY, duration: isHeavy ? 800 : 500, intensity: isHeavy ? 1.0 : 0.8 })
      addVisualEffect({ type: 'sparks', x: contactX, y: impactY, duration: isHeavy ? 1200 : 800, intensity: isHeavy ? 0.9 : 0.6 })

      if (isHeavy) {
        addVisualEffect({ type: 'screen_shake', x: canvas.width / 2, y: canvas.height / 2, duration: 300, intensity: isKick ? 1.0 : 0.8 })
      }
    }

    if (isF2Striking) {
      const isHeavy = Math.random() > 0.7
      const isKick = fightState.fighter2.animation.state === 'kicking'
      const impactY = isKick ? canvas.height * 0.68 : canvas.height * 0.62

      addVisualEffect({ type: 'impact', x: contactX, y: impactY, duration: isHeavy ? 800 : 500, intensity: isHeavy ? 1.0 : 0.8 })
      addVisualEffect({ type: 'sparks', x: contactX, y: impactY, duration: isHeavy ? 1200 : 800, intensity: isHeavy ? 0.9 : 0.6 })

      if (isHeavy) {
        addVisualEffect({ type: 'screen_shake', x: canvas.width / 2, y: canvas.height / 2, duration: 300, intensity: isKick ? 1.0 : 0.8 })
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

  // ── Canvas setup and animation loop ────────────────────────────────────
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
      // Update knockback physics — SF2: weight-dependent friction, spring, clamp
      for (const key of ['f1', 'f2'] as const) {
        const kb = knockbackRef.current[key]
        const weight = knockbackWeightRef.current[key]
        kb.offset += kb.velocity
        kb.velocity *= KB_FRICTION[weight]
        kb.offset *= KB_SPRING[weight]
        kb.offset = clamp(kb.offset, -KB_MAX_OFFSET[weight], KB_MAX_OFFSET[weight])
        if (Math.abs(kb.offset) < 0.5 && Math.abs(kb.velocity) < 0.5) {
          kb.offset = 0
          kb.velocity = 0
        }
      }

      drawFrame(ctx, canvas.width, canvas.height)
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

  // ── Event helpers ──────────────────────────────────────────────────────
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

  // ── Main draw dispatcher — delegates to canvas modules ─────────────────
  const drawFrame = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, '#000814')
    gradient.addColorStop(0.6, '#001d3d')
    gradient.addColorStop(1, '#003566')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // Stage + crowd
    drawEnhancedRing(ctx, width, height)
    drawCrowdAtmosphere(ctx, width, height,
      fightState.fighter1?.hp ?? FIGHTER_MAX_HP,
      fightState.fighter2?.hp ?? FIGHTER_MAX_HP,
      fightState.fighter1 && fightState.fighter2 ? {
        f1AnimState: fightState.fighter1.animation.state,
        f2AnimState: fightState.fighter2.animation.state,
        f1Combo: fightState.fighter1.combo.count,
        f2Combo: fightState.fighter2.combo.count,
      } : undefined
    )

    // Stage mood lighting — color temperature shifts as fight intensifies
    drawStageMood(ctx, width, height,
      fightState.fighter1?.hp ?? FIGHTER_MAX_HP,
      fightState.fighter2?.hp ?? FIGHTER_MAX_HP,
      fightState.fighter1 && fightState.fighter2 ? {
        f1AnimState: fightState.fighter1.animation.state,
        f2AnimState: fightState.fighter2.animation.state,
        f1Combo: fightState.fighter1.combo.count,
        f2Combo: fightState.fighter2.combo.count,
      } : undefined
    )

    // Fighters
    if (fightState.fighter1 && fightState.fighter2) {
      const fightStateForRenderer = { fighter1: fightState.fighter1, fighter2: fightState.fighter2 }

      // Compute fight outcome for victory/defeat poses
      const f1Outcome = fightState.result ? {
        phase: fightState.phase,
        isWinner: fightState.result.winner === fightState.fighter1.id,
        method: fightState.result.method,
      } : undefined
      const f2Outcome = fightState.result ? {
        phase: fightState.phase,
        isWinner: fightState.result.winner === fightState.fighter2.id,
        method: fightState.result.method,
      } : undefined

      drawEnhancedFighter(ctx, fightState.fighter1, fighters[0], width, height, '#ff4444', 1, fightStateForRenderer, renderPositionsRef, prevPositionsRef, knockbackRef, hitStopProgressRef, f1Outcome)
      drawEnhancedFighter(ctx, fightState.fighter2, fighters[1], width, height, '#4488ff', 2, fightStateForRenderer, renderPositionsRef, prevPositionsRef, knockbackRef, hitStopProgressRef, f2Outcome)

      // SF2 impact flash — white overlay on medium/heavy hit-stop
      drawImpactFlash(ctx, width, height, fightState.fighter1, fightState.fighter2)
    }

    // Visual effects + HUD
    drawVisualEffects(ctx, visualEffects)
    drawSF2HUD(ctx, width, height, fightState, fighters)
  }

  // ── JSX ─────────────────────────────────────────────────────────────────
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
