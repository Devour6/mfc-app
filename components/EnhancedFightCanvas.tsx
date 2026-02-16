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
  type: 'impact' | 'blood' | 'stars' | 'sweat' | 'sparks' | 'block_flash' | 'combo_explosion'
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

    // Detect punching impacts
    if (fightState.fighter1.animation.state === 'punching') {
      const targetX = (fightState.fighter2.position.x / 480) * canvas.width
      addVisualEffect({
        type: 'impact',
        x: targetX,
        y: canvas.height * 0.65,
        duration: 500,
        intensity: 0.8
      })
      
      addVisualEffect({
        type: 'sparks',
        x: targetX,
        y: canvas.height * 0.65,
        duration: 800,
        intensity: 0.6
      })
    }

    if (fightState.fighter2.animation.state === 'punching') {
      const targetX = (fightState.fighter1.position.x / 480) * canvas.width
      addVisualEffect({
        type: 'impact',
        x: targetX,
        y: canvas.height * 0.65,
        duration: 500,
        intensity: 0.8
      })
      
      addVisualEffect({
        type: 'sparks',
        x: targetX,
        y: canvas.height * 0.65,
        duration: 800,
        intensity: 0.6
      })
    }

    // Enhanced punching impacts (includes kicks and different strike types)
    const currentTime = Date.now()
    const kickVariant = Math.sin(currentTime * 0.01) > 0.5 // Randomly treat some punches as kicks for variety

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
    ctx.font = 'bold 36px monospace'
    ctx.fillStyle = 'rgba(255,68,68,0.1)'
    ctx.textAlign = 'center'
    ctx.fillText('MFC', width / 2, floorY + height * 0.1)
    
    ctx.font = 'bold 12px monospace'
    ctx.fillText('FIGHTING CHAMPIONSHIP', width / 2, floorY + height * 0.15)
    ctx.restore()
  }

  const drawCrowdAtmosphere = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Crowd silhouettes in background
    ctx.fillStyle = 'rgba(20,20,30,0.6)'
    for (let i = 0; i < width; i += 20) {
      const crowdHeight = 40 + Math.sin(i * 0.1) * 15
      ctx.fillRect(i, height * 0.15, 15, crowdHeight)
    }

    // Arena lights
    const lightPositions = [width * 0.2, width * 0.5, width * 0.8]
    lightPositions.forEach((x, index) => {
      const intensity = 0.8 + Math.sin(Date.now() * 0.001 + index) * 0.2
      const lightGradient = ctx.createRadialGradient(x, height * 0.1, 0, x, height * 0.1, 150)
      lightGradient.addColorStop(0, `rgba(255,255,255,${intensity * 0.3})`)
      lightGradient.addColorStop(1, 'rgba(255,255,255,0)')
      
      ctx.fillStyle = lightGradient
      ctx.fillRect(x - 150, height * 0.1, 300, height * 0.4)
    })
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
    const baseY = floorY - 100

    // Add movement animations
    const time = Date.now() * 0.001
    const idleBob = Math.sin(time * 2 + fighterNumber * Math.PI) * 3
    const circlingOffset = Math.sin(time * 0.5 + fighterNumber * Math.PI) * 15
    
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
      ctx.filter = 'brightness(2.0) saturate(1.5)'
      
      // Flash effect
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.fillRect(0, 0, width, height)
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
      const isKickVariant = Math.sin(time * 8) > 0.6
      drawMotionTrail(ctx, x, y, fighterState.position.facing, isKickVariant ? 'kicking' : 'punching')
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

    // Add kick variation for punching state
    const isKickVariant = Math.sin(time * 8) > 0.6 && state === 'punching'

    // State-specific animations
    switch (state) {
      case 'punching':
        if (isKickVariant) {
          // Kick animation
          legExtension = 30 + Math.sin(time * 12) * 8
          bodyLean = -facing * 8
          armY -= 5 // Arms up for balance
        } else {
          // Punch animation  
          armExtension = 25 + Math.sin(time * 15) * 5
          bodyLean = facing * 5
          headY -= 2
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
      drawLeg(ctx, x - 8, legY, color, false, legExtension, isKickVariant && Math.sin(time * 12) > 0.5)
    } else {
      drawLeg(ctx, x + 8, legY, color, false, legExtension, isKickVariant && Math.sin(time * 12) > 0.5)
    }
    
    // Back arm
    if (facing === 1) {
      drawArm(ctx, x - 15, armY, color, facing, false, armExtension, state === 'punching' && !isKickVariant)
    } else {
      drawArm(ctx, x + 15, armY, color, facing, false, armExtension, state === 'punching' && !isKickVariant)
    }
    
    // Torso with muscle definition
    drawTorso(ctx, x, torsoY, color, state)
    
    // Head with facial features
    drawHead(ctx, x, headY, color, facing, state, fighterState.hp)
    
    // Front arm (punching arm)
    if (facing === 1) {
      drawArm(ctx, x + 15, armY, color, facing, true, armExtension, state === 'punching' && !isKickVariant)
    } else {
      drawArm(ctx, x - 15, armY, color, facing, true, armExtension, state === 'punching' && !isKickVariant)
    }
    
    // Front leg
    if (facing === 1) {
      drawLeg(ctx, x + 8, legY, color, true, legExtension, isKickVariant && Math.sin(time * 12) < -0.5)
    } else {
      drawLeg(ctx, x - 8, legY, color, true, legExtension, isKickVariant && Math.sin(time * 12) < -0.5)
    }

    ctx.restore()
  }

  // Individual body part drawing functions
  const drawHead = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, facing: number, state: string, hp: number) => {
    // Head shape (oval)
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.ellipse(x, y, 12, 15, 0, 0, Math.PI * 2)
    ctx.fill()
    
    // Face details
    ctx.fillStyle = '#000'
    if (state === 'hit') {
      // Dazed/hurt expression
      ctx.fillText('X', x - 8, y - 3)
      ctx.fillText('X', x + 3, y - 3)
    } else if (hp < 25) {
      // Tired/bloody expression
      ctx.fillStyle = '#cc0000'
      ctx.fillRect(x - 5, y + 8, 10, 2)
      ctx.fillStyle = '#000'
      ctx.fillText('~', x - 8, y - 3)
      ctx.fillText('~', x + 3, y - 3)
    } else {
      // Normal eyes
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(x - 6, y - 3, 3, 0, Math.PI * 2)
      ctx.arc(x + 6, y - 3, 3, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(x - 6 + facing, y - 3, 1.5, 0, Math.PI * 2)
      ctx.arc(x + 6 + facing, y - 3, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }
    
    // Mouth
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.beginPath()
    if (state === 'hit') {
      ctx.arc(x, y + 5, 4, 0, Math.PI) // Open mouth (hurt)
    } else {
      ctx.moveTo(x - 3, y + 5)
      ctx.lineTo(x + 3, y + 5) // Determined line
    }
    ctx.stroke()
  }

  const drawTorso = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, state: string) => {
    // Main torso
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(x - 15, y, 30, 40, 8)
    ctx.fill()
    
    // Chest muscles
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    ctx.beginPath()
    ctx.ellipse(x - 7, y + 8, 6, 8, 0, 0, Math.PI * 2)
    ctx.ellipse(x + 7, y + 8, 6, 8, 0, 0, Math.PI * 2)
    ctx.fill()
    
    // Abs definition
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.ellipse(x, y + 18 + i * 6, 8, 3, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    
    // Shorts/trunks
    ctx.fillStyle = state === 'hit' ? '#ff0000' : '#333'
    ctx.fillRect(x - 12, y + 25, 24, 15)
  }

  const drawArm = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, facing: number, isFront: boolean, extension: number, isPunching: boolean) => {
    const armLength = 25 + extension
    const angle = isFront && isPunching ? facing * 45 * Math.PI / 180 : 0
    
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)
    
    // Upper arm
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(-4, 0, 8, armLength * 0.6, 4)
    ctx.fill()
    
    // Forearm
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(-3, armLength * 0.6, 6, armLength * 0.4, 3)
    ctx.fill()
    
    // Boxing glove
    ctx.fillStyle = isPunching && isFront ? '#ffff00' : '#ffffff'
    if (isPunching && isFront) {
      // Add glow effect for punching glove
      ctx.shadowBlur = 10
      ctx.shadowColor = '#ffff00'
    }
    ctx.beginPath()
    ctx.roundRect(-6, armLength - 8, 12, 12, 6)
    ctx.fill()
    ctx.shadowBlur = 0
    
    ctx.restore()
  }

  const drawLeg = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, isFront: boolean, extension: number, isKicking: boolean) => {
    const legLength = 35 + extension
    const angle = isKicking && isFront ? 30 * Math.PI / 180 : 0
    
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(angle)
    
    // Thigh
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(-6, 0, 12, legLength * 0.6, 6)
    ctx.fill()
    
    // Shin
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(-4, legLength * 0.6, 8, legLength * 0.4, 4)
    ctx.fill()
    
    // Foot/boot
    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.roundRect(-5, legLength - 8, 15, 8, 4)
    ctx.fill()
    
    ctx.restore()
  }

  const drawKnockedDownHumanoid = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, animationFrame: number) => {
    // Fighter lying down
    ctx.save()
    ctx.translate(x, y + 20)
    
    // Body horizontal
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(-20, -8, 40, 16, 8)
    ctx.fill()
    
    // Head on side
    ctx.beginPath()
    ctx.ellipse(-25, -5, 10, 12, Math.PI / 4, 0, Math.PI * 2)
    ctx.fill()
    
    // Dazed stars
    ctx.fillStyle = '#ffff00'
    ctx.font = '16px serif'
    for (let i = 0; i < 3; i++) {
      const starX = -30 + i * 15
      const starY = -25 + Math.sin(Date.now() * 0.01 + i) * 5
      ctx.fillText('★', starX, starY)
    }
    
    // Arms and legs sprawled
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(15, -5, 20, 6, 3)  // Arm
    ctx.roundRect(-35, -5, 20, 6, 3) // Other arm
    ctx.roundRect(-10, 8, 6, 18, 3)  // Leg
    ctx.roundRect(4, 8, 6, 18, 3)    // Other leg
    ctx.fill()
    
    ctx.restore()
  }

  // Enhanced particle and visual effects
  const drawSweatParticles = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const time = Date.now() * 0.001
    ctx.fillStyle = 'rgba(200,200,255,0.6)'
    
    for (let i = 0; i < 5; i++) {
      const sweatX = x + (Math.random() - 0.5) * 30
      const sweatY = y + Math.sin(time * 3 + i) * 10 + Math.random() * 20
      const size = 1 + Math.random() * 2
      
      ctx.beginPath()
      ctx.arc(sweatX, sweatY, size, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const drawMotionTrail = (ctx: CanvasRenderingContext2D, x: number, y: number, facing: number, actionType: string) => {
    const time = Date.now() * 0.001
    const trailCount = 5
    
    ctx.save()
    
    for (let i = 0; i < trailCount; i++) {
      const alpha = (trailCount - i) / trailCount * 0.3
      ctx.globalAlpha = alpha
      
      if (actionType === 'punching') {
        // Punch motion trail
        const trailX = x + facing * (15 + i * 5)
        const trailY = y - 30 + Math.sin(time * 10 + i) * 2
        
        ctx.fillStyle = '#ffff00'
        ctx.beginPath()
        ctx.arc(trailX, trailY, 8 - i, 0, Math.PI * 2)
        ctx.fill()
        
        // Motion lines
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(trailX - facing * 10, trailY)
        ctx.lineTo(trailX + facing * 10, trailY)
        ctx.stroke()
      } else if (actionType === 'kicking') {
        // Kick motion trail
        const trailX = x + facing * (10 + i * 3)
        const trailY = y - 15 + i * 2
        
        ctx.fillStyle = '#ff6600'
        ctx.beginPath()
        ctx.arc(trailX, trailY, 6 - i, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    
    ctx.restore()
  }

  const drawEnhancedStarsEffect = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = '#ffff00'
    ctx.font = 'bold 16px serif'
    ctx.textAlign = 'center'
    
    for (let i = 0; i < 4; i++) {
      const starX = x + (i - 1.5) * 20
      const starY = y + Math.sin(Date.now() * 0.01 + i) * 8
      const rotation = Date.now() * 0.005 + i
      
      ctx.save()
      ctx.translate(starX, starY)
      ctx.rotate(rotation)
      ctx.fillText('★', 0, 0)
      ctx.restore()
    }
  }

  const drawBloodSplatters = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = '#cc0000'
    for (let i = 0; i < 8; i++) {
      const bloodX = x + (Math.random() - 0.5) * 50
      const bloodY = y + Math.random() * 30
      const size = 2 + Math.random() * 4
      
      // Blood droplets
      ctx.beginPath()
      ctx.arc(bloodX, bloodY, size / 2, 0, Math.PI * 2)
      ctx.fill()
      
      // Splatter effect
      ctx.save()
      ctx.globalAlpha = 0.6
      for (let j = 0; j < 3; j++) {
        const splatterX = bloodX + (Math.random() - 0.5) * 8
        const splatterY = bloodY + (Math.random() - 0.5) * 8
        ctx.fillRect(splatterX, splatterY, 1, 1)
      }
      ctx.restore()
    }
  }

  const drawHeavyBreathing = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const time = Date.now() * 0.005
    
    for (let i = 0; i < 4; i++) {
      const cloudX = x + (Math.random() - 0.5) * 25
      const cloudY = y + i * 8 + Math.sin(time + i) * 4
      const alpha = 0.4 + Math.sin(time * 2 + i) * 0.2
      
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      
      // Breath cloud
      ctx.beginPath()
      ctx.arc(cloudX, cloudY, 4 + Math.sin(time + i) * 2, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.restore()
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
    ctx.font = 'bold 12px monospace'
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
    ctx.font = 'bold 20px serif'
    ctx.textAlign = 'center'
    
    for (let i = 0; i < 5; i++) {
      const starX = effect.x + (i - 2) * 25 + Math.sin(time * 2 + i) * 10
      const starY = effect.y + Math.sin(time * 3 + i) * 15
      const rotation = time + i
      const scale = 0.8 + Math.sin(time * 4 + i) * 0.3
      
      ctx.save()
      ctx.translate(starX, starY)
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
    ctx.font = 'bold 24px monospace'
    ctx.textAlign = 'center'
    ctx.save()
    ctx.translate(effect.x, effect.y - 40)
    ctx.scale(1 + Math.sin(time * 5) * 0.2, 1 + Math.sin(time * 5) * 0.2)
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

  const drawRoundProgressHUD = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const hudY = 30
    
    // Round timer background
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(width/2 - 80, hudY - 15, 160, 30)
    
    // Round number and time
    ctx.fillStyle = '#ffd700'
    ctx.font = 'bold 16px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`ROUND ${fightState.round}`, width/2, hudY - 2)
    
    ctx.fillStyle = '#ffffff'
    ctx.font = '14px monospace'
    const timeLeft = Math.max(0, 180 - fightState.clock) // 3 minute rounds
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    ctx.fillText(`${minutes}:${seconds.toString().padStart(2, '0')}`, width/2, hudY + 12)
  }

  const drawMomentumIndicator = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const indicatorY = height - 60
    const indicatorWidth = 200
    const indicatorX = width/2 - indicatorWidth/2
    
    // Calculate momentum based on HP difference
    const f1HP = fightState.fighter1?.hp || 100
    const f2HP = fightState.fighter2?.hp || 100
    const momentum = (f1HP - f2HP) / 100 // -1 to 1 range
    
    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(indicatorX, indicatorY - 15, indicatorWidth, 30)
    
    // Momentum bar
    const centerX = indicatorX + indicatorWidth/2
    const momentumWidth = Math.abs(momentum) * (indicatorWidth/2)
    
    if (momentum > 0) {
      ctx.fillStyle = '#44ff44'
      ctx.fillRect(centerX, indicatorY - 5, momentumWidth, 10)
    } else {
      ctx.fillStyle = '#ff4444'
      ctx.fillRect(centerX - momentumWidth, indicatorY - 5, momentumWidth, 10)
    }
    
    // Center line
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(centerX, indicatorY - 10)
    ctx.lineTo(centerX, indicatorY + 10)
    ctx.stroke()
    
    // Labels
    ctx.fillStyle = '#ffffff'
    ctx.font = '10px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(fighters[0]?.name || 'Fighter 1', indicatorX, indicatorY + 20)
    ctx.textAlign = 'right'
    ctx.fillText(fighters[1]?.name || 'Fighter 2', indicatorX + indicatorWidth, indicatorY + 20)
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
              className="bg-gradient-to-br from-red-600 to-red-800 text-white p-8 rounded-lg text-center shadow-2xl"
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
      <div className="absolute top-20 right-4 bg-black/70 text-white p-3 rounded text-xs font-mono">
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