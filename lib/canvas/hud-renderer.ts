import { FightState, Fighter } from '@/types'
import { FIGHTER_MAX_HP } from '@/lib/fight-engine'

// ── SF2-style HUD: wide HP bars across top, centered timer, round dots ──────
export const drawSF2HUD = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  fightState: FightState,
  fighters: Fighter[]
) => {
  const f1 = fightState.fighter1
  const f2 = fightState.fighter2
  if (!f1 || !f2) return

  const hudY = 12
  const barHeight = 18
  const timerWidth = 56
  const hudPadding = 16
  const barGap = 8

  const barWidth = (width - timerWidth - barGap * 2 - hudPadding * 2) / 2

  // ── Background panel ────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.75)'
  ctx.fillRect(0, 0, width, hudY + barHeight + 42)

  // ── Fighter names ───────────────────────────────────────────────────
  ctx.font = '10px "Press Start 2P"'
  ctx.fillStyle = '#ff4444'
  ctx.textAlign = 'left'
  ctx.fillText(fighters[0]?.name?.toUpperCase() || 'P1', hudPadding, hudY + 10)
  ctx.fillStyle = '#4488ff'
  ctx.textAlign = 'right'
  ctx.fillText(fighters[1]?.name?.toUpperCase() || 'P2', width - hudPadding, hudY + 10)

  // ── HP bars ─────────────────────────────────────────────────────────
  const barY = hudY + 16
  const p1BarX = hudPadding
  const p2BarX = width - hudPadding - barWidth

  // Background track
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(p1BarX, barY, barWidth, barHeight)
  ctx.fillRect(p2BarX, barY, barWidth, barHeight)

  // HP fill — color transitions: green → yellow → orange → red
  const hpColor = (ratio: number): string => {
    if (ratio > 0.5) return '#22cc44'
    if (ratio > 0.25) return '#ddaa00'
    if (ratio > 0.1) return '#ff6600'
    return '#cc2222'
  }

  // P1: bar fills from right edge toward left (depletes from left)
  const f1Ratio = Math.max(0, f1.hp / FIGHTER_MAX_HP)
  const f1FillWidth = barWidth * f1Ratio
  const f1Color = hpColor(f1Ratio)
  ctx.fillStyle = f1Color
  ctx.fillRect(p1BarX + barWidth - f1FillWidth, barY + 1, f1FillWidth, barHeight - 2)
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.fillRect(p1BarX + barWidth - f1FillWidth, barY + 1, f1FillWidth, Math.floor(barHeight / 3))

  // P2: bar fills from left edge toward right (depletes from right)
  const f2Ratio = Math.max(0, f2.hp / FIGHTER_MAX_HP)
  const f2FillWidth = barWidth * f2Ratio
  const f2Color = hpColor(f2Ratio)
  ctx.fillStyle = f2Color
  ctx.fillRect(p2BarX, barY + 1, f2FillWidth, barHeight - 2)
  ctx.fillStyle = 'rgba(255,255,255,0.15)'
  ctx.fillRect(p2BarX, barY + 1, f2FillWidth, Math.floor(barHeight / 3))

  // HP segment lines (5 segments per bar like SF2)
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'
  ctx.lineWidth = 1
  for (let i = 1; i < 5; i++) {
    const segX1 = p1BarX + (barWidth / 5) * i
    ctx.beginPath(); ctx.moveTo(segX1, barY); ctx.lineTo(segX1, barY + barHeight); ctx.stroke()
    const segX2 = p2BarX + (barWidth / 5) * i
    ctx.beginPath(); ctx.moveTo(segX2, barY); ctx.lineTo(segX2, barY + barHeight); ctx.stroke()
  }

  // Bar borders
  ctx.strokeStyle = '#888'
  ctx.lineWidth = 2
  ctx.strokeRect(p1BarX, barY, barWidth, barHeight)
  ctx.strokeRect(p2BarX, barY, barWidth, barHeight)

  // ── Timer ───────────────────────────────────────────────────────────
  const timerX = width / 2
  const timerY = barY + barHeight / 2

  ctx.fillStyle = '#111'
  ctx.strokeStyle = '#666'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(timerX, timerY, 22, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  const clockVal = Math.max(0, fightState.clock ?? 0)
  ctx.font = 'bold 16px "Press Start 2P"'
  ctx.fillStyle = clockVal <= 10 ? '#ff4444' : '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(clockVal), timerX, timerY)
  ctx.textBaseline = 'alphabetic'

  // ── Round indicator + dots ──────────────────────────────────────────
  const roundY = barY + barHeight + 10
  ctx.font = '8px "Press Start 2P"'
  ctx.fillStyle = '#aaa'
  ctx.textAlign = 'center'
  ctx.fillText(`ROUND ${fightState.round}`, timerX, roundY + 8)

  const maxRounds = fightState.maxRounds || 3
  const roundsToWin = Math.ceil(maxRounds / 2)
  const scores = fightState.roundScores || []

  let p1Wins = 0
  let p2Wins = 0
  for (const s of scores) {
    if (s.winner === 1) p1Wins++
    else if (s.winner === 2) p2Wins++
  }

  const dotRadius = 4
  const dotSpacing = 14
  const dotY = roundY + 20

  for (let i = 0; i < roundsToWin; i++) {
    const dx = timerX - 30 - i * dotSpacing
    ctx.beginPath()
    ctx.arc(dx, dotY, dotRadius, 0, Math.PI * 2)
    if (i < p1Wins) {
      ctx.fillStyle = '#ff4444'
      ctx.fill()
    } else {
      ctx.strokeStyle = '#555'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  }

  for (let i = 0; i < roundsToWin; i++) {
    const dx = timerX + 30 + i * dotSpacing
    ctx.beginPath()
    ctx.arc(dx, dotY, dotRadius, 0, Math.PI * 2)
    if (i < p2Wins) {
      ctx.fillStyle = '#4488ff'
      ctx.fill()
    } else {
      ctx.strokeStyle = '#555'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  }

  // ── Stamina bars (thin, below HP) ───────────────────────────────────
  const stamY = barY + barHeight + 3
  const stamHeight = 4

  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(p1BarX, stamY, barWidth, stamHeight)
  const f1StamFill = (f1.stamina / 100) * barWidth
  ctx.fillStyle = '#3388cc'
  ctx.fillRect(p1BarX + barWidth - f1StamFill, stamY, f1StamFill, stamHeight)

  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(p2BarX, stamY, barWidth, stamHeight)
  const f2StamFill = (f2.stamina / 100) * barWidth
  ctx.fillStyle = '#3388cc'
  ctx.fillRect(p2BarX, stamY, f2StamFill, stamHeight)

  // ── Phase overlays (center screen) ──────────────────────────────────
  drawPhaseOverlay(ctx, width, height, fightState, hudY, barHeight, hudPadding)
}

// ── Phase overlays (KO, Decision, Repricing) ────────────────────────────────
const drawPhaseOverlay = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  fightState: FightState,
  hudY: number,
  barHeight: number,
  hudPadding: number
) => {
  const phase = fightState.phase
  const centerY = height * 0.45

  if (phase === 'ko') {
    ctx.save()
    ctx.font = 'bold 48px "Press Start 2P"'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#000'
    ctx.fillText('K.O.', width / 2 + 3, centerY + 3)
    ctx.fillStyle = '#ff2222'
    ctx.shadowBlur = 20
    ctx.shadowColor = '#ff0000'
    ctx.fillText('K.O.', width / 2, centerY)
    ctx.shadowBlur = 0
    ctx.restore()
  } else if (phase === 'decision') {
    ctx.save()
    ctx.font = 'bold 28px "Press Start 2P"'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#000'
    ctx.fillText('DECISION', width / 2 + 2, centerY + 2)
    ctx.fillStyle = '#ffd700'
    ctx.shadowBlur = 15
    ctx.shadowColor = '#ffaa00'
    ctx.fillText('DECISION', width / 2, centerY)
    ctx.shadowBlur = 0
    ctx.restore()
  } else if (phase === 'repricing') {
    const repTime = fightState.repricingTimeLeft ?? 0
    ctx.save()

    ctx.fillStyle = 'rgba(0,0,20,0.3)'
    ctx.fillRect(0, hudY + barHeight + 42, width, height)

    ctx.font = 'bold 20px "Press Start 2P"'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#000'
    ctx.fillText('REPRICING', width / 2 + 2, centerY - 18)
    ctx.fillStyle = '#00ddff'
    ctx.shadowBlur = 12
    ctx.shadowColor = '#00aaff'
    ctx.fillText('REPRICING', width / 2, centerY - 20)
    ctx.shadowBlur = 0

    ctx.font = 'bold 32px "Press Start 2P"'
    ctx.fillStyle = repTime <= 3 ? '#ff4444' : '#ffffff'
    ctx.fillText(String(repTime), width / 2, centerY + 20)

    const rec = fightState.lastRecovery
    if (rec) {
      ctx.font = '10px "Press Start 2P"'
      ctx.fillStyle = '#22cc44'
      ctx.textAlign = 'left'
      ctx.fillText(`+${rec.fighter1.total} HP`, hudPadding + 10, centerY + 50)
      ctx.textAlign = 'right'
      ctx.fillText(`+${rec.fighter2.total} HP`, width - hudPadding - 10, centerY + 50)
    }

    ctx.restore()
  }
}

// ── Fighter name tag ────────────────────────────────────────────────────────
export const drawFighterNameTag = (
  ctx: CanvasRenderingContext2D,
  fighter: Fighter,
  x: number,
  y: number,
  color: string,
) => {
  ctx.save()
  ctx.font = '10px "Press Start 2P"'
  const nameWidth = ctx.measureText(fighter.name).width + 12
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.fillRect(x - nameWidth / 2, y - 18, nameWidth, 16)
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.fillText(fighter.name, x, y - 6)
  ctx.restore()
}
