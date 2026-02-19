'use client'

import { useEffect, useRef, useState } from 'react'

/* ── Canvas constants ──────────────────────────────────── */
const W = 480
const H = 280
const P = 3
const TICK_MS = 160
const PRICE_MS = 1500
const RESTART_MS = 2500
const TICKS_PER_SEC = 6

// Ring geometry
const FLOOR_Y = H * 0.72
const RING_X = W * 0.08
const RING_W = W * 0.84

/* ── Types ─────────────────────────────────────────────── */
interface Sim {
  x: number
  facing: 1 | -1
  hp: number
  stamina: number
  anim: 'idle' | 'punching' | 'kicking' | 'blocking' | 'walking' | 'hit' | 'dodging'
  frame: number
  dur: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

interface Fight {
  round: number
  clock: number
  phase: 'fighting' | 'ko' | 'ended'
  f1: Sim
  f2: Sim
  tick: number
  intensity: number
  particles: Particle[]
  shakeX: number
  shakeY: number
  shakeDur: number
  flashAlpha: number
  koTimer: number
  winner: 1 | 2 | 0
  commentary: string
  commentaryTimer: number
}

/* ── Commentary lines ──────────────────────────────────── */
const COMMENTARY = [
  'Exchanging heavy blows!',
  'What a sequence!',
  'The crowd is loving this!',
  'Relentless pressure!',
  'Looking for the opening...',
  'Trading leather in the center!',
  'Power shot connects!',
  'Beautiful counter!',
  'The pace is picking up!',
]

/* ── Factory ───────────────────────────────────────────── */
function newFight(): Fight {
  return {
    round: 1,
    clock: 180,
    phase: 'fighting',
    tick: 0,
    intensity: 0,
    particles: [],
    shakeX: 0,
    shakeY: 0,
    shakeDur: 0,
    flashAlpha: 0,
    koTimer: 0,
    winner: 0,
    commentary: '',
    commentaryTimer: 0,
    f1: { x: W * 0.3, facing: 1, hp: 100, stamina: 100, anim: 'idle', frame: 0, dur: 0 },
    f2: { x: W * 0.7, facing: -1, hp: 100, stamina: 100, anim: 'idle', frame: 0, dur: 0 },
  }
}

/* ── Pixel helpers ─────────────────────────────────────── */
function px(c: CanvasRenderingContext2D, x: number, y: number, color: string) {
  c.fillStyle = color
  c.fillRect(x, y, P, P)
}

function pxo(c: CanvasRenderingContext2D, x: number, y: number, color: string) {
  c.fillStyle = '#111'
  c.fillRect(x - 1, y - 1, P + 2, P + 2)
  c.fillStyle = color
  c.fillRect(x, y, P, P)
}

function drawSprite(c: CanvasRenderingContext2D, ox: number, oy: number, grid: string[][]) {
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const color = grid[row][col]
      if (color) px(c, ox + col * P, oy + row * P, color)
    }
  }
}

function shade(hex: string): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 40)
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 40)
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 40)
  return `rgb(${r},${g},${b})`
}

function highlight(hex: string): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + 50)
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + 50)
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + 50)
  return `rgb(${r},${g},${b})`
}

/* ── Body part drawing ─────────────────────────────────── */
function drawHead(c: CanvasRenderingContext2D, x: number, y: number, color: string, facing: number, anim: string, hp: number) {
  const s = shade(color)
  const h = highlight(color)
  const ox = x - P * 3
  const oy = y - P * 4

  const O = '#111'
  const C = color
  const head: string[][] = [
    ['',  O,  O,  O,  O, ''],
    [ O,  h,  C,  C,  s,  O],
    [ O,  C,  C,  C,  C,  O],
    [ O,  C,  C,  C,  C,  O],
    [ O,  C,  C,  C,  C,  O],
    ['',  O,  C,  C,  O, ''],
    ['', '',  O,  O, '', ''],
  ]
  drawSprite(c, ox, oy, head)

  if (anim === 'hit') {
    // X eyes
    px(c, ox + P * 1, oy + P * 2, '#ff0')
    px(c, ox + P * 4, oy + P * 2, '#ff0')
    px(c, ox + P * 2, oy + P * 4, '#c00')
    px(c, ox + P * 3, oy + P * 4, '#c00')
  } else if (hp < 25) {
    px(c, ox + P * 1, oy + P * 2, '#800')
    px(c, ox + P * 4, oy + P * 2, '#800')
    px(c, ox + P * 2, oy + P * 4, '#c00')
  } else {
    px(c, ox + P * 1, oy + P * 2, '#fff')
    px(c, ox + P * 4, oy + P * 2, '#fff')
    const pupilOff = facing > 0 ? 1 : 0
    px(c, ox + P * (1 + pupilOff), oy + P * 2, '#000')
    px(c, ox + P * (4 + pupilOff), oy + P * 2, '#000')
    px(c, ox + P * 2, oy + P * 4, '#000')
    px(c, ox + P * 3, oy + P * 4, '#000')
  }
}

