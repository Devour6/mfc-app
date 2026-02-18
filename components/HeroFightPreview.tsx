'use client'

import { useEffect, useRef, useState } from 'react'

/* ── Canvas constants ──────────────────────────────────── */
const W = 480
const H = 280
const S = 3 // pixel scale (smaller than full canvas's 4)
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

/* ── Fighter sprite: idle ──────────────────────────────── */
function drawIdle(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  f: number,
) {
  // Head
  c.fillStyle = color
  c.fillRect(x + 2 * S, y, 4 * S, 4 * S)

  // Eyes
  c.fillStyle = '#ffffff'
  if (f === 1) {
    c.fillRect(x + 4 * S, y + S, S, S)
    c.fillRect(x + 2 * S, y + S, S, S)
  } else {
    c.fillRect(x + 3 * S, y + S, S, S)
    c.fillRect(x + 5 * S, y + S, S, S)
  }

  // Body
  c.fillStyle = color
  c.fillRect(x + S, y + 4 * S, 6 * S, 6 * S)

  // Arms (guard position)
  if (f === 1) {
    c.fillRect(x + 7 * S, y + 3 * S, 2 * S, 3 * S)
    c.fillRect(x - S, y + 4 * S, 2 * S, 3 * S)
  } else {
    c.fillRect(x - S, y + 3 * S, 2 * S, 3 * S)
    c.fillRect(x + 7 * S, y + 4 * S, 2 * S, 3 * S)
  }

  // Gloves
  c.fillStyle = '#ffffff'
  if (f === 1) {
    c.fillRect(x + 7 * S, y + 2 * S, 2 * S, 2 * S)
    c.fillRect(x - S, y + 3 * S, 2 * S, 2 * S)
  } else {
    c.fillRect(x - S, y + 2 * S, 2 * S, 2 * S)
    c.fillRect(x + 7 * S, y + 3 * S, 2 * S, 2 * S)
  }

  // Legs
  c.fillStyle = color
  c.fillRect(x + S, y + 10 * S, 2 * S, 5 * S)
  c.fillRect(x + 5 * S, y + 10 * S, 2 * S, 5 * S)
}

/* ── Fighter sprite: punching ──────────────────────────── */
function drawPunch(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  f: number,
) {
  drawIdle(c, x, y, color, f)

  // Extended arm + glove
  c.fillStyle = color
  if (f === 1) {
    c.fillRect(x + 7 * S, y + 4 * S, 8 * S, 2 * S)
    c.fillStyle = '#ffffff'
    c.fillRect(x + 14 * S, y + 3 * S, 3 * S, 3 * S)
  } else {
    c.fillRect(x - 7 * S, y + 4 * S, 8 * S, 2 * S)
    c.fillStyle = '#ffffff'
    c.fillRect(x - 9 * S, y + 3 * S, 3 * S, 3 * S)
  }
}

/* ── Fighter sprite: walking ───────────────────────────── */
function drawWalk(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  f: number,
  frame: number,
) {
  drawIdle(c, x, y, color, f)

  const off = Math.sin(frame * 0.3) * S
  c.fillStyle = color
  c.fillRect(x + S, y + 10 * S + off, 2 * S, 5 * S - Math.abs(off))
  c.fillRect(x + 5 * S, y + 10 * S - off, 2 * S, 5 * S - Math.abs(off))
}

/* ── Fighter composite (sprite + name + HP bar) ────────── */
function drawFighter(
  c: CanvasRenderingContext2D,
  sim: Sim,
  name: string,
  color: string,
) {
  const bx = sim.x - 6 * S
  const by = FLOOR_Y - 20 - 16 * S

  c.save()

  // Hit flash effect
  if (sim.anim === 'hit' && sim.frame % 4 < 2) {
    c.globalAlpha = 0.7
    c.filter = 'brightness(1.5)'
  }

  switch (sim.anim) {
    case 'punching':
      drawPunch(c, bx, by, color, sim.facing)
      break
    case 'walking':
      drawWalk(c, bx, by, color, sim.facing, sim.frame)
      break
    default:
      drawIdle(c, bx, by, color, sim.facing)
      break
  }

  c.restore()

  // HP bar — 64x4, centered above fighter, 20px above head
  const hpY = by - 20
  const hpX = sim.x - 32

  c.fillStyle = '#12121a'
  c.fillRect(hpX, hpY, 64, 4)
  c.fillStyle = color
  c.fillRect(hpX, hpY, (sim.hp / 100) * 64, 4)
  c.strokeStyle = color
  c.lineWidth = 1
  c.strokeRect(hpX, hpY, 64, 4)

  // Fighter name — 12px above HP bar
  c.fillStyle = color
  c.font = '10px "Press Start 2P"'
  c.textAlign = 'center'
  c.fillText(name, sim.x, hpY - 12)
}

/* ── HUD — round counter only ──────────────────────────── */
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

  // Advance animations
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
    // Far — approach quickly
    if (f1.anim === 'idle') {
      f1.x += 5
      f1.anim = 'walking'
      f1.dur = 3
      f1.frame = 0
    }
    if (f2.anim === 'idle') {
      f2.x -= 5
      f2.anim = 'walking'
      f2.dur = 3
      f2.frame = 0
    }
  } else if (dist > 60) {
    // Mid-range — approach slowly
    if (f1.anim === 'idle') {
      f1.x += 3
      f1.anim = 'walking'
      f1.dur = 2
      f1.frame = 0
    }
    if (f2.anim === 'idle') {
      f2.x -= 3
      f2.anim = 'walking'
      f2.dur = 2
      f2.frame = 0
    }
  } else {
    // In range — combat
    for (const [atk, def] of [
      [f1, f2],
      [f2, f1],
    ] as [Sim, Sim][]) {
      if (atk.anim !== 'idle' || atk.stamina < 5) continue
      if (Math.random() < 0.18) {
        atk.anim = 'punching'
        atk.dur = 6
        atk.frame = 0
        atk.stamina = Math.max(0, atk.stamina - 3)

        // Hit check
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

  // Stamina regen when idle
  for (const f of [f1, f2]) {
    if (f.anim === 'idle') f.stamina = Math.min(100, f.stamina + 1)
  }

  // Bounds + minimum gap
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

  // KO / round / decision
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

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Main effect: simulation + rendering
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false

    if (reduced) {
      // Static fallback: idle fighters, fixed HP, R2
      const f = newFight()
      f.f1.hp = 72
      f.f2.hp = 58
      f.round = 2
      fightRef.current = f
      renderFrame(ctx, f)
      setPrices({ yes: 0.55, no: 0.45 })
      return
    }

    // Start simulation
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

    // Price ticker — update every 2s
    const priceId = setInterval(() => {
      const f = fightRef.current
      const total = f.f1.hp + f.f2.hp
      if (total > 0) {
        const yes = Math.round((f.f1.hp / total) * 100) / 100
        setPrices({ yes, no: Math.round((1 - yes) * 100) / 100 })
      }
    }, PRICE_MS)

    // rAF render loop
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
