import { VisualEffect } from './types'
import { P, px } from './utils'

// ── Visual effects dispatcher ───────────────────────────────────────────────
export const drawVisualEffects = (ctx: CanvasRenderingContext2D, visualEffects: VisualEffect[]) => {
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

// ── Hit spark at contact point ──────────────────────────────────────────────
export const drawHitSpark = (
  ctx: CanvasRenderingContext2D,
  sparkX: number,
  sparkY: number
) => {
  const sparkTime = Date.now() * 0.01
  const sparkSize = 16 + Math.sin(sparkTime * 3) * 6

  ctx.save()
  // Main cross — bigger and bolder
  ctx.fillStyle = '#fff'
  ctx.fillRect(sparkX - sparkSize, sparkY - 3, sparkSize * 2, 6)
  ctx.fillRect(sparkX - 3, sparkY - sparkSize, 6, sparkSize * 2)

  // Diagonal bursts
  const diagLen = sparkSize * 0.75
  ctx.fillStyle = '#ffdd00'
  for (let d = 0; d < 4; d++) {
    const angle = (d * Math.PI / 2) + Math.PI / 4
    const dx = Math.cos(angle) * diagLen
    const dy = Math.sin(angle) * diagLen
    ctx.fillRect(sparkX + dx - 2, sparkY + dy - 2, 5, 5)
    ctx.fillRect(sparkX + dx * 0.5 - 1, sparkY + dy * 0.5 - 1, 3, 3)
  }

  // Orange impact particles
  ctx.fillStyle = '#ff6600'
  for (let i = 0; i < 6; i++) {
    const pAngle = (i / 6) * Math.PI * 2 + sparkTime * 0.5
    const pDist = sparkSize * (0.4 + Math.sin(sparkTime + i) * 0.3)
    ctx.fillRect(
      sparkX + Math.cos(pAngle) * pDist - 2,
      sparkY + Math.sin(pAngle) * pDist - 2,
      4, 4
    )
  }
  ctx.restore()
}

// ── Motion trails ───────────────────────────────────────────────────────────
export const drawMotionTrail = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facing: number,
  actionType: string
) => {
  const trailCount = 7
  ctx.save()

  if (actionType === 'punching') {
    for (let i = 0; i < trailCount; i++) {
      const alpha = (trailCount - i) / trailCount * 0.5
      ctx.globalAlpha = alpha
      const tx = x + facing * (P * 2 + i * P * 3)
      const ty = y - P * 7
      ctx.fillStyle = '#ffdd00'
      ctx.fillRect(tx, ty - P, P * 2, P * 3)
      ctx.fillStyle = '#fff'
      ctx.fillRect(tx + facing * P, ty, P, P)
    }
  } else if (actionType === 'kicking') {
    for (let i = 0; i < trailCount; i++) {
      const alpha = (trailCount - i) / trailCount * 0.5
      ctx.globalAlpha = alpha
      const angle = (i / trailCount) * Math.PI * 0.4
      const tx = x + facing * (P * 2 + Math.cos(angle) * i * P * 2)
      const ty = y - P * 2 + Math.sin(angle) * i * P
      ctx.fillStyle = '#ff6600'
      ctx.fillRect(tx, ty - P, P * 2, P * 3)
      ctx.fillStyle = '#ff8800'
      ctx.fillRect(tx + facing * P, ty, P, P)
    }
  }
  ctx.restore()
}

// ── Sweat particles ─────────────────────────────────────────────────────────
export const drawSweatParticles = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  const time = Date.now() * 0.001
  for (let i = 0; i < 5; i++) {
    const sx = x + Math.floor((Math.sin(time * 2 + i * 1.3) * 15) / P) * P
    const sy = y + Math.floor((Math.sin(time * 3 + i) * 10 + i * 6) / P) * P
    px(ctx, sx, sy, 'rgba(150,200,255,0.6)')
  }
}

// ── Individual effect renderers ─────────────────────────────────────────────

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