function drawTorso(c: CanvasRenderingContext2D, x: number, y: number, color: string, anim: string) {
  const s = shade(color)
  const h = highlight(color)
  const O = '#111'
  const C = color
  const T = anim === 'hit' ? '#cc0000' : '#222'

  const ox = x - P * 4
  const oy = y

  const torso: string[][] = [
    ['',  O,  O,  C,  C,  O,  O, ''],
    [ O,  h,  C,  C,  C,  C,  s,  O],
    [ O,  C,  h,  C,  C,  s,  C,  O],
    [ O,  C,  C,  C,  C,  C,  C,  O],
    [ O,  C,  C,  s,  s,  C,  C,  O],
    [ O,  C,  C,  C,  C,  C,  C,  O],
    ['',  O,  T,  T,  T,  T,  O, ''],
    ['',  O,  T,  T,  T,  T,  O, ''],
    ['', '',  O,  T,  T,  O, '', ''],
    ['', '',  O,  O,  O,  O, '', ''],
  ]
  drawSprite(c, ox, oy, torso)
}

function drawArm(c: CanvasRenderingContext2D, x: number, y: number, color: string, facing: number, isFront: boolean, extension: number, isPunching: boolean) {
  const s = shade(color)
  const G = isPunching && isFront ? '#ffdd00' : '#eee'
  const GS = isPunching && isFront ? '#cc9900' : '#bbb'

  c.save()
  c.translate(x, y)
  if (isFront && isPunching) {
    const angle = extension > 15 ? 55 : 45
    c.rotate(facing * angle * Math.PI / 180)
  }

  const armLen = Math.floor((20 + extension) / P)
  const ox = -P

  for (let i = 0; i < Math.floor(armLen * 0.5); i++) {
    pxo(c, ox, i * P, color)
    pxo(c, ox + P, i * P, s)
  }

  const forearmStart = Math.floor(armLen * 0.5) * P
  for (let i = 0; i < Math.floor(armLen * 0.4); i++) {
    pxo(c, ox, forearmStart + i * P, color)
    pxo(c, ox + P, forearmStart + i * P, s)
  }

  const gloveY = (armLen - 2) * P
  for (let gy = 0; gy < 3; gy++) {
    for (let gx = 0; gx < 3; gx++) {
      const gc = (gy === 0 || gx === 0) ? G : GS
      pxo(c, ox - P + gx * P, gloveY + gy * P, gc)
    }
  }

  // Glove glow on punch
  if (isPunching && isFront) {
    c.fillStyle = 'rgba(255,221,0,0.35)'
    c.fillRect(ox - P * 2, gloveY - P, P * 5, P * 5)
  }

  c.restore()
}

function drawLeg(c: CanvasRenderingContext2D, x: number, y: number, color: string, isFront: boolean, walkOffset: number, isKicking: boolean) {
  const s = shade(color)

  c.save()
  c.translate(x, y + walkOffset)

  // Kick: front leg extends forward
  if (isKicking && isFront) {
    c.rotate(70 * Math.PI / 180)
  }

  const legLen = Math.floor(28 / P)
  const ox = -P

  for (let i = 0; i < Math.floor(legLen * 0.5); i++) {
    pxo(c, ox, i * P, color)
    pxo(c, ox + P, i * P, s)
    if (i < 2) pxo(c, ox + P * 2, i * P, s)
  }

  const shinStart = Math.floor(legLen * 0.5) * P
  for (let i = 0; i < Math.floor(legLen * 0.4); i++) {
    pxo(c, ox, shinStart + i * P, color)
    pxo(c, ox + P, shinStart + i * P, s)
  }

  const bootY = (legLen - 2) * P
  const bootColor = isKicking && isFront ? '#ff6600' : '#222'
  pxo(c, ox - P, bootY, '#111')
  pxo(c, ox, bootY, bootColor)
  pxo(c, ox + P, bootY, bootColor)
  pxo(c, ox + P * 2, bootY, '#111')
  pxo(c, ox - P, bootY + P, '#111')
  pxo(c, ox, bootY + P, '#111')
  pxo(c, ox + P, bootY + P, '#111')
  pxo(c, ox + P * 2, bootY + P, '#111')

  // Boot glow on kick
  if (isKicking && isFront) {
    c.fillStyle = 'rgba(255,102,0,0.3)'
    c.fillRect(ox - P * 2, bootY - P, P * 6, P * 4)
  }

  c.restore()
}

