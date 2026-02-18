'use client'

import { useEffect, useRef, useState } from 'react'

/* ── Canvas constants ──────────────────────────────────── */
const W = 480
const H = 280
const P = 3 // pixel block size (matches arena's P=4 scaled down)
const TICK_MS = 200
const PRICE_MS = 2000
const RESTART_MS = 3000
const TICKS_PER_SEC = 5 // 1000/200

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
  anim: 'idle' | 'punching' | 'walking' | 'hit'
  frame: number
  dur: number
}

interface Fight {
  round: number
  clock: number
  phase: 'fighting' | 'ended'
  f1: Sim
  f2: Sim
  tick: number
}

/* ── Factory ───────────────────────────────────────────── */
function newFight(): Fight {
  return {
    round: 1,
    clock: 180,
    phase: 'fighting',
    tick: 0,
    f1: { x: W * 0.3, facing: 1, hp: 100, stamina: 100, anim: 'idle', frame: 0, dur: 0 },
    f2: { x: W * 0.7, facing: -1, hp: 100, stamina: 100, anim: 'idle', frame: 0, dur: 0 },
  }
}

/* ── Pixel helpers (ported from EnhancedFightCanvas) ───── */
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

/* ── Body part drawing (ported from EnhancedFightCanvas) ── */
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

  if (isPunching && isFront) {
    c.fillStyle = 'rgba(255,221,0,0.3)'
    c.fillRect(ox - P * 2, gloveY - P, P * 5, P * 5)
  }

  c.restore()
}

function drawLeg(c: CanvasRenderingContext2D, x: number, y: number, color: string, isFront: boolean, walkOffset: number) {
  const s = shade(color)

  c.save()
  c.translate(x, y + walkOffset)

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
  pxo(c, ox - P, bootY, '#111')
  pxo(c, ox, bootY, '#222')
  pxo(c, ox + P, bootY, '#222')
  pxo(c, ox + P * 2, bootY, '#111')
  pxo(c, ox - P, bootY + P, '#111')
  pxo(c, ox, bootY + P, '#111')
  pxo(c, ox + P, bootY + P, '#111')
  pxo(c, ox + P * 2, bootY + P, '#111')

  c.restore()
}

/* ── Composite humanoid fighter drawing ────────────────── */
function drawHumanoid(c: CanvasRenderingContext2D, sim: Sim, color: string) {
  const x = sim.x
  const baseY = FLOOR_Y - 15

  // Animation state
  const headY = baseY - 50
  let torsoY = baseY - 35
  let armY = baseY - 30
  const legY = baseY - 10
  let bodyLean = 0
  let armExtension = 0
  const isPunching = sim.anim === 'punching'

  switch (sim.anim) {
    case 'punching':
      armExtension = 18
      bodyLean = sim.facing * 5
      break
    case 'hit':
      bodyLean = -sim.facing * 10
      torsoY += 2
      break
    case 'walking':
      bodyLean = sim.facing * 2
      break
  }

  c.save()

  // Hit flash
  if (sim.anim === 'hit' && sim.frame % 4 < 2) {
    c.globalAlpha = 0.7
  }

  // Body lean
  c.translate(x, baseY)
  c.rotate(bodyLean * Math.PI / 180)
  c.translate(-x, -baseY)

  // Walk animation offsets for legs
  const walkOff = sim.anim === 'walking' ? Math.sin(sim.frame * 0.5) * 3 : 0

  // Back leg
  const backLegX = sim.facing === 1 ? x - 6 : x + 6
  drawLeg(c, backLegX, legY, color, false, -walkOff)

  // Back arm
  const backArmX = sim.facing === 1 ? x - 12 : x + 12
  drawArm(c, backArmX, armY, color, sim.facing, false, 0, false)

  // Torso
  drawTorso(c, x, torsoY, color, sim.anim)

  // Head
  drawHead(c, x, headY, color, sim.facing, sim.anim, sim.hp)

  // Front arm (punching arm)
  const frontArmX = sim.facing === 1 ? x + 12 : x - 12
  drawArm(c, frontArmX, armY, color, sim.facing, true, armExtension, isPunching)

  // Front leg
  const frontLegX = sim.facing === 1 ? x + 6 : x - 6
  drawLeg(c, frontLegX, legY, color, true, walkOff)

  c.restore()
}

/* ── Ring drawing ──────────────────────────────────────── */
function drawRing(c: CanvasRenderingContext2D) {
  c.fillStyle = '#0a0a0f'
  c.fillRect(0, 0, W, H)

  c.fillStyle = '#12121a'
  c.fillRect(RING_X, FLOOR_Y, RING_W, H * 0.2)

  c.strokeStyle = '#2a2a3a'
  c.lineWidth = 1
  c.strokeRect(RING_X, FLOOR_Y, RING_W, H * 0.2)

  // Ropes
  c.strokeStyle = 'rgba(255,68,68,0.15)'
  for (let i = 1; i <= 3; i++) {
    const y = FLOOR_Y - i * H * 0.08
    c.beginPath()
    c.moveTo(RING_X, y)
    c.lineTo(RING_X + RING_W, y)
    c.stroke()
  }

  // Corner posts
  const postH = H * 0.26
  c.fillStyle = '#ff4444'
  c.fillRect(RING_X - 2, FLOOR_Y - postH, 4, postH)
  c.fillRect(RING_X + RING_W - 2, FLOOR_Y - postH, 4, postH)

  // MFC watermark
  c.save()
  c.font = '600 36px "Inter"'
  c.fillStyle = 'rgba(255,68,68,0.03)'
  c.textAlign = 'center'
  c.fillText('MFC', W / 2, FLOOR_Y + H * 0.12)
  c.restore()
}

