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
  type: 'impact' | 'blood' | 'stars' | 'sweat' | 'sparks'
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

  // Detect significant moments and add events
  useEffect(() => {
    if (!fightState.fighter1 || !fightState.fighter2) return

    // Detect knockdowns
    if (fightState.fighter1.animation.state === 'down' || fightState.fighter2.animation.state === 'down') {
      const knockedFighter = fightState.fighter1.animation.state === 'down' ? 2 : 1
      const knockerFighter = knockedFighter === 1 ? 2 : 1
      
      addRoundEvent({
        type: 'knockdown',
        severity: 'high',
        description: `${fighters[knockerFighter - 1].name} SCORES A KNOCKDOWN!`,
        fighter: knockerFighter
      })

      addVisualEffect({
        type: 'impact',
        x: knockedFighter === 1 ? fightState.fighter1.position.x : fightState.fighter2.position.x,
        y: 200,
        duration: 2000,
        intensity: 1.0
      })

      onSignificantMoment?.('knockdown', 'high')
    }

    // Detect significant damage drops
    const f1HealthLow = fightState.fighter1.hp < 25 && fightState.fighter1.hp > 0
    const f2HealthLow = fightState.fighter2.hp < 25 && fightState.fighter2.hp > 0
    
    if (f1HealthLow || f2HealthLow) {
      const hurtFighter = f1HealthLow ? 1 : 2
      const otherFighter = hurtFighter === 1 ? 2 : 1
      
      addRoundEvent({
        type: 'rally',
        severity: 'medium',
        description: `${fighters[hurtFighter - 1].name} is hurt! Can they survive?`,
        fighter: otherFighter
      })

      onSignificantMoment?.('fighter-hurt', 'medium')
    }

    // Detect combos (simplified)
    if (fightState.fighter1.combo.count > 3 || fightState.fighter2.combo.count > 3) {
      const comboFighter = fightState.fighter1.combo.count > 3 ? 1 : 2
      
      addRoundEvent({
        type: 'combo',
        severity: 'medium',
        description: `${fighters[comboFighter - 1].name} lands a devastating combo!`,
        fighter: comboFighter
      })

      addVisualEffect({
        type: 'sparks',
        x: comboFighter === 1 ? fightState.fighter1.position.x : fightState.fighter2.position.x,
        y: 150,
        duration: 1000,
        intensity: 0.8
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
    const scale = 5
    const floorY = height * 0.75
    
    // Convert position to canvas coordinates
    const x = (fighterState.position.x / 480) * width
    const y = floorY - 30

    ctx.save()
    
    // Enhanced hit flash with screen shake effect
    if (fighterState.animation.state === 'hit') {
      const shakeIntensity = 3
      ctx.translate(
        (Math.random() - 0.5) * shakeIntensity,
        (Math.random() - 0.5) * shakeIntensity
      )
      ctx.globalAlpha = 0.8
      ctx.filter = 'brightness(1.8) hue-rotate(45deg)'
    }

    // Stamina-based transparency
    ctx.globalAlpha *= Math.max(0.6, fighterState.stamina / 100)

    // Fighter shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)'
    ctx.save()
    ctx.scale(1, 0.3)
    ctx.beginPath()
    ctx.arc(x, (floorY + 5) / 0.3, 15, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // Enhanced fighter body
    const bodyX = x - 8 * scale
    const bodyY = y - 20 * scale

    // Draw enhanced animation states
    switch (fighterState.animation.state) {
      case 'punching':
        drawEnhancedPunchingFighter(ctx, bodyX, bodyY, scale, color, fighterState.position.facing)
        break
      case 'down':
        drawKnockedDownFighter(ctx, bodyX, bodyY + 40, scale, color)
        break
      default:
        drawEnhancedIdleFighter(ctx, bodyX, bodyY, scale, color, fighterState.position.facing)
        break
    }

    // Enhanced status effects
    if (fighterState.modifiers.stunned > 0) {
      drawEnhancedStarsEffect(ctx, x, y - 30 * scale)
    }

    if (fighterState.hp < 25) {
      drawBloodSplatters(ctx, x, y - 10 * scale)
      drawHeavyBreathing(ctx, x, y - 40 * scale)
    }

    ctx.restore()

    // Enhanced fighter info overlay
    drawEnhancedFighterInfo(ctx, fighterData, fighterState, x, y - 35 * scale, color, fighterNumber)
  }

  const drawEnhancedIdleFighter = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string, facing: number) => {
    // Enhanced head with better detail
    ctx.fillStyle = color
    ctx.fillRect(x + 2*scale, y, 5*scale, 5*scale)
    
    // Face details
    ctx.fillStyle = '#ffffff'
    if (facing === 1) {
      ctx.fillRect(x + 4*scale, y + scale, scale, scale) // Right eye
      ctx.fillRect(x + 6*scale, y + scale, scale, scale) // Left eye
    } else {
      ctx.fillRect(x + 2*scale, y + scale, scale, scale) // Left eye
      ctx.fillRect(x + 4*scale, y + scale, scale, scale) // Right eye
    }

    // Enhanced body with muscle definition
    ctx.fillStyle = color
    ctx.fillRect(x + scale, y + 5*scale, 7*scale, 8*scale)
    
    // Chest definition
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    ctx.fillRect(x + 2*scale, y + 6*scale, 5*scale, 3*scale)

    // Arms in guard position
    ctx.fillStyle = color
    if (facing === 1) {
      ctx.fillRect(x + 8*scale, y + 4*scale, 3*scale, 5*scale)
      ctx.fillRect(x - 2*scale, y + 5*scale, 3*scale, 5*scale)
    } else {
      ctx.fillRect(x - 2*scale, y + 4*scale, 3*scale, 5*scale)
      ctx.fillRect(x + 8*scale, y + 5*scale, 3*scale, 5*scale)
    }

    // Enhanced gloves with brand logo
    ctx.fillStyle = '#ffffff'
    if (facing === 1) {
      ctx.fillRect(x + 8*scale, y + 3*scale, 3*scale, 3*scale)
      ctx.fillRect(x - 2*scale, y + 4*scale, 3*scale, 3*scale)
    } else {
      ctx.fillRect(x - 2*scale, y + 3*scale, 3*scale, 3*scale)
      ctx.fillRect(x + 8*scale, y + 4*scale, 3*scale, 3*scale)
    }

    // Legs with better proportions
    ctx.fillStyle = color
    ctx.fillRect(x + 2*scale, y + 13*scale, 3*scale, 6*scale)
    ctx.fillRect(x + 6*scale, y + 13*scale, 3*scale, 6*scale)
  }

  const drawEnhancedPunchingFighter = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string, facing: number) => {
    drawEnhancedIdleFighter(ctx, x, y, scale, color, facing)

    // Enhanced punch with motion blur
    ctx.save()
    ctx.filter = 'blur(1px)'
    ctx.fillStyle = color
    
    if (facing === 1) {
      // Extended punching arm with motion lines
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = 0.3 + (i * 0.3)
        ctx.fillRect(x + 8*scale - i*2, y + 5*scale + i, 12*scale, 3*scale)
      }
      
      // Power glove
      ctx.globalAlpha = 1
      ctx.fillStyle = '#ffff00'
      ctx.fillRect(x + 18*scale, y + 4*scale, 4*scale, 4*scale)
    } else {
      for (let i = 0; i < 3; i++) {
        ctx.globalAlpha = 0.3 + (i * 0.3)
        ctx.fillRect(x - 12*scale + i*2, y + 5*scale + i, 12*scale, 3*scale)
      }
      
      ctx.globalAlpha = 1
      ctx.fillStyle = '#ffff00'
      ctx.fillRect(x - 14*scale, y + 4*scale, 4*scale, 4*scale)
    }
    
    ctx.restore()
  }

  const drawKnockedDownFighter = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string) => {
    // Fighter on ground
    ctx.fillStyle = color
    ctx.fillRect(x, y - 2*scale, 8*scale, 3*scale) // Body horizontal
    ctx.fillRect(x + 2*scale, y - 5*scale, 4*scale, 3*scale) // Head
    ctx.fillRect(x + 8*scale, y - scale, 4*scale, 2*scale) // Legs
    
    // Dazed eyes
    ctx.fillStyle = '#ffff00'
    ctx.fillRect(x + 3*scale, y - 4*scale, scale, scale)
    ctx.fillRect(x + 5*scale, y - 4*scale, scale, scale)
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
    for (let i = 0; i < 6; i++) {
      const bloodX = x + (Math.random() - 0.5) * 40
      const bloodY = y + Math.random() * 20
      const size = 2 + Math.random() * 3
      ctx.fillRect(bloodX, bloodY, size, size)
    }
  }

  const drawHeavyBreathing = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const time = Date.now() * 0.01
    ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(time) * 0.2})`
    ctx.font = '14px serif'
    ctx.textAlign = 'center'
    
    for (let i = 0; i < 3; i++) {
      const cloudX = x + (Math.random() - 0.5) * 20
      const cloudY = y + i * 10 + Math.sin(time + i) * 5
      ctx.fillText('💨', cloudX, cloudY)
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
      }
      
      ctx.restore()
    })
  }

  const drawImpactEffect = (ctx: CanvasRenderingContext2D, effect: VisualEffect) => {
    const radius = 30 * effect.intensity
    const gradient = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, radius)
    gradient.addColorStop(0, `rgba(255,255,255,${effect.intensity})`)
    gradient.addColorStop(0.5, `rgba(255,68,68,${effect.intensity * 0.7})`)
    gradient.addColorStop(1, 'rgba(255,68,68,0)')
    
    ctx.fillStyle = gradient
    ctx.fillRect(effect.x - radius, effect.y - radius, radius * 2, radius * 2)
    
    // Impact lines
    ctx.strokeStyle = `rgba(255,255,255,${effect.intensity})`
    ctx.lineWidth = 2
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const startRadius = radius * 0.3
      const endRadius = radius * 0.8
      
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
  }

  const drawSparksEffect = (ctx: CanvasRenderingContext2D, effect: VisualEffect) => {
    ctx.fillStyle = `rgba(255,255,0,${effect.intensity})`
    
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2
      const distance = Math.random() * 40
      const sparkX = effect.x + Math.cos(angle) * distance
      const sparkY = effect.y + Math.sin(angle) * distance
      
      ctx.fillRect(sparkX, sparkY, 2, 2)
    }
  }

  const drawBloodEffect = (ctx: CanvasRenderingContext2D, effect: VisualEffect) => {
    ctx.fillStyle = `rgba(200,0,0,${effect.intensity})`
    
    for (let i = 0; i < 8; i++) {
      const dropX = effect.x + (Math.random() - 0.5) * 30
      const dropY = effect.y + Math.random() * 20
      const size = 1 + Math.random() * 2
      
      ctx.fillRect(dropX, dropY, size, size)
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