/* ── Composite humanoid ────────────────────────────────── */
function drawHumanoid(c: CanvasRenderingContext2D, sim: Sim, color: string, t: number) {
  const x = sim.x
  const baseY = FLOOR_Y - 15

  // Idle bob
  const bob = sim.anim === 'idle' ? Math.sin(t * 3) * 1.5 : 0

  const headY = baseY - 50 + bob
  let torsoY = baseY - 35 + bob
  const armY = baseY - 30 + bob
  const legY = baseY - 10
  let bodyLean = 0
  let armExtension = 0
  const isPunching = sim.anim === 'punching'
  const isKicking = sim.anim === 'kicking'
  const isBlocking = sim.anim === 'blocking'

  switch (sim.anim) {
    case 'punching':
      armExtension = 18
      bodyLean = sim.facing * 6
      break
    case 'kicking':
      bodyLean = sim.facing * 8
      break
    case 'hit':
      bodyLean = -sim.facing * 12
      torsoY += 3
      break
    case 'walking':
      bodyLean = sim.facing * 2
      break
    case 'blocking':
      bodyLean = -sim.facing * 3
      break
    case 'dodging':
      bodyLean = -sim.facing * 15
      break
  }

  c.save()

  // Hit flash
  if (sim.anim === 'hit' && sim.frame % 4 < 2) {
    c.globalAlpha = 0.6
  }

  // Dodge transparency
  if (sim.anim === 'dodging') {
    c.globalAlpha = 0.5
  }

  // Low stamina transparency
  if (sim.stamina < 20) {
    c.globalAlpha = Math.max(0.5, c.globalAlpha - 0.2)
  }

  // Body lean
  c.translate(x, baseY)
  c.rotate(bodyLean * Math.PI / 180)
  c.translate(-x, -baseY)

  const walkOff = sim.anim === 'walking' ? Math.sin(sim.frame * 0.5) * 3 : 0

  // Back leg
  const backLegX = sim.facing === 1 ? x - 6 : x + 6
  drawLeg(c, backLegX, legY, color, false, -walkOff, false)

  // Back arm
  const backArmX = sim.facing === 1 ? x - 12 : x + 12
  const backExt = isBlocking ? 8 : 0
  drawArm(c, backArmX, armY, color, sim.facing, false, backExt, false)

  // Torso
  drawTorso(c, x, torsoY, color, sim.anim)

  // Head
  drawHead(c, x, headY, color, sim.facing, sim.anim, sim.hp)

  // Block shield effect
  if (isBlocking) {
    c.save()
    c.fillStyle = 'rgba(68,136,255,0.15)'
    c.beginPath()
    c.arc(x + sim.facing * 15, baseY - 30, 22, 0, Math.PI * 2)
    c.fill()
    c.strokeStyle = 'rgba(68,136,255,0.4)'
    c.lineWidth = 1.5
    c.stroke()
    c.restore()
  }

  // Front arm
  const frontArmX = sim.facing === 1 ? x + 12 : x - 12
  const frontExt = isBlocking ? 12 : armExtension
  drawArm(c, frontArmX, armY, color, sim.facing, true, frontExt, isPunching)

  // Front leg
  const frontLegX = sim.facing === 1 ? x + 6 : x - 6
  drawLeg(c, frontLegX, legY, color, true, walkOff, isKicking)

  // Sweat particles when HP < 50
  if (sim.hp < 50) {
    const sweatAlpha = (50 - sim.hp) / 100
    c.fillStyle = `rgba(100,180,255,${sweatAlpha})`
    for (let i = 0; i < 3; i++) {
      const sx = x - 8 + Math.sin(t * 5 + i * 2) * 6
      const sy = headY - 10 - i * 4 + Math.sin(t * 3 + i) * 2
      c.fillRect(sx, sy, 2, 2)
    }
  }

  c.restore()
}

/* ── Particles ─────────────────────────────────────────── */
function spawnImpact(fight: Fight, x: number, y: number, color: string, count: number) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 1.5 + Math.random() * 3
    fight.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 12 + Math.random() * 8,
      maxLife: 20,
      color,
      size: 1 + Math.random() * 2,
    })
  }
}

function updateParticles(fight: Fight) {
  for (let i = fight.particles.length - 1; i >= 0; i--) {
    const p = fight.particles[i]
    p.x += p.vx
    p.y += p.vy
    p.vy += 0.15 // gravity
    p.life--
    if (p.life <= 0) fight.particles.splice(i, 1)
  }
}

