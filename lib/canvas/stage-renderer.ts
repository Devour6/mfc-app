import { FIGHTER_MAX_HP } from '@/lib/fight-engine'
import { CrowdReactionState } from './types'

// ── Module-level crowd spike state (persists across frames for smooth decay) ─
let _crowdSpike = 0
let _crowdSpikeTime = 0
const CROWD_SPIKE_DECAY = 2.5 // seconds for spike to fully decay

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
// Crowd reacts to fight events: hits spike excitement, knockdowns trigger a roar,
// combos build energy, close rounds sustain tension. Excitement decays smoothly
// via a module-level spike that persists across frames.
export const drawCrowdAtmosphere = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  fighter1Hp: number,
  fighter2Hp: number,
  reactions?: CrowdReactionState
) => {
  const time = Date.now() * 0.001

  // ── Base excitement from HP (existing behavior) ──────────────────────────
  const fightIntensity = 1 - (Math.min(fighter1Hp, fighter2Hp) / FIGHTER_MAX_HP)

  // ── Event-driven spike system ────────────────────────────────────────────
  let isKnockdown = false
  if (reactions) {
    let spikeTarget = 0

    // Hit reaction — crowd surges when someone takes a hit
    if (reactions.f1AnimState === 'hit' || reactions.f2AnimState === 'hit') {
      spikeTarget = Math.max(spikeTarget, 0.25)
    }

    // Knockdown — crowd roar (maximum surge)
    if (reactions.f1AnimState === 'down' || reactions.f2AnimState === 'down') {
      spikeTarget = Math.max(spikeTarget, 0.55)
      isKnockdown = true
    }

    // Combo excitement — builds with combo count (capped at 0.35)
    const maxCombo = Math.max(reactions.f1Combo, reactions.f2Combo)
    if (maxCombo > 2) {
      spikeTarget = Math.max(spikeTarget, Math.min(maxCombo * 0.09, 0.35))
    }

    // Only raise the spike — never lower it mid-decay (let decay handle reduction)
    if (spikeTarget > _crowdSpike) {
      _crowdSpike = spikeTarget
      _crowdSpikeTime = time
    }
  }

  // Decay spike smoothly over time
  const spikeAge = time - _crowdSpikeTime
  const spikeDecay = Math.max(0, 1 - spikeAge / CROWD_SPIKE_DECAY)
  const currentSpike = _crowdSpike * spikeDecay

  // Close-round bonus — sustained tension when both fighters are hurt and close in HP
  let closeRoundBonus = 0
  const hpDiff = Math.abs(fighter1Hp - fighter2Hp) / FIGHTER_MAX_HP
  const avgHpRatio = (fighter1Hp + fighter2Hp) / (2 * FIGHTER_MAX_HP)
  if (hpDiff < 0.15 && avgHpRatio < 0.5) {
    closeRoundBonus = 0.15
  }

  const crowdExcitement = Math.min(0.3 + fightIntensity * 0.7 + currentSpike + closeRoundBonus, 1.0)

  // ── Crowd silhouettes ────────────────────────────────────────────────────
  // Knockdown = standing ovation (taller). Higher excitement = faster bob.
  const ovationBoost = isKnockdown ? 15 : currentSpike * 8
  const bobSpeed = 3 + crowdExcitement * 4 // 3 baseline → up to 7 at peak

  // Crowd color warms toward red/orange as excitement rises
  const crowdR = Math.round(20 + crowdExcitement * 40)
  const crowdG = Math.round(20 - crowdExcitement * 8)
  const crowdB = Math.round(30 - crowdExcitement * 15)

  for (let i = 0; i < width; i += 20) {
    const baseHeight = 40 + Math.sin(i * 0.1) * 15 + ovationBoost
    const animatedHeight = baseHeight + Math.sin(time * bobSpeed + i * 0.1) * crowdExcitement * 12
    const crowdY = height * 0.35
    const alpha = 0.15 + crowdExcitement * 0.2
    const crowdGrad = ctx.createLinearGradient(i, crowdY, i, crowdY + animatedHeight)
    crowdGrad.addColorStop(0, `rgba(${crowdR},${crowdG},${crowdB},${alpha})`)
    crowdGrad.addColorStop(1, `rgba(${crowdR},${crowdG},${crowdB},0)`)
    ctx.fillStyle = crowdGrad
    ctx.fillRect(i, crowdY, 15, animatedHeight)
  }

  // ── Camera flashes ───────────────────────────────────────────────────────
  // More frequent + brighter at high excitement. Knockdowns trigger a burst.
  const flashChance = fightIntensity * 0.02 + currentSpike * 0.06
  const flashCount = isKnockdown ? 3 : 1
  for (let f = 0; f < flashCount; f++) {
    if (Math.random() < flashChance) {
      const flashX = Math.random() * width
      const flashY = height * (0.1 + Math.random() * 0.15)
      const flashAlpha = 0.6 + Math.random() * 0.4
      const flashRadius = 2 + Math.random() * 3 + currentSpike * 2
      ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`
      ctx.beginPath()
      ctx.arc(flashX, flashY, flashRadius, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // ── Spotlights ───────────────────────────────────────────────────────────
  const lightPositions = [width * 0.2, width * 0.5, width * 0.8]
  lightPositions.forEach((lx, index) => {
    const baseIntensity = 0.8 + Math.sin(time + index) * 0.2
    const excitedIntensity = baseIntensity + crowdExcitement * 0.4
    const lightGradient = ctx.createRadialGradient(lx, height * 0.1, 0, lx, height * 0.1, 150)
    lightGradient.addColorStop(0, `rgba(255,255,255,${excitedIntensity * 0.4})`)
    lightGradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = lightGradient
    ctx.fillRect(lx - 150, height * 0.1, 300, height * 0.4)

    // Spotlight beams — activate at lower threshold when spike is active
    if (fightIntensity > 0.6 || currentSpike > 0.15) {
      const beamAlpha = excitedIntensity * 0.1 + currentSpike * 0.05
      const beamGradient = ctx.createLinearGradient(lx, height * 0.1, lx, height * 0.6)
      beamGradient.addColorStop(0, `rgba(255,255,200,${beamAlpha})`)
      beamGradient.addColorStop(1, 'rgba(255,255,200,0)')
      ctx.fillStyle = beamGradient
      ctx.fillRect(lx - 30, height * 0.1, 60, height * 0.5)
    }
  })

  // ── Wave effects ─────────────────────────────────────────────────────────
  // Lower threshold, higher amplitude when crowd is spiking
  if (fightIntensity > 0.4 || currentSpike > 0.1) {
    const waveAlpha = crowdExcitement * 0.1 + currentSpike * 0.05
    ctx.strokeStyle = `rgba(255,255,255,${waveAlpha})`
    ctx.lineWidth = 1
    const waveAmp = crowdExcitement * 3 + currentSpike * 3
    for (let i = 0; i < 5; i++) {
      const waveY = height * 0.1 + i * 8
      ctx.beginPath()
      for (let wx = 0; wx < width; wx += 5) {
        const waveHeight = Math.sin((wx + time * 200) * 0.02 + i) * waveAmp
        if (wx === 0) ctx.moveTo(wx, waveY + waveHeight)
        else ctx.lineTo(wx, waveY + waveHeight)
      }
      ctx.stroke()
    }
  }
}
