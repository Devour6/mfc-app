'use client'

import { useEffect, useRef } from 'react'
import { FightState, Fighter } from '@/types'

interface FightCanvasProps {
  fightState: FightState
  fighters: Fighter[]
}

export default function FightCanvas({ fightState, fighters }: FightCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

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

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const animate = () => {
      drawFrame(ctx, canvas.width, canvas.height)
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [fightState, fighters])

  const drawFrame = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height)
    
    // Draw ring environment
    drawRing(ctx, width, height)
    
    // Draw fighters
    if (fightState.fighter1 && fightState.fighter2) {
      drawFighter(ctx, fightState.fighter1, fighters[0], width, height, '#ff4444')
      drawFighter(ctx, fightState.fighter2, fighters[1], width, height, '#4488ff')
    }
    
    // Draw UI elements
    drawFightHUD(ctx, width, height)
  }

  const drawRing = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Ring background
    ctx.fillStyle = '#0d0d14'
    ctx.fillRect(0, 0, width, height)

    // Ring floor
    const floorY = height * 0.72
    const ringWidth = width * 0.84
    const ringX = width * 0.08

    ctx.fillStyle = '#1a1520'
    ctx.fillRect(ringX, floorY, ringWidth, height * 0.2)

    // Ring outline
    ctx.strokeStyle = '#2a2a3a'
    ctx.lineWidth = 2
    ctx.strokeRect(ringX, floorY, ringWidth, height * 0.2)

    // Ropes
    ctx.strokeStyle = 'rgba(255,68,68,0.3)'
    ctx.lineWidth = 1
    for (let i = 1; i <= 3; i++) {
      const ropeY = floorY - i * (height * 0.08)
      ctx.beginPath()
      ctx.moveTo(ringX, ropeY)
      ctx.lineTo(ringX + ringWidth, ropeY)
      ctx.stroke()
    }

    // Corner posts
    ctx.fillStyle = '#ff4444'
    ctx.fillRect(ringX - 6, floorY - height * 0.26, 6, height * 0.26)
    ctx.fillRect(ringX + ringWidth, floorY - height * 0.26, 6, height * 0.26)

    // MFC logo in center
    ctx.save()
    ctx.font = '600 48px Inter'
    ctx.fillStyle = 'rgba(255,68,68,0.04)'
    ctx.textAlign = 'center'
    ctx.fillText('MFC', width / 2, floorY + height * 0.12)
    ctx.restore()
  }

  const drawFighter = (
    ctx: CanvasRenderingContext2D,
    fighterState: typeof fightState.fighter1,
    fighterData: Fighter,
    width: number,
    height: number,
    color: string
  ) => {
    const scale = 4 // Pixel scale for retro look
    const floorY = height * 0.72
    
    // Convert position to canvas coordinates
    const x = (fighterState.position.x / 480) * width
    const y = floorY - 20

    ctx.save()
    
    // Hit flash effect
    if (fighterState.animation.state === 'hit' && fighterState.animation.frameCount % 4 < 2) {
      ctx.globalAlpha = 0.7
      ctx.filter = 'brightness(1.5) hue-rotate(15deg)'
    }

    // Fighter body position
    const bodyX = x - 6 * scale
    const bodyY = y - 16 * scale

    // Draw based on animation state
    switch (fighterState.animation.state) {
      case 'punching':
        drawPunchingFighter(ctx, bodyX, bodyY, scale, color, fighterState.position.facing)
        break
      case 'blocking':
        drawBlockingFighter(ctx, bodyX, bodyY, scale, color, fighterState.position.facing)
        break
      case 'dodging':
        drawDodgingFighter(ctx, bodyX, bodyY, scale, color, fighterState.position.facing)
        break
      case 'walking':
        drawWalkingFighter(ctx, bodyX, bodyY, scale, color, fighterState.position.facing, fighterState.animation.frameCount)
        break
      default:
        drawIdleFighter(ctx, bodyX, bodyY, scale, color, fighterState.position.facing)
        break
    }

    // Draw damage effects
    if (fighterState.hp < 30) {
      drawBloodEffects(ctx, x, y - 10 * scale)
    }

    // Draw status effects
    if (fighterState.modifiers.stunned > 0) {
      drawStarsEffect(ctx, x, y - 20 * scale)
    }

    ctx.restore()

    // Draw fighter name and HP bar above
    drawFighterNameAndHP(ctx, fighterData, fighterState, x, y - 25 * scale, color)
  }

  const drawIdleFighter = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string, facing: number) => {
    // Head
    ctx.fillStyle = color
    ctx.fillRect(x + 2*scale, y, 4*scale, 4*scale)

    // Eyes
    ctx.fillStyle = '#ffffff'
    if (facing === 1) {
      ctx.fillRect(x + 4*scale, y + scale, scale, scale)
      ctx.fillRect(x + 2*scale, y + scale, scale, scale)
    } else {
      ctx.fillRect(x + 3*scale, y + scale, scale, scale)
      ctx.fillRect(x + 5*scale, y + scale, scale, scale)
    }

    // Body
    ctx.fillStyle = color
    ctx.fillRect(x + scale, y + 4*scale, 6*scale, 6*scale)

    // Arms (guard position)
    if (facing === 1) {
      ctx.fillRect(x + 7*scale, y + 3*scale, 2*scale, 3*scale)
      ctx.fillRect(x - scale, y + 4*scale, 2*scale, 3*scale)
    } else {
      ctx.fillRect(x - scale, y + 3*scale, 2*scale, 3*scale)
      ctx.fillRect(x + 7*scale, y + 4*scale, 2*scale, 3*scale)
    }

    // Gloves
    ctx.fillStyle = '#ffffff'
    if (facing === 1) {
      ctx.fillRect(x + 7*scale, y + 2*scale, 2*scale, 2*scale)
      ctx.fillRect(x - scale, y + 3*scale, 2*scale, 2*scale)
    } else {
      ctx.fillRect(x - scale, y + 2*scale, 2*scale, 2*scale)
      ctx.fillRect(x + 7*scale, y + 3*scale, 2*scale, 2*scale)
    }

    // Legs
    ctx.fillStyle = color
    ctx.fillRect(x + scale, y + 10*scale, 2*scale, 5*scale)
    ctx.fillRect(x + 5*scale, y + 10*scale, 2*scale, 5*scale)
  }

  const drawPunchingFighter = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string, facing: number) => {
    // Draw basic fighter first
    drawIdleFighter(ctx, x, y, scale, color, facing)

    // Override arm for punch
    ctx.fillStyle = color
    if (facing === 1) {
      ctx.fillRect(x + 7*scale, y + 4*scale, 8*scale, 2*scale) // Extended punching arm
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x + 14*scale, y + 3*scale, 3*scale, 3*scale) // Extended glove
    } else {
      ctx.fillRect(x - 7*scale, y + 4*scale, 8*scale, 2*scale)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(x - 9*scale, y + 3*scale, 3*scale, 3*scale)
    }
  }

  const drawBlockingFighter = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string, facing: number) => {
    drawIdleFighter(ctx, x, y, scale, color, facing)

    // Add defensive posture indicators
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1
    ctx.strokeRect(x + 2*scale, y + 2*scale, 4*scale, 8*scale)
  }

  const drawDodgingFighter = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string, facing: number) => {
    // Lean the fighter slightly
    ctx.save()
    ctx.translate(x + 4*scale, y + 8*scale)
    ctx.rotate((facing === 1 ? -0.2 : 0.2))
    ctx.translate(-(x + 4*scale), -(y + 8*scale))
    
    drawIdleFighter(ctx, x, y, scale, color, facing)
    
    ctx.restore()

    // Motion lines
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 1
    for (let i = 0; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo(x - 10, y + i * 4)
      ctx.lineTo(x - 5, y + i * 4)
      ctx.stroke()
    }
  }

  const drawWalkingFighter = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string, facing: number, frameCount: number) => {
    drawIdleFighter(ctx, x, y, scale, color, facing)

    // Animate legs for walking
    const legOffset = Math.sin(frameCount * 0.3) * scale
    ctx.fillStyle = color
    
    // Animate one leg forward, one back
    ctx.fillRect(x + scale, y + 10*scale + legOffset, 2*scale, 5*scale - Math.abs(legOffset))
    ctx.fillRect(x + 5*scale, y + 10*scale - legOffset, 2*scale, 5*scale - Math.abs(legOffset))
  }

  const drawBloodEffects = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = '#ff0000'
    for (let i = 0; i < 3; i++) {
      const bloodX = x + (Math.random() - 0.5) * 20
      const bloodY = y + Math.random() * 10
      ctx.fillRect(bloodX, bloodY, 2, 2)
    }
  }

  const drawStarsEffect = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = '#ffff00'
    ctx.font = '16px "Press Start 2P"'
    ctx.textAlign = 'center'
    
    for (let i = 0; i < 3; i++) {
      const starX = x + (i - 1) * 15
      const starY = y + Math.sin(Date.now() * 0.01 + i) * 5
      ctx.fillText('★', starX, starY)
    }
  }

  const drawFighterNameAndHP = (
    ctx: CanvasRenderingContext2D,
    fighter: Fighter,
    fighterState: typeof fightState.fighter1,
    x: number,
    y: number,
    color: string
  ) => {
    // Name
    ctx.fillStyle = color
    ctx.font = '12px "Press Start 2P"'
    ctx.textAlign = 'center'
    ctx.fillText(fighter.name, x, y - 15)

    // HP Bar
    const barWidth = 80
    const barHeight = 6
    const barX = x - barWidth / 2

    // Background
    ctx.fillStyle = '#1a1a26'
    ctx.fillRect(barX, y - 10, barWidth, barHeight)

    // HP Fill
    const hpWidth = (fighterState.hp / 100) * barWidth
    ctx.fillStyle = color
    ctx.fillRect(barX, y - 10, hpWidth, barHeight)

    // Border
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.strokeRect(barX, y - 10, barWidth, barHeight)
  }

  const drawFightHUD = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!fightState.fighter1 || !fightState.fighter2) return

    // Draw fight stats at the bottom
    const statsY = height - 40
    ctx.fillStyle = 'rgba(18, 18, 26, 0.9)'
    ctx.fillRect(0, statsY, width, 40)

    ctx.fillStyle = '#e8e8f0'
    ctx.font = '14px "Inter"'
    ctx.textAlign = 'center'

    const f1Stats = `${fighters[0].name}: ${fightState.fighter1.stats.strikes}/${fightState.fighter1.stats.landed} strikes`
    const f2Stats = `${fighters[1].name}: ${fightState.fighter2.stats.strikes}/${fightState.fighter2.stats.landed} strikes`

    ctx.fillText(f1Stats, width * 0.25, statsY + 25)
    ctx.fillText(f2Stats, width * 0.75, statsY + 25)
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}