function drawParticles(c: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    const alpha = p.life / p.maxLife
    c.globalAlpha = alpha
    c.fillStyle = p.color
    c.fillRect(p.x, p.y, p.size, p.size)
    // Trail
    c.globalAlpha = alpha * 0.3
    c.fillRect(p.x - p.vx, p.y - p.vy, p.size * 0.7, p.size * 0.7)
  }
  c.globalAlpha = 1
}

/* ── Ring drawing ──────────────────────────────────────── */
function drawRing(c: CanvasRenderingContext2D, intensity: number, t: number) {
  // Background gradient
  const bg = c.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#050510')
  bg.addColorStop(0.5, '#080818')
  bg.addColorStop(1, '#0a0a1a')
  c.fillStyle = bg
  c.fillRect(0, 0, W, H)

  // Crowd silhouettes
  c.fillStyle = `rgba(15,15,25,${0.8 + intensity * 0.1})`
  for (let i = 0; i < 24; i++) {
    const cx = i * 22 - 10
    const cy = 20 + Math.sin(i * 0.8) * 8
    const sway = Math.sin(t * 2 + i * 0.7) * (1 + intensity * 2)
    c.beginPath()
    c.arc(cx + sway, cy, 8 + Math.sin(i * 1.3) * 3, 0, Math.PI * 2)
    c.fill()
  }

  // Camera flashes in crowd
  if (intensity > 0.3 && Math.random() < intensity * 0.15) {
    const fx = Math.random() * W
    const fy = 10 + Math.random() * 30
    c.save()
    c.fillStyle = 'rgba(255,255,255,0.8)'
    c.beginPath()
    c.arc(fx, fy, 3, 0, Math.PI * 2)
    c.fill()
    c.restore()
  }

  // Arena spotlights
  const spotPositions = [W * 0.2, W * 0.5, W * 0.8]
  for (const sx of spotPositions) {
    const spotGrad = c.createRadialGradient(sx, 0, 0, sx, 0, H * 0.6)
    const a = 0.02 + intensity * 0.02 + Math.sin(t * 1.5 + sx * 0.01) * 0.005
    spotGrad.addColorStop(0, `rgba(255,68,68,${a})`)
    spotGrad.addColorStop(1, 'rgba(255,68,68,0)')
    c.fillStyle = spotGrad
    c.fillRect(0, 0, W, H)
  }

  // Ring floor with gradient
  const floorGrad = c.createLinearGradient(RING_X, FLOOR_Y, RING_X, FLOOR_Y + H * 0.22)
  floorGrad.addColorStop(0, '#14141f')
  floorGrad.addColorStop(1, '#0c0c16')
  c.fillStyle = floorGrad
  c.fillRect(RING_X, FLOOR_Y, RING_W, H * 0.22)

  // Floor texture
  c.strokeStyle = 'rgba(255,255,255,0.02)'
  c.lineWidth = 1
  for (let lx = RING_X + 10; lx < RING_X + RING_W; lx += 20) {
    c.beginPath()
    c.moveTo(lx, FLOOR_Y)
    c.lineTo(lx, FLOOR_Y + H * 0.22)
    c.stroke()
  }

  // Ring floor border
  c.strokeStyle = '#2a2a3a'
  c.lineWidth = 1
  c.strokeRect(RING_X, FLOOR_Y, RING_W, H * 0.22)

  // Ropes with glow
  const ropeColors = ['rgba(255,68,68,0.25)', 'rgba(255,140,60,0.2)', 'rgba(68,255,68,0.15)']
  for (let i = 1; i <= 3; i++) {
    const ry = FLOOR_Y - i * H * 0.08
    c.save()
    c.shadowColor = ropeColors[i - 1].replace(/[\d.]+\)$/, '0.5)')
    c.shadowBlur = 4
    c.strokeStyle = ropeColors[i - 1]
    c.lineWidth = 1.5
    c.beginPath()
    c.moveTo(RING_X, ry)
    c.lineTo(RING_X + RING_W, ry)
    c.stroke()
    c.restore()
  }

  // Corner posts with LED
  const postH = H * 0.26
  for (const px of [RING_X - 2, RING_X + RING_W - 2]) {
    c.fillStyle = '#1a1a2a'
    c.fillRect(px, FLOOR_Y - postH, 5, postH)
    // LED strip
    const ledY = ((t * 30) % postH)
    c.fillStyle = '#00ff44'
    c.fillRect(px + 1, FLOOR_Y - postH + ledY, 3, 4)
    c.fillStyle = 'rgba(0,255,68,0.3)'
    c.fillRect(px, FLOOR_Y - postH + ledY - 2, 5, 8)
  }

  // MFC watermark on floor
  c.save()
  c.font = '600 32px "Inter"'
  c.fillStyle = `rgba(255,68,68,${0.03 + intensity * 0.02})`
  c.textAlign = 'center'
  c.fillText('MFC', W / 2, FLOOR_Y + H * 0.14)
  c.restore()
}

