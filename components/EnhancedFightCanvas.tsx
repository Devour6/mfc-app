'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FightState, Fighter } from '@/types'

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
  const [roundStats, setRoundStats] = useState<{
    [round: number]: {
      fighter1Strikes: number
      fighter2Strikes: number
      significantMoments: number
    }
  }>({})
  const [showRoundCard, setShowRoundCard] = useState(false)
  const [lastRound, setLastRound] = useState(0)

  // Handle round transitions
  useEffect(() => {
    if (fightState.round !== lastRound && fightState.round > 0) {
      setShowRoundCard(true)
      setLastRound(fightState.round)
      onRoundStart?.(fightState.round)
      
      // Auto-hide round card after 3 seconds
      setTimeout(() => setShowRoundCard(false), 3000)
      
      // Initialize round stats
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

    // Detect strike impacts — render at contact point between fighters
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

    // Detect knockdowns with enhanced effects
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

      // Multiple impact effects for knockdown
      addVisualEffect({
        type: 'impact',
        x: knockedX,
        y: canvas.height * 0.65,
        duration: 2000,
        intensity: 1.0
      })

      addVisualEffect({
        type: 'blood',
        x: knockedX,
        y: canvas.height * 0.60,
        duration: 3000,
        intensity: 0.8
      })

      addVisualEffect({
        type: 'stars',
        x: knockedX,
        y: canvas.height * 0.50,
        duration: 4000,
        intensity: 1.0
      })

      onSignificantMoment?.('knockdown', 'high')
    }

    // Detect hits with blood effects
    if (fightState.fighter1.animation.state === 'hit' && fightState.fighter1.hp < 75) {
      const hitX = (fightState.fighter1.position.x / 480) * canvas.width
      addVisualEffect({
        type: 'blood',
        x: hitX,
        y: canvas.height * 0.60,
        duration: 1500,
        intensity: 0.6
      })
    }

    if (fightState.fighter2.animation.state === 'hit' && fightState.fighter2.hp < 75) {
      const hitX = (fightState.fighter2.position.x / 480) * canvas.width
      addVisualEffect({
        type: 'blood',
        x: hitX,
        y: canvas.height * 0.60,
        duration: 1500,
        intensity: 0.6
      })
    }

    // Detect blocks with defensive effects
    if (fightState.fighter1.animation.state === 'blocking') {
      const blockX = (fightState.fighter1.position.x / 480) * canvas.width
      addVisualEffect({
        type: 'block_flash',
        x: blockX,
        y: canvas.height * 0.60,
        duration: 300,
        intensity: 0.7
      })
    }

    if (fightState.fighter2.animation.state === 'blocking') {
      const blockX = (fightState.fighter2.position.x / 480) * canvas.width
      addVisualEffect({
        type: 'block_flash',
        x: blockX,
        y: canvas.height * 0.60,
        duration: 300,
        intensity: 0.7
      })
    }

    // Detect combos with enhanced effects
    if (fightState.fighter1.combo.count > 3 || fightState.fighter2.combo.count > 3) {
      const comboFighter = fightState.fighter1.combo.count > 3 ? 1 : 2
      const comboX = (comboFighter === 1 ? fightState.fighter1.position.x : fightState.fighter2.position.x / 480) * canvas.width
      
      addRoundEvent({
        type: 'combo',
        severity: 'medium',
        description: `${fighters[comboFighter - 1].name} lands a devastating combo!`,
        fighter: comboFighter
      })

      addVisualEffect({
        type: 'combo_explosion',
        x: comboX,
        y: canvas.height * 0.65,
        duration: 1200,
        intensity: 0.9
      })
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
    
    setRoundEvents(prev => [newEvent, ...prev.slice(0, 9)]) // Keep last 10 events
    
    // Update round stats
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
    
    // Remove effect after duration
    setTimeout(() => {
      setVisualEffects(prev => prev.filter(e => e.id !== newEffect.id))
    }, effect.duration)
  }

  const drawEnhancedFrame = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, '#000814')
    gradient.addColorStop(0.6, '#001d3d') 
    gradient.addColorStop(1, '#003566')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
    
    // Draw enhanced ring
    drawEnhancedRing(ctx, width, height)
    
    // Draw crowd atmosphere
    drawCrowdAtmosphere(ctx, width, height)
    
    // Draw fighters with enhanced animations
    if (fightState.fighter1 && fightState.fighter2) {
      drawEnhancedFighter(ctx, fightState.fighter1, fighters[0], width, height, '#ff4444', 1)
      drawEnhancedFighter(ctx, fightState.fighter2, fighters[1], width, height, '#4488ff', 2)
    }
    
    // Draw visual effects
    drawVisualEffects(ctx)
    
    // Draw round progress HUD
    drawRoundProgressHUD(ctx, width, height)
    
    // Draw momentum indicator
    drawMomentumIndicator(ctx, width, height)
  }

  const drawEnhancedRing = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const floorY = height * 0.75
    const ringWidth = width * 0.9
    const ringX = width * 0.05

    // Ring shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.fillRect(ringX + 5, floorY + 5, ringWidth, height * 0.2)

    // Ring floor with texture
    const floorGradient = ctx.createLinearGradient(ringX, floorY, ringX, floorY + height * 0.2)
    floorGradient.addColorStop(0, '#2a1810')
    floorGradient.addColorStop(0.5, '#1a1008')
    floorGradient.addColorStop(1, '#0f0504')
    
    ctx.fillStyle = floorGradient
    ctx.fillRect(ringX, floorY, ringWidth, height * 0.2)

    // Ring canvas texture
    ctx.fillStyle = 'rgba(255,255,255,0.02)'
    for (let i = 0; i < 10; i++) {
      ctx.fillRect(ringX + (ringWidth / 10) * i, floorY, 1, height * 0.2)
    }

    // Enhanced ropes with glow
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

    // Corner posts with LED strips
    ctx.fillStyle = '#333'
    ctx.fillRect(ringX - 8, floorY - height * 0.26, 8, height * 0.26)
    ctx.fillRect(ringX + ringWidth, floorY - height * 0.26, 8, height * 0.26)
    
    // LED effect on posts
    ctx.fillStyle = '#00ff88'
    for (let i = 0; i < 5; i++) {
      const ledY = floorY - height * 0.24 + i * (height * 0.04)
      ctx.fillRect(ringX - 6, ledY, 4, 2)
      ctx.fillRect(ringX + ringWidth + 2, ledY, 4, 2)
    }

    // Enhanced MFC logo with glow
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
    
    // Dynamic crowd excitement based on fight intensity
    const fightIntensity = 1 - (Math.min(fightState.fighter1?.hp || 100, fightState.fighter2?.hp || 100) / 100)
    const crowdExcitement = 0.3 + fightIntensity * 0.7
    
    // Animated crowd silhouettes in background — smooth gradient to avoid blocky artifacts
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

    // Stadium atmosphere - camera flashes
    if (Math.random() < fightIntensity * 0.02) {
      const flashX = Math.random() * width
      const flashY = height * (0.1 + Math.random() * 0.15)
      
      ctx.fillStyle = `rgba(255,255,255,${0.6 + Math.random() * 0.4})`
      ctx.beginPath()
      ctx.arc(flashX, flashY, 2 + Math.random() * 3, 0, Math.PI * 2)
      ctx.fill()
    }

    // Enhanced arena lights with excitement-based intensity
    const lightPositions = [width * 0.2, width * 0.5, width * 0.8]
    lightPositions.forEach((x, index) => {
      const baseIntensity = 0.8 + Math.sin(time + index) * 0.2
      const excitedIntensity = baseIntensity + crowdExcitement * 0.4
      const lightGradient = ctx.createRadialGradient(x, height * 0.1, 0, x, height * 0.1, 150)
      lightGradient.addColorStop(0, `rgba(255,255,255,${excitedIntensity * 0.4})`)
      lightGradient.addColorStop(1, 'rgba(255,255,255,0)')
      
      ctx.fillStyle = lightGradient
      ctx.fillRect(x - 150, height * 0.1, 300, height * 0.4)
      
      // Spotlight beams
      if (fightIntensity > 0.6) {
        const beamGradient = ctx.createLinearGradient(x, height * 0.1, x, height * 0.6)
        beamGradient.addColorStop(0, `rgba(255,255,200,${excitedIntensity * 0.1})`)
        beamGradient.addColorStop(1, 'rgba(255,255,200,0)')
        ctx.fillStyle = beamGradient
        ctx.fillRect(x - 30, height * 0.1, 60, height * 0.5)
      }
    })

    // Crowd noise visualization (sound waves)
    if (fightIntensity > 0.4) {
      ctx.strokeStyle = `rgba(255,255,255,${crowdExcitement * 0.1})`
      ctx.lineWidth = 1
      for (let i = 0; i < 5; i++) {
        const waveY = height * 0.1 + i * 8
        ctx.beginPath()
        for (let x = 0; x < width; x += 5) {
          const waveHeight = Math.sin((x + time * 200) * 0.02 + i) * crowdExcitement * 3
          if (x === 0) {
            ctx.moveTo(x, waveY + waveHeight)
          } else {
            ctx.lineTo(x, waveY + waveHeight)
          }
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
    
    // Convert position to canvas coordinates with movement physics
    const baseX = (fighterState.position.x / 480) * width
    const baseY = floorY - 20

    // Add movement animations
    const time = Date.now() * 0.001
    const idleBob = Math.sin(time * 2 + fighterNumber * Math.PI) * 1
    const isInCombat = fighterState.animation.state === 'punching' || fighterState.animation.state === 'kicking' || fighterState.animation.state === 'hit' || fighterState.animation.state === 'blocking'
    const circlingOffset = isInCombat ? 0 : Math.sin(time * 0.5 + fighterNumber * Math.PI) * 5

    const x = baseX + circlingOffset
    const y = baseY + idleBob

    ctx.save()
    
    // Enhanced screen shake for heavy hits
    if (fighterState.animation.state === 'hit') {
      const shakeIntensity = fighterState.hp < 25 ? 8 : 5
      ctx.translate(
        (Math.random() - 0.5) * shakeIntensity,
        (Math.random() - 0.5) * shakeIntensity
      )
      ctx.globalAlpha = 0.8
    }

    // Camera shake for knockdowns
    if (fighterState.animation.state === 'down') {
      const shakeIntensity = 12
      ctx.translate(
        Math.sin(time * 10) * shakeIntensity,
        Math.cos(time * 8) * shakeIntensity * 0.5
      )
    }

    // Stamina-based effects
    ctx.globalAlpha *= Math.max(0.7, fighterState.stamina / 100)

    // Enhanced dynamic shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.save()
    ctx.scale(1, 0.2)
    ctx.beginPath()
    ctx.arc(x, (floorY + 10) / 0.2, 25, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // Draw humanoid fighter with proper animation state
    const animationFrame = Math.floor(time * 10) % 4 // 4-frame animation cycle
    drawHumanoidFighter(ctx, x, y, color, fighterState, fighterNumber, animationFrame)

    // Particle effects
    if (fighterState.hp < 50) {
      drawSweatParticles(ctx, x, y - 60)
    }

    if (fighterState.animation.state === 'punching') {
      drawMotionTrail(ctx, x, y, fighterState.position.facing, 'punching')
    }

    if (fighterState.animation.state === 'kicking') {
      drawMotionTrail(ctx, x, y, fighterState.position.facing, 'kicking')
    }

    ctx.restore()

    // Enhanced fighter info overlay
    drawEnhancedFighterInfo(ctx, fighterData, fighterState, x, y - 70, color, fighterNumber)
  }

  // Main humanoid fighter drawing function with proper anatomy
  const drawHumanoidFighter = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    fighterState: typeof fightState.fighter1,
    fighterNumber: 1 | 2,
    animationFrame: number
  ) => {
    const facing = fighterState.position.facing
    const state = fighterState.animation.state
    const time = Date.now() * 0.001
    
    ctx.save()
    
    // Animation-based positioning and rotations
    let headY = y - 50
    let torsoY = y - 35
    let armY = y - 30
    let legY = y - 10
    let bodyLean = 0
    let armExtension = 0
    let legExtension = 0
    const attackType = fighterState.animation.attackType || ''
    let isKicking = false

    // State-specific animations
    switch (state) {
      case 'punching':
        // Differentiate punch visuals by attackType
        switch (attackType) {
          case 'jab':
            armExtension = 18 + Math.sin(time * 18) * 3
            bodyLean = facing * 2
            break
          case 'cross':
            armExtension = 30 + Math.sin(time * 15) * 5
            bodyLean = facing * 8
            headY -= 2
            break
          case 'hook':
            armExtension = 15
            bodyLean = facing * 12
            torsoY -= 2
            break
          case 'uppercut':
            armExtension = 20
            armY -= 15
            bodyLean = facing * 6
            headY -= 4
            break
          default:
            armExtension = 25 + Math.sin(time * 15) * 5
            bodyLean = facing * 5
            headY -= 2
            break
        }
        break
      case 'kicking':
        isKicking = true
        if (attackType === 'roundhouse') {
          // Roundhouse: big sweeping leg, body leans back
          legExtension = 35 + Math.sin(time * 10) * 8
          bodyLean = -facing * 12
          armY -= 8
        } else {
          // Front kick: leg extends forward, slight lean
          legExtension = 28 + Math.sin(time * 12) * 6
          bodyLean = -facing * 6
          armY -= 5
        }
        break
      case 'hit':
        bodyLean = -facing * 12
        headY += 3
        break
      case 'blocking':
        armY -= 10
        bodyLean = -facing * 2
        break
      case 'down':
        // Lying down animation
        drawKnockedDownHumanoid(ctx, x, y, color, animationFrame)
        ctx.restore()
        return
    }

    // Apply body lean
    ctx.translate(x, y)
    ctx.rotate(bodyLean * Math.PI / 180)
    ctx.translate(-x, -y)

    // Draw humanoid parts in proper order (back to front)
    
    // Back leg
    if (facing === 1) {
      drawLeg(ctx, x - 8, legY, color, false, 0, false)
    } else {
      drawLeg(ctx, x + 8, legY, color, false, 0, false)
    }

    // Back arm
    if (facing === 1) {
      drawArm(ctx, x - 15, armY, color, facing, false, armExtension, state === 'punching')
    } else {
      drawArm(ctx, x + 15, armY, color, facing, false, armExtension, state === 'punching')
    }

    // Torso with muscle definition
    drawTorso(ctx, x, torsoY, color, state)

    // Head with facial features
    drawHead(ctx, x, headY, color, facing, state, fighterState.hp)

    // Front arm (punching arm)
    if (facing === 1) {
      drawArm(ctx, x + 15, armY, color, facing, true, armExtension, state === 'punching')
    } else {
      drawArm(ctx, x - 15, armY, color, facing, true, armExtension, state === 'punching')
    }

    // Front leg (kicking leg)
    if (facing === 1) {
      drawLeg(ctx, x + 8, legY, color, true, legExtension, isKicking)
    } else {
      drawLeg(ctx, x - 8, legY, color, true, legExtension, isKicking)
    }

    ctx.restore()
  }

  // Pixel size constant for 16-bit sprite look
  const P = 4

  // Helper: draw a single pixel block with optional outline
  const px = (ctx: CanvasRenderingContext2D, x: number, y: number, c: string) => {
    ctx.fillStyle = c
    ctx.fillRect(x, y, P, P)
  }

  // Helper: draw a pixel block with dark outline
  const pxo = (ctx: CanvasRenderingContext2D, x: number, y: number, c: string) => {
    ctx.fillStyle = '#111'
    ctx.fillRect(x - 1, y - 1, P + 2, P + 2)
    ctx.fillStyle = c
    ctx.fillRect(x, y, P, P)
  }

  // Helper: draw pixel sprite from grid (2D array of colors, '' = skip)
  const drawSprite = (ctx: CanvasRenderingContext2D, ox: number, oy: number, grid: string[][]) => {
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid[row].length; col++) {
        const c = grid[row][col]
        if (c) px(ctx, ox + col * P, oy + row * P, c)
      }
    }
  }

  // Helper: darken a hex color for shading
  const shade = (hex: string): string => {
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 40)
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 40)
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 40)
    return `rgb(${r},${g},${b})`
  }

  // Helper: lighten a hex color for highlights
  const highlight = (hex: string): string => {
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + 50)
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + 50)
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + 50)
    return `rgb(${r},${g},${b})`
  }

  // Individual body part drawing functions — pixel-block style (Street Fighter II)
  const drawHead = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, facing: number, state: string, hp: number) => {
    const s = shade(color)
    const h = highlight(color)
    const ox = x - P * 3 // center the 6-wide head
    const oy = y - P * 4 // top of head

    // Head outline + fill (6 wide x 7 tall pixel grid)
    const O = '#111' // outline
    const C = color
    const S = s
    const H = h
    const SK = '#f0c8a0' // skin tone
    const W = '#fff'

    // Base head shape
    const head: string[][] = [
      ['',  O,  O,  O,  O, ''],
      [ O,  H,  C,  C,  S,  O],
      [ O,  C,  C,  C,  C,  O],
      [ O,  C,  C,  C,  C,  O],
      [ O,  C,  C,  C,  C,  O],
      ['',  O,  C,  C,  O, ''],
      ['', '',  O,  O, '', ''],
    ]
    drawSprite(ctx, ox, oy, head)

    // Eyes and mouth drawn directly
    if (state === 'hit') {
      // X eyes for hit
      px(ctx, ox + P * 1, oy + P * 2, '#ff0')
      px(ctx, ox + P * 4, oy + P * 2, '#ff0')
      px(ctx, ox + P * 2, oy + P * 4, '#c00') // open mouth
      px(ctx, ox + P * 3, oy + P * 4, '#c00')
    } else if (hp < 25) {
      // Tired squint eyes
      px(ctx, ox + P * 1, oy + P * 2, '#800')
      px(ctx, ox + P * 4, oy + P * 2, '#800')
      px(ctx, ox + P * 2, oy + P * 4, '#c00') // blood from mouth
    } else {
      // Normal eyes: white with black pupil
      px(ctx, ox + P * 1, oy + P * 2, W)
      px(ctx, ox + P * 4, oy + P * 2, W)
      // Pupils follow facing
      const pupilOffset = facing > 0 ? 1 : 0
      px(ctx, ox + P * (1 + pupilOffset), oy + P * 2, '#000')
      px(ctx, ox + P * (4 + pupilOffset), oy + P * 2, '#000')
      // Determined mouth
      px(ctx, ox + P * 2, oy + P * 4, '#000')
      px(ctx, ox + P * 3, oy + P * 4, '#000')
    }
  }

  const drawTorso = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, state: string) => {
    const s = shade(color)
    const h = highlight(color)
    const O = '#111'
    const C = color
    const S = s
    const H = h
    const T = state === 'hit' ? '#cc0000' : '#222' // trunks

    const ox = x - P * 4
    const oy = y

    // Torso: 8 wide x 10 tall
    const torso: string[][] = [
      ['',  O,  O,  C,  C,  O,  O, ''],
      [ O,  H,  C,  C,  C,  C,  S,  O],
      [ O,  C,  H,  C,  C,  S,  C,  O],
      [ O,  C,  C,  C,  C,  C,  C,  O],
      [ O,  C,  C,  S,  S,  C,  C,  O],
      [ O,  C,  C,  C,  C,  C,  C,  O],
      ['',  O,  T,  T,  T,  T,  O, ''],
      ['',  O,  T,  T,  T,  T,  O, ''],
      ['', '',  O,  T,  T,  O, '', ''],
      ['', '',  O,  O,  O,  O, '', ''],
    ]
    drawSprite(ctx, ox, oy, torso)
  }

  const drawArm = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, facing: number, isFront: boolean, extension: number, isPunching: boolean) => {
    const s = shade(color)
    const O = '#111'
    const C = color
    const G = isPunching && isFront ? '#ffdd00' : '#eee' // glove color
    const GS = isPunching && isFront ? '#cc9900' : '#bbb'

    ctx.save()
    ctx.translate(x, y)
    if (isFront && isPunching) {
      // Uppercut punches rotate upward, hooks rotate wider
      const punchAngle = extension > 20 ? 55 : 45
      ctx.rotate(facing * punchAngle * Math.PI / 180)
    }

    const armLen = Math.floor((25 + extension) / P)
    const ox = -P

    // Upper arm pixels
    for (let i = 0; i < Math.floor(armLen * 0.5); i++) {
      pxo(ctx, ox, i * P, C)
      pxo(ctx, ox + P, i * P, s)
    }

    // Forearm pixels
    const forearmStart = Math.floor(armLen * 0.5) * P
    for (let i = 0; i < Math.floor(armLen * 0.4); i++) {
      pxo(ctx, ox, forearmStart + i * P, C)
      pxo(ctx, ox + P, forearmStart + i * P, s)
    }

    // Glove (3x3 pixel block)
    const gloveY = (armLen - 2) * P
    for (let gy = 0; gy < 3; gy++) {
      for (let gx = 0; gx < 3; gx++) {
        const gc = (gy === 0 || gx === 0) ? G : GS
        pxo(ctx, ox - P + gx * P, gloveY + gy * P, gc)
      }
    }

    // Punching glove glow
    if (isPunching && isFront) {
      ctx.fillStyle = 'rgba(255,221,0,0.3)'
      ctx.fillRect(ox - P * 2, gloveY - P, P * 5, P * 5)
    }

    ctx.restore()
  }

  const drawLeg = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, isFront: boolean, extension: number, isKicking: boolean) => {
    const s = shade(color)
    const O = '#111'
    const C = color

    ctx.save()
    ctx.translate(x, y)
    if (isKicking && isFront) {
      ctx.rotate(30 * Math.PI / 180)
    }

    const legLen = Math.floor((35 + extension) / P)
    const ox = -P

    // Thigh pixels
    for (let i = 0; i < Math.floor(legLen * 0.5); i++) {
      pxo(ctx, ox, i * P, C)
      pxo(ctx, ox + P, i * P, s)
      if (i < 2) pxo(ctx, ox + P * 2, i * P, s) // thicker at top
    }

    // Shin pixels
    const shinStart = Math.floor(legLen * 0.5) * P
    for (let i = 0; i < Math.floor(legLen * 0.4); i++) {
      pxo(ctx, ox, shinStart + i * P, C)
      pxo(ctx, ox + P, shinStart + i * P, s)
    }

    // Boot (3x2 pixel block)
    const bootY = (legLen - 2) * P
    pxo(ctx, ox - P, bootY, '#111')
    pxo(ctx, ox, bootY, '#222')
    pxo(ctx, ox + P, bootY, '#222')
    pxo(ctx, ox + P * 2, bootY, '#111')
    pxo(ctx, ox - P, bootY + P, '#111')
    pxo(ctx, ox, bootY + P, '#111')
    pxo(ctx, ox + P, bootY + P, '#111')
    pxo(ctx, ox + P * 2, bootY + P, '#111')

    // Kicking boot glow
    if (isKicking && isFront) {
      ctx.fillStyle = 'rgba(255,100,0,0.3)'
      ctx.fillRect(ox - P * 2, bootY - P, P * 6, P * 4)
    }

    ctx.restore()
  }

  const drawKnockedDownHumanoid = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, animationFrame: number) => {
    const s = shade(color)
    ctx.save()
    ctx.translate(x, y + 20)

    // Body horizontal — pixel blocks
    for (let i = -5; i <= 5; i++) {
      pxo(ctx, i * P, -P, i < 0 ? shade(color) : color)
      pxo(ctx, i * P, 0, color)
    }

    // Head on side
    for (let gy = -2; gy <= 1; gy++) {
      for (let gx = -8; gx <= -6; gx++) {
        pxo(ctx, gx * P, gy * P, color)
      }
    }
    // Dazed X eyes
    px(ctx, -8 * P, -P, '#ff0')
    px(ctx, -6 * P, -P, '#ff0')

    // Pixel stars spinning above
    const time = Date.now() * 0.003
    for (let i = 0; i < 3; i++) {
      const starX = -7 * P + i * P * 4
      const starY = -4 * P + Math.sin(time + i * 2) * P * 2
      px(ctx, starX, starY, '#ffdd00')
      px(ctx, starX + P, starY, '#ffdd00')
      px(ctx, starX, starY + P, '#ffdd00')
      px(ctx, starX + P, starY + P, '#ffdd00')
    }

    // Sprawled arms + legs as pixel blocks
    for (let i = 0; i < 4; i++) {
      pxo(ctx, 6 * P + i * P, -P, s) // arm
      pxo(ctx, -9 * P - i * P, 0, s) // other arm
    }
    pxo(ctx, -2 * P, 2 * P, s) // leg
    pxo(ctx, -2 * P, 3 * P, s)
    pxo(ctx, -2 * P, 4 * P, '#111') // boot
    pxo(ctx, P, 2 * P, s) // other leg
    pxo(ctx, P, 3 * P, s)
    pxo(ctx, P, 4 * P, '#111') // boot

    ctx.restore()
  }

  // Pixel-style particle effects
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
        // Pixel speed lines
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

  const drawEnhancedStarsEffect = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const time = Date.now() * 0.003
    for (let i = 0; i < 4; i++) {
      const sx = x + Math.floor((i - 1.5) * P * 5)
      const sy = y + Math.floor(Math.sin(time + i * 1.5) * P * 2)
      // Pixel star: 3x3 cross pattern
      px(ctx, sx + P, sy, '#ffdd00')
      px(ctx, sx, sy + P, '#ffdd00')
      px(ctx, sx + P, sy + P, '#fff')
      px(ctx, sx + P * 2, sy + P, '#ffdd00')
      px(ctx, sx + P, sy + P * 2, '#ffdd00')
    }
  }

  const drawBloodSplatters = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const time = Date.now() * 0.001
    for (let i = 0; i < 6; i++) {
      const bx = x + Math.floor((Math.sin(time + i * 0.7) * 20) / P) * P
      const by = y + Math.floor((i * 5) / P) * P
      px(ctx, bx, by, '#cc0000')
      if (i % 2 === 0) px(ctx, bx + P, by, '#990000')
    }
  }

  const drawHeavyBreathing = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const time = Date.now() * 0.003
    for (let i = 0; i < 3; i++) {
      const cx = x + P * 3 + i * P * 2
      const cy = y + Math.floor(Math.sin(time + i) * P)
      ctx.globalAlpha = 0.3 + Math.sin(time * 2 + i) * 0.15
      px(ctx, cx, cy, '#ddf')
      px(ctx, cx + P, cy, '#ddf')
      ctx.globalAlpha = 1
    }
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
    // Enhanced name plate with background
    const nameWidth = ctx.measureText(fighter.name).width + 20
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(x - nameWidth/2, y - 25, nameWidth, 20)
    
    ctx.fillStyle = color
    ctx.font = '12px "Press Start 2P"'
    ctx.textAlign = 'center'
    ctx.fillText(fighter.name, x, y - 10)

    // Enhanced HP bar with segments
    const barWidth = 100
    const barHeight = 8
    const barX = x - barWidth / 2
    const hpY = y - 5

    // Background
    ctx.fillStyle = '#1a1a26'
    ctx.fillRect(barX, hpY, barWidth, barHeight)

    // HP segments (each segment = 20 HP)
    for (let i = 0; i < 5; i++) {
      const segmentWidth = barWidth / 5
      const segmentX = barX + i * segmentWidth
      const segmentHP = Math.max(0, fighterState.hp - i * 20)
      
      if (segmentHP > 0) {
        const segmentFill = Math.min(1, segmentHP / 20)
        const segmentColor = segmentHP > 10 ? color : '#ff4444'
        
        ctx.fillStyle = segmentColor
        ctx.fillRect(segmentX + 1, hpY + 1, (segmentWidth - 2) * segmentFill, barHeight - 2)
      }
    }

    // HP border
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.strokeRect(barX, hpY, barWidth, barHeight)

    // Stamina bar (smaller, below HP)
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
        case 'impact':
          drawImpactEffect(ctx, effect)
          break
        case 'sparks':
          drawSparksEffect(ctx, effect)
          break
        case 'blood':
          drawBloodEffect(ctx, effect)
          break
        case 'stars':
          drawStarsEffect(ctx, effect)
          break
        case 'block_flash':
          drawBlockFlashEffect(ctx, effect)
          break
        case 'combo_explosion':
          drawComboExplosionEffect(ctx, effect)
          break
        case 'screen_shake':
          drawScreenShakeEffect(ctx, effect)
          break
        case 'slow_motion':
          // Slow motion effect handled by animation timing
          break
      }
      
      ctx.restore()
    })
  }

  const drawImpactEffect = (ctx: CanvasRenderingContext2D, effect: VisualEffect) => {
    const radius = 40 * effect.intensity
    const time = Date.now() * 0.01
    
    // Main impact burst
    const gradient = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, radius)
    gradient.addColorStop(0, `rgba(255,255,255,${effect.intensity})`)
    gradient.addColorStop(0.3, `rgba(255,200,0,${effect.intensity * 0.8})`)
    gradient.addColorStop(0.7, `rgba(255,68,68,${effect.intensity * 0.6})`)
    gradient.addColorStop(1, 'rgba(255,68,68,0)')
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(effect.x, effect.y, radius, 0, Math.PI * 2)
    ctx.fill()
    
    // Dynamic impact lines
    ctx.strokeStyle = `rgba(255,255,255,${effect.intensity})`
    ctx.lineWidth = 3
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + time * 0.1
      const startRadius = radius * 0.2
      const endRadius = radius * (0.6 + Math.sin(time + i) * 0.2)
      
      ctx.beginPath()
      ctx.moveTo(
        effect.x + Math.cos(angle) * startRadius,
        effect.y + Math.sin(angle) * startRadius
      )
      ctx.lineTo(
        effect.x + Math.cos(angle) * endRadius,
        effect.y + Math.sin(angle) * endRadius
      )
      ctx.stroke()
    }
    
    // Screen flash effect for heavy impacts
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
      
      // Spark trail
      ctx.strokeStyle = `rgba(255,255,0,${effect.intensity * 0.8})`
      ctx.lineWidth = size
      ctx.beginPath()
      ctx.moveTo(sparkX, sparkY)
      ctx.lineTo(sparkX - Math.cos(angle) * 8, sparkY - Math.sin(angle) * 8)
      ctx.stroke()
      
      // Spark core
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
      
      // Blood trail
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
      ctx.fillText('★', 0, 0)
      ctx.restore()
    }
  }

  const drawBlockFlashEffect = (ctx: CanvasRenderingContext2D, effect: VisualEffect) => {
    const time = Date.now() * 0.02
    const flashIntensity = effect.intensity * (1 - Math.sin(time))
    
    // Block shield effect
    ctx.strokeStyle = `rgba(0,100,255,${flashIntensity})`
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(effect.x, effect.y, 30, 0, Math.PI * 2)
    ctx.stroke()
    
    // Inner glow
    ctx.fillStyle = `rgba(200,200,255,${flashIntensity * 0.3})`
    ctx.beginPath()
    ctx.arc(effect.x, effect.y, 25, 0, Math.PI * 2)
    ctx.fill()
    
    // Block sparks
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
    
    // Multiple explosion rings
    for (let ring = 0; ring < 3; ring++) {
      const ringRadius = explosionRadius * (0.3 + ring * 0.35)
      const ringAlpha = effect.intensity * (1 - ring * 0.3) * Math.sin(time * 2 + ring)
      
      ctx.strokeStyle = `rgba(255,100,0,${ringAlpha})`
      ctx.lineWidth = 5 - ring
      ctx.beginPath()
      ctx.arc(effect.x, effect.y, ringRadius, 0, Math.PI * 2)
      ctx.stroke()
    }
    
    // Combo text effect
    ctx.fillStyle = `rgba(255,255,0,${effect.intensity})`
    ctx.font = 'bold 24px "Press Start 2P"'
    ctx.textAlign = 'center'
    ctx.save()
    ctx.translate(effect.x, effect.y - 40)
    const comboScale = Math.round((1 + Math.sin(time * 5) * 0.2) * 2) / 2
    ctx.scale(comboScale, comboScale)
    ctx.fillText('COMBO!', 0, 0)
    ctx.restore()
    
    // Explosion particles
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
    const time = Date.now() * 0.01
    const shakeIntensity = effect.intensity * 15
    
    // Apply camera shake by translating the entire canvas context
    const offsetX = Math.sin(time * 30) * shakeIntensity * (1 - (Date.now() % effect.duration) / effect.duration)
    const offsetY = Math.cos(time * 35) * shakeIntensity * 0.6 * (1 - (Date.now() % effect.duration) / effect.duration)
    
    ctx.translate(offsetX, offsetY)
    
    // Add a subtle flash overlay for heavy impacts
    const flashAlpha = effect.intensity * 0.1 * (1 - (Date.now() % effect.duration) / effect.duration)
    ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`
    ctx.fillRect(-offsetX, -offsetY, ctx.canvas.width, ctx.canvas.height)
  }

  const drawRoundProgressHUD = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const hudY = 30
    
    // Round timer background
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(width/2 - 80, hudY - 15, 160, 30)
    
    // Round number and time
    ctx.fillStyle = '#ffd700'
    ctx.font = 'bold 16px "Press Start 2P"'
    ctx.textAlign = 'center'
    ctx.fillText(`ROUND ${fightState.round}`, width/2, hudY - 2)

    ctx.fillStyle = '#ffffff'
    ctx.font = '14px "Inter"'
    const timeLeft = Math.max(0, fightState.clock) // countdown from 180
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, width/2, hudY + 12)
  }

  const drawMomentumIndicator = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const indicatorY = height - 80
    const indicatorWidth = 250
    const indicatorX = width/2 - indicatorWidth/2
    
    // Calculate momentum based on HP difference
    const f1HP = fightState.fighter1?.hp || 100
    const f2HP = fightState.fighter2?.hp || 100
    const momentum = (f1HP - f2HP) / 100 // -1 to 1 range
    
    // Calculate fight intensity
    const avgHP = (f1HP + f2HP) / 2
    const fightIntensity = 1 - (avgHP / 100)
    const time = Date.now() * 0.001
    
    // Enhanced background with pulse
    const bgAlpha = 0.7 + Math.sin(time * 2) * fightIntensity * 0.2
    ctx.fillStyle = `rgba(0,0,0,${bgAlpha})`
    ctx.fillRect(indicatorX - 10, indicatorY - 25, indicatorWidth + 20, 50)
    
    // Fight intensity indicator
    ctx.fillStyle = '#ffd700'
    ctx.font = 'bold 10px "Inter"'
    ctx.textAlign = 'center'
    ctx.fillText('FIGHT INTENSITY', width/2, indicatorY - 15)
    
    // Intensity bar (pulsing)
    const intensityBarWidth = indicatorWidth * 0.8
    const intensityX = width/2 - intensityBarWidth/2
    
    ctx.fillStyle = 'rgba(30,30,40,0.8)'
    ctx.fillRect(intensityX, indicatorY - 8, intensityBarWidth, 6)
    
    const intensityFill = intensityBarWidth * fightIntensity
    const pulseIntensity = 1 + Math.sin(time * 8) * fightIntensity * 0.3
    
    // Dynamic color based on intensity
    if (fightIntensity < 0.3) {
      ctx.fillStyle = `rgba(100,200,100,${pulseIntensity})`
    } else if (fightIntensity < 0.7) {
      ctx.fillStyle = `rgba(255,200,0,${pulseIntensity})`
    } else {
      ctx.fillStyle = `rgba(255,50,50,${pulseIntensity})`
      // Add glow for high intensity
      ctx.shadowBlur = 10
      ctx.shadowColor = '#ff3333'
    }
    
    ctx.fillRect(intensityX, indicatorY - 8, intensityFill, 6)
    ctx.shadowBlur = 0
    
    // Momentum bar
    const centerX = indicatorX + indicatorWidth/2
    const momentumWidth = Math.abs(momentum) * (indicatorWidth/2)
    
    if (momentum > 0) {
      ctx.fillStyle = '#44ff44'
      ctx.fillRect(centerX, indicatorY + 5, momentumWidth, 10)
    } else {
      ctx.fillStyle = '#ff4444'
      ctx.fillRect(centerX - momentumWidth, indicatorY + 5, momentumWidth, 10)
    }
    
    // Center line with pulse
    ctx.strokeStyle = `rgba(255,255,255,${0.8 + Math.sin(time * 4) * 0.2})`
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(centerX, indicatorY)
    ctx.lineTo(centerX, indicatorY + 15)
    ctx.stroke()
    
    // Labels with excitement scaling
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
    
    // Add "CROWD ON THEIR FEET!" text when intensity is very high
    if (fightIntensity > 0.8) {
      ctx.fillStyle = `rgba(255,255,0,${Math.sin(time * 6) * 0.5 + 0.5})`
      ctx.font = 'bold 12px "Press Start 2P"'
      ctx.textAlign = 'center'
      ctx.fillText('CROWD ON THEIR FEET!', width/2, indicatorY + 55)
    } else if (fightIntensity > 0.5) {
      ctx.fillStyle = `rgba(255,200,0,${Math.sin(time * 4) * 0.3 + 0.7})`
      ctx.font = '10px "Inter"'
      ctx.textAlign = 'center'
      ctx.fillText('The tension is building...', width/2, indicatorY + 50)
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
              className={`mb-2 p-2 rounded text-sm font-pixel ${
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
      <div className="absolute top-20 right-4 bg-black/70 text-white p-3 rounded text-xs font-ui">
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