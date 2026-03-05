import { FIGHTER_MAX_HP } from '@/lib/fight-engine'

// ── Ring / stage drawing ────────────────────────────────────────────────────
export const drawEnhancedRing = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
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

// ── Crowd atmosphere ────────────────────────────────────────────────────────
export const drawCrowdAtmosphere = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  fighter1Hp: number,
  fighter2Hp: number
) => {
  const time = Date.now() * 0.001
  const fightIntensity = 1 - (Math.min(fighter1Hp, fighter2Hp) / FIGHTER_MAX_HP)
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