/* ── Fighter composite ─────────────────────────────────── */
function drawFighter(
  c: CanvasRenderingContext2D,
  sim: Sim,
  name: string,
  color: string,
  side: 'left' | 'right',
  t: number,
) {
  c.save()

  // Dynamic shadow
  c.fillStyle = 'rgba(0,0,0,0.35)'
  c.save()
  c.scale(1, 0.2)
  c.beginPath()
  c.arc(sim.x, (FLOOR_Y + 5) / 0.2, 18, 0, Math.PI * 2)
  c.fill()
  c.restore()

  drawHumanoid(c, sim, color, t)
  c.restore()

  // Fighter name — anchored to corners, not above heads
  const nameY = 48
  const nameX = side === 'left' ? RING_X + 12 : RING_X + RING_W - 12
  const align = side === 'left' ? 'left' : 'right'

  // Name plate background
  c.save()
  const metrics = (() => { c.font = '8px "Press Start 2P"'; return c.measureText(name) })()
  const plateX = align === 'left' ? nameX - 4 : nameX - metrics.width - 4
  c.fillStyle = 'rgba(0,0,0,0.6)'
  c.fillRect(plateX, nameY - 10, metrics.width + 8, 14)
  c.restore()

  c.fillStyle = color
  c.font = '8px "Press Start 2P"'
  c.textAlign = align as CanvasTextAlign
  c.fillText(name, nameX, nameY)

  // HP bar — below name, anchored to corner
  const hpBarW = 56
  const hpX = align === 'left' ? nameX : nameX - hpBarW
  const hpY = nameY + 6

  c.fillStyle = '#12121a'
  c.fillRect(hpX, hpY, hpBarW, 4)

  // Segmented HP bar
  const hpFrac = sim.hp / 100
  const hpColor = hpFrac > 0.5 ? color : hpFrac > 0.25 ? '#ffaa00' : '#ff2222'
  c.fillStyle = hpColor
  c.fillRect(hpX, hpY, hpFrac * hpBarW, 4)

  // HP segments
  c.fillStyle = '#12121a'
  for (let seg = 1; seg < 5; seg++) {
    c.fillRect(hpX + (seg / 5) * hpBarW - 0.5, hpY, 1, 4)
  }

  c.strokeStyle = `${color}88`
  c.lineWidth = 0.5
  c.strokeRect(hpX, hpY, hpBarW, 4)

  // Stamina bar
  const stY = hpY + 6
  c.fillStyle = '#12121a'
  c.fillRect(hpX, stY, hpBarW, 2)
  c.fillStyle = `rgba(68,136,255,${0.5 + sim.stamina / 200})`
  c.fillRect(hpX, stY, (sim.stamina / 100) * hpBarW, 2)
}