/* ── Fighter composite (humanoid + name + HP bar) ──────── */
function drawFighter(
  c: CanvasRenderingContext2D,
  sim: Sim,
  name: string,
  color: string,
) {
  c.save()

  // Dynamic shadow
  c.fillStyle = 'rgba(0,0,0,0.3)'
  c.save()
  c.scale(1, 0.2)
  c.beginPath()
  c.arc(sim.x, (FLOOR_Y + 5) / 0.2, 18, 0, Math.PI * 2)
  c.fill()
  c.restore()

  // Draw humanoid sprite
  drawHumanoid(c, sim, color)

  c.restore()

  // HP bar — centered above fighter
  const hpY = FLOOR_Y - 85
  const hpX = sim.x - 32

  c.fillStyle = '#12121a'
  c.fillRect(hpX, hpY, 64, 4)
  c.fillStyle = color
  c.fillRect(hpX, hpY, (sim.hp / 100) * 64, 4)
  c.strokeStyle = color
  c.lineWidth = 1
  c.strokeRect(hpX, hpY, 64, 4)

  // Fighter name
  c.fillStyle = color
  c.font = '10px "Press Start 2P"'
  c.textAlign = 'center'
  c.fillText(name, sim.x, hpY - 10)
}

/* ── HUD ───────────────────────────────────────────────── */
function drawHUD(c: CanvasRenderingContext2D, round: number) {
  c.fillStyle = 'rgba(10,10,15,0.7)'
  c.fillRect(W / 2 - 40, 8, 80, 24)

  c.fillStyle = '#e8e8f0'
  c.font = '10px "Press Start 2P"'
  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillText(`R${round}`, W / 2, 20)
  c.textBaseline = 'alphabetic'
}

/* ── Simulation tick ───────────────────────────────────── */
function tick(fight: Fight): void {
  if (fight.phase !== 'fighting') return

  const { f1, f2 } = fight

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

  const dist = Math.abs(f1.x - f2.x)

  if (dist > 80) {
    if (f1.anim === 'idle') { f1.x += 5; f1.anim = 'walking'; f1.dur = 3; f1.frame = 0 }
    if (f2.anim === 'idle') { f2.x -= 5; f2.anim = 'walking'; f2.dur = 3; f2.frame = 0 }
  } else if (dist > 60) {
    if (f1.anim === 'idle') { f1.x += 3; f1.anim = 'walking'; f1.dur = 2; f1.frame = 0 }
    if (f2.anim === 'idle') { f2.x -= 3; f2.anim = 'walking'; f2.dur = 2; f2.frame = 0 }
  } else {
    for (const [atk, def] of [[f1, f2], [f2, f1]] as [Sim, Sim][]) {
      if (atk.anim !== 'idle' || atk.stamina < 5) continue
      if (Math.random() < 0.18) {
        atk.anim = 'punching'
        atk.dur = 6
        atk.frame = 0
        atk.stamina = Math.max(0, atk.stamina - 3)

        if (Math.random() < 0.55) {
          const dmg = 5 + Math.random() * 10
          const power = Math.random() < 0.15
          def.hp = Math.max(0, def.hp - (power ? dmg * 2.5 : dmg))
          def.anim = 'hit'
          def.dur = power ? 8 : 4
          def.frame = 0
        }
      }
    }
  }

  for (const f of [f1, f2]) {
    if (f.anim === 'idle') f.stamina = Math.min(100, f.stamina + 1)
  }

  f1.x = Math.max(60, Math.min(420, f1.x))
  f2.x = Math.max(60, Math.min(420, f2.x))
  if (f2.x - f1.x < 30) {
    const mid = (f1.x + f2.x) / 2
    f1.x = mid - 15
    f2.x = mid + 15
  }

  fight.tick++
  if (fight.tick >= TICKS_PER_SEC) {
    fight.tick = 0
    fight.clock--
  }

  if (f1.hp <= 0 || f2.hp <= 0) {
    fight.phase = 'ended'
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
    }
  }
}

/* ── Render one frame ──────────────────────────────────── */
function renderFrame(ctx: CanvasRenderingContext2D, fight: Fight) {
  ctx.imageSmoothingEnabled = false
  drawRing(ctx)
  drawFighter(ctx, fight.f1, 'IRONCLAD-7', '#ff4444')
  drawFighter(ctx, fight.f2, 'NEXUS-PRIME', '#4488ff')
  drawHUD(ctx, fight.round)
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
        className="w-full h-auto block"
        style={{ imageRendering: 'pixelated' }}
      />
      <div className="mt-3 flex items-center justify-center gap-2">
        <span className="font-pixel text-xs text-text2">IRONCLAD-7</span>
        <span className="font-ui text-xs text-text2">to win:</span>
        <span className="font-pixel text-xs text-green">YES</span>
        <span className="font-ui text-sm font-semibold text-green">
          {prices.yes.toFixed(2)}
        </span>
        <span className="text-border">&vert;</span>
        <span className="font-pixel text-xs text-red">NO</span>
        <span className="font-ui text-sm font-semibold text-red">
          {prices.no.toFixed(2)}
        </span>
      </div>
    </div>
  )
}