/* ── HUD ───────────────────────────────────────────────── */
function drawHUD(c: CanvasRenderingContext2D, fight: Fight, t: number) {
  // Round + clock box
  const boxW = 70
  const boxH = 20
  c.fillStyle = 'rgba(10,10,15,0.8)'
  c.fillRect(W / 2 - boxW / 2, 6, boxW, boxH)
  c.strokeStyle = 'rgba(255,68,68,0.3)'
  c.lineWidth = 0.5
  c.strokeRect(W / 2 - boxW / 2, 6, boxW, boxH)

  c.fillStyle = '#e8e8f0'
  c.font = '8px "Press Start 2P"'
  c.textAlign = 'center'
  c.textBaseline = 'middle'

  const mins = Math.floor(fight.clock / 60)
  const secs = fight.clock % 60
  const timeStr = `R${fight.round} ${mins}:${secs.toString().padStart(2, '0')}`
  c.fillText(timeStr, W / 2, 16)
  c.textBaseline = 'alphabetic'

  // LIVE indicator
  c.save()
  const pulse = 0.6 + Math.sin(t * 4) * 0.4
  c.fillStyle = `rgba(0,255,68,${pulse})`
  c.beginPath()
  c.arc(W / 2 - boxW / 2 - 12, 16, 3, 0, Math.PI * 2)
  c.fill()
  c.fillStyle = '#00ff44'
  c.font = '6px "Press Start 2P"'
  c.textAlign = 'right'
  c.fillText('LIVE', W / 2 - boxW / 2 - 18, 19)
  c.restore()

  // Momentum bar
  const momW = 100
  const momX = W / 2 - momW / 2
  const momY = H - 18
  c.fillStyle = 'rgba(10,10,15,0.6)'
  c.fillRect(momX - 2, momY - 2, momW + 4, 6)

  const hpDiff = (fight.f1.hp - fight.f2.hp) / 200 + 0.5
  c.fillStyle = 'rgba(255,68,68,0.5)'
  c.fillRect(momX, momY, momW * hpDiff, 2)
  c.fillStyle = 'rgba(68,136,255,0.5)'
  c.fillRect(momX + momW * hpDiff, momY, momW * (1 - hpDiff), 2)

  // Commentary
  if (fight.commentaryTimer > 0) {
    const alpha = Math.min(1, fight.commentaryTimer / 10)
    c.save()
    c.globalAlpha = alpha
    c.fillStyle = '#ffdd00'
    c.font = '7px "Press Start 2P"'
    c.textAlign = 'center'
    c.fillText(fight.commentary, W / 2, H - 6)
    c.restore()
  }

  // KO text
  if (fight.phase === 'ko') {
    const scale = Math.min(1, fight.koTimer / 5)
    c.save()
    c.globalAlpha = scale
    c.fillStyle = '#ff4444'
    c.font = `${Math.floor(28 * scale)}px "Press Start 2P"`
    c.textAlign = 'center'
    c.textBaseline = 'middle'
    c.shadowColor = '#ff0000'
    c.shadowBlur = 20
    c.fillText('K.O.!', W / 2, H * 0.4)
    c.restore()
  }
}

/* ── Impact effect (radial burst) ──────────────────────── */
function drawImpactEffect(c: CanvasRenderingContext2D, x: number, y: number, intensity: number) {
  if (intensity <= 0) return
  c.save()
  const r = 15 + intensity * 20
  const grad = c.createRadialGradient(x, y, 0, x, y, r)
  grad.addColorStop(0, `rgba(255,255,200,${intensity * 0.5})`)
  grad.addColorStop(0.5, `rgba(255,200,50,${intensity * 0.3})`)
  grad.addColorStop(1, 'rgba(255,100,0,0)')
  c.fillStyle = grad
  c.fillRect(x - r, y - r, r * 2, r * 2)

  // Impact lines
  c.strokeStyle = `rgba(255,255,200,${intensity * 0.6})`
  c.lineWidth = 1
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + Date.now() * 0.01
    c.beginPath()
    c.moveTo(x + Math.cos(angle) * 5, y + Math.sin(angle) * 5)
    c.lineTo(x + Math.cos(angle) * (8 + intensity * 12), y + Math.sin(angle) * (8 + intensity * 12))
    c.stroke()
  }
  c.restore()
}

/* ── Simulation tick ───────────────────────────────────── */
function tick(fight: Fight): void {
  if (fight.phase === 'ko') {
    fight.koTimer++
    if (fight.koTimer > 20) fight.phase = 'ended'
    return
  }
  if (fight.phase !== 'fighting') return

  const { f1, f2 } = fight

  // Decay animation durations
  for (const f of [f1, f2]) {
    if (f.dur > 0) {
      f.frame++
      f.dur--
      if (f.dur <= 0) {
        f.anim = 'idle'
        f.frame = 0
      }
    }
  }

  // Decay intensity
  fight.intensity = Math.max(0, fight.intensity - 0.01)

  // Decay commentary
  if (fight.commentaryTimer > 0) fight.commentaryTimer--

  // Decay screen shake
  if (fight.shakeDur > 0) {
    fight.shakeX = (Math.random() - 0.5) * fight.shakeDur * 0.8
    fight.shakeY = (Math.random() - 0.5) * fight.shakeDur * 0.6
    fight.shakeDur--
  } else {
    fight.shakeX = 0
    fight.shakeY = 0
  }

  // Decay flash
  fight.flashAlpha = Math.max(0, fight.flashAlpha - 0.05)

  // Update particles
  updateParticles(fight)

  const dist = Math.abs(f1.x - f2.x)

  // Movement
  if (dist > 80) {
    if (f1.anim === 'idle') { f1.x += 4; f1.anim = 'walking'; f1.dur = 3; f1.frame = 0 }
    if (f2.anim === 'idle') { f2.x -= 4; f2.anim = 'walking'; f2.dur = 3; f2.frame = 0 }
  } else if (dist > 55) {
    if (f1.anim === 'idle') { f1.x += 2; f1.anim = 'walking'; f1.dur = 2; f1.frame = 0 }
    if (f2.anim === 'idle') { f2.x -= 2; f2.anim = 'walking'; f2.dur = 2; f2.frame = 0 }
  } else {
    // Combat range
    for (const [atk, def] of [[f1, f2], [f2, f1]] as [Sim, Sim][]) {
      if (atk.anim !== 'idle' || atk.stamina < 5) continue

      const roll = Math.random()

      if (roll < 0.04 && def.anim === 'punching') {
        // Dodge
        atk.anim = 'dodging'
        atk.dur = 5
        atk.frame = 0
        atk.x -= atk.facing * 8
      } else if (roll < 0.08) {
        // Block
        atk.anim = 'blocking'
        atk.dur = 8
        atk.frame = 0
        atk.stamina = Math.max(0, atk.stamina - 2)
      } else if (roll < 0.14) {
        // Kick
        atk.anim = 'kicking'
        atk.dur = 8
        atk.frame = 0
        atk.stamina = Math.max(0, atk.stamina - 5)

        if (def.anim === 'blocking') {
          // Blocked kick — reduced damage
          const dmg = 3 + Math.random() * 4
          def.hp = Math.max(0, def.hp - dmg)
          fight.intensity = Math.min(1, fight.intensity + 0.05)
          spawnImpact(fight, (atk.x + def.x) / 2, FLOOR_Y - 40, '#4488ff', 4)
        } else if (def.anim !== 'dodging') {
          const dmg = 10 + Math.random() * 15
          def.hp = Math.max(0, def.hp - dmg)
          def.anim = 'hit'
          def.dur = 6
          def.frame = 0
          fight.intensity = Math.min(1, fight.intensity + 0.15)
          fight.shakeDur = 6
          fight.flashAlpha = 0.15
          spawnImpact(fight, def.x, FLOOR_Y - 40, '#ff6600', 10)
          // Blood on hard hit
          if (dmg > 18) spawnImpact(fight, def.x, FLOOR_Y - 55, '#cc0000', 5)
          if (fight.commentaryTimer <= 0) {
            fight.commentary = COMMENTARY[Math.floor(Math.random() * COMMENTARY.length)]
            fight.commentaryTimer = 20
          }
        }
      } else if (roll < 0.28) {
        // Punch
        atk.anim = 'punching'
        atk.dur = 5
        atk.frame = 0
        atk.stamina = Math.max(0, atk.stamina - 3)

        if (def.anim === 'blocking') {
          const dmg = 1 + Math.random() * 3
          def.hp = Math.max(0, def.hp - dmg)
          fight.intensity = Math.min(1, fight.intensity + 0.03)
          spawnImpact(fight, (atk.x + def.x) / 2, FLOOR_Y - 50, '#4488ff', 3)
        } else if (def.anim === 'dodging') {
          // Whiff — no damage
        } else if (Math.random() < 0.6) {
          const dmg = 4 + Math.random() * 8
          const power = Math.random() < 0.12
          const actualDmg = power ? dmg * 2.5 : dmg
          def.hp = Math.max(0, def.hp - actualDmg)
          def.anim = 'hit'
          def.dur = power ? 7 : 4
          def.frame = 0
          fight.intensity = Math.min(1, fight.intensity + (power ? 0.2 : 0.08))

          if (power) {
            fight.shakeDur = 5
            fight.flashAlpha = 0.2
            spawnImpact(fight, def.x, FLOOR_Y - 50, '#ffdd00', 12)
            if (fight.commentaryTimer <= 0) {
              fight.commentary = 'POWER SHOT!'
              fight.commentaryTimer = 25
            }
          } else {
            spawnImpact(fight, (atk.x + def.x) / 2, FLOOR_Y - 50, '#ffaa44', 6)
          }
        }
      }
    }
  }

  // Stamina regen
  for (const f of [f1, f2]) {
    if (f.anim === 'idle') f.stamina = Math.min(100, f.stamina + 1.5)
  }

  // Clamp positions
  f1.x = Math.max(60, Math.min(420, f1.x))
  f2.x = Math.max(60, Math.min(420, f2.x))
  if (f2.x - f1.x < 30) {
    const mid = (f1.x + f2.x) / 2
    f1.x = mid - 15
    f2.x = mid + 15
  }

  // Clock
  fight.tick++
  if (fight.tick >= TICKS_PER_SEC) {
    fight.tick = 0
    fight.clock--
  }

  // End conditions
  if (f1.hp <= 0 || f2.hp <= 0) {
    fight.phase = 'ko'
    fight.koTimer = 0
    fight.winner = f1.hp > f2.hp ? 1 : 2
    fight.shakeDur = 10
    fight.flashAlpha = 0.4
    spawnImpact(fight, f1.hp <= 0 ? f1.x : f2.x, FLOOR_Y - 45, '#ff0000', 20)
  } else if (fight.clock <= 0) {
    if (fight.round < 3) {
      fight.round++
      fight.clock = 180
      fight.tick = 0
      f1.x = W * 0.3
      f2.x = W * 0.7
      f1.stamina = Math.min(100, f1.stamina + 30)
      f2.stamina = Math.min(100, f2.stamina + 30)
    } else {
      fight.phase = 'ended'
      fight.winner = f1.hp > f2.hp ? 1 : 2
    }
  }
}

/* ── Render one frame ──────────────────────────────────── */
function renderFrame(ctx: CanvasRenderingContext2D, fight: Fight) {
  const t = Date.now() / 1000

  ctx.save()
  ctx.imageSmoothingEnabled = false

  // Screen shake
  if (fight.shakeDur > 0) {
    ctx.translate(fight.shakeX, fight.shakeY)
  }

  drawRing(ctx, fight.intensity, t)
  drawFighter(ctx, fight.f1, 'IRONCLAD-7', '#ff4444', 'left', t)
  drawFighter(ctx, fight.f2, 'NEXUS-PRIME', '#4488ff', 'right', t)

  // Impact glow at contact point
  if (fight.f1.anim === 'hit' && fight.f1.dur > 2) {
    drawImpactEffect(ctx, fight.f1.x, FLOOR_Y - 45, fight.f1.dur / 6)
  }
  if (fight.f2.anim === 'hit' && fight.f2.dur > 2) {
    drawImpactEffect(ctx, fight.f2.x, FLOOR_Y - 45, fight.f2.dur / 6)
  }

  drawParticles(ctx, fight.particles)
  drawHUD(ctx, fight, t)

  // Screen flash
  if (fight.flashAlpha > 0) {
    ctx.fillStyle = `rgba(255,255,255,${fight.flashAlpha})`
    ctx.fillRect(-10, -10, W + 20, H + 20)
  }

  ctx.restore()
}

/* ── Component ─────────────────────────────────────────── */
export default function HeroFightPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fightRef = useRef<Fight>(newFight())
  const rafRef = useRef<number>(0)
  const tickRef = useRef<ReturnType<typeof setInterval>>()
  const restartRef = useRef<ReturnType<typeof setTimeout>>()
  const [prices, setPrices] = useState({ yes: 0.5, no: 0.5 })
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false

    if (reduced) {
      const f = newFight()
      f.f1.hp = 72
      f.f2.hp = 58
      f.round = 2
      f.intensity = 0.4
      fightRef.current = f
      renderFrame(ctx, f)
      setPrices({ yes: 0.55, no: 0.45 })
      return
    }

    fightRef.current = newFight()

    const scheduleRestart = () => {
      restartRef.current = setTimeout(() => {
        fightRef.current = newFight()
        tickRef.current = setInterval(() => {
          const f = fightRef.current
          tick(f)
          if (f.phase === 'ended') {
            clearInterval(tickRef.current!)
            scheduleRestart()
          }
        }, TICK_MS)
      }, RESTART_MS)
    }

    tickRef.current = setInterval(() => {
      const f = fightRef.current
      tick(f)
      if (f.phase === 'ended') {
        clearInterval(tickRef.current!)
        scheduleRestart()
      }
    }, TICK_MS)

    const priceId = setInterval(() => {
      const f = fightRef.current
      const total = f.f1.hp + f.f2.hp
      if (total > 0) {
        const yes = Math.round((f.f1.hp / total) * 100) / 100
        setPrices({ yes, no: Math.round((1 - yes) * 100) / 100 })
      }
    }, PRICE_MS)

    const draw = () => {
      renderFrame(ctx, fightRef.current)
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      clearInterval(tickRef.current!)
      clearInterval(priceId)
      clearTimeout(restartRef.current!)
    }
  }, [reduced])

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full h-auto block border border-border"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="mt-3 flex items-center justify-center gap-3">
        <span className="font-pixel text-[10px] text-accent">IRONCLAD-7</span>
        <span className="font-ui text-xs text-text2">to win:</span>
        <span className="font-pixel text-xs text-green">YES {prices.yes.toFixed(2)}</span>
        <span className="text-border">|</span>
        <span className="font-pixel text-xs text-red">NO {prices.no.toFixed(2)}</span>
      </div>
    </div>
  )
}
