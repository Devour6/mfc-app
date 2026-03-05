import { Fighter } from '@/types'
import { FIGHTER_MAX_HP } from '@/lib/fight-engine'
import { SkinPalette, HairStyle } from './types'
import {
  FIGHTER_SCALE, ATTACK_PHASES,
  POSE_GUARD, IDLE_FRAMES, IDLE_FRAME_MS, IDLE_CYCLE_MS,
  PUNCH_POSES, KICK_POSES,
  POSE_HIT_RECOIL, POSE_BLOCK_HIGH, POSE_DODGE_DUCK,
} from './constants'
import {
  easeOutCubic, easeInQuad, easeInOutQuad, lerp,
  clamp, statMod, lerpPose,
  P, px, pxo, drawSprite, shade, highlight,
  getFighterPalette, getFighterHairStyle,
} from './utils'
import { getAnimProgress, getAttackPhase, getPhaseProgress } from './animation-controller'
import { drawHitSpark, drawMotionTrail, drawSweatParticles } from './effects-renderer'
import { drawFighterNameTag } from './hud-renderer'

// ── Main fighter drawing orchestrator ───────────────────────────────────────
// Handles position interpolation, knockback, hit-stop, lunge, scale, and delegates
// to drawHumanoidFighter for the actual sprite rendering.
export const drawEnhancedFighter = (
  ctx: CanvasRenderingContext2D,
  fighterState: { position: { x: number; facing: number }; animation: { state: string; attackType?: string; frameCount: number; duration: number; walkDirection?: string }; hp: number; stamina: number; modifiers: { hitStopFrames: number }; combo: { count: number } },
  fighterData: Fighter,
  width: number,
  height: number,
  color: string,
  fighterNumber: 1 | 2,
  fightState: { fighter1: typeof fighterState; fighter2: typeof fighterState },
  renderPositionsRef: React.MutableRefObject<{ f1: { x: number; y: number }; f2: { x: number; y: number } }>,
  prevPositionsRef: React.MutableRefObject<{ f1: { x: number; y: number }; f2: { x: number; y: number }; timestamp: number } | null>,
  knockbackRef: React.MutableRefObject<{ f1: { offset: number; velocity: number }; f2: { offset: number; velocity: number } }>,
  hitStopProgressRef: React.MutableRefObject<{ f1: number; f2: number }>,
) => {
  const floorY = height * 0.75
  const posKey = fighterNumber === 1 ? 'f1' : 'f2'

  // Interpolate position for smooth motion between 80ms fight ticks
  const targetX = (fighterState.position.x / 480) * width
  const prev = prevPositionsRef.current
  const TICK_MS = 80

  if (prev) {
    const elapsed = Date.now() - prev.timestamp
    const t = Math.min(1, elapsed / TICK_MS)
    const smooth = t * t * (3 - 2 * t)
    renderPositionsRef.current[posKey].x += (targetX - renderPositionsRef.current[posKey].x) * smooth
  } else {
    renderPositionsRef.current[posKey].x = targetX
  }

  // Apply knockback offset
  const knockbackOffset = knockbackRef.current[posKey].offset
  const baseX = renderPositionsRef.current[posKey].x + knockbackOffset
  const baseY = floorY - 20

  // Hit-stop vibration
  const isInHitStop = fighterState.modifiers.hitStopFrames > 0
  let hitStopVibX = 0
  let hitStopVibY = 0
  if (isInHitStop) {
    const vibTime = Date.now() * 0.06
    hitStopVibX = Math.sin(vibTime) * 2.0
    hitStopVibY = Math.cos(vibTime * 1.5) * 1.0
  }

  const x = baseX + hitStopVibX
  const y = baseY + hitStopVibY

  ctx.save()

  // Screen shake on hit
  if (fighterState.animation.state === 'hit') {
    const time = Date.now() * 0.001
    const animProgress = getAnimProgress(fighterState)
    const decay = Math.exp(-animProgress * 3)
    const shakeIntensity = (fighterState.hp < FIGHTER_MAX_HP * 0.25 ? 10 : 6) * decay
    const shakePhase = time * 30
    ctx.translate(
      (Math.sin(shakePhase) + Math.sin(shakePhase * 2.3) * 0.4) * shakeIntensity,
      (Math.cos(shakePhase * 1.3) + Math.cos(shakePhase * 2.7) * 0.3) * shakeIntensity * 0.7
    )
    ctx.globalAlpha = 0.8 + animProgress * 0.2
  }

  const isHitFlash = fighterState.animation.state === 'hit' && isInHitStop

  if (fighterState.animation.state === 'down') {
    const time = Date.now() * 0.001
    ctx.translate(Math.sin(time * 10) * 12, Math.cos(time * 8) * 6)
  }

  ctx.globalAlpha *= Math.max(0.7, fighterState.stamina / 100)

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.4)'
  ctx.save()
  ctx.scale(1, 0.2)
  ctx.beginPath()
  ctx.arc(x, (floorY + 10) / 0.2, 30 * FIGHTER_SCALE, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Compute animation progress
  let animProgress = getAnimProgress(fighterState)

  // Hit-stop freeze logic
  if (isInHitStop) {
    const isAttackingDuringStop = fighterState.animation.state === 'punching' || fighterState.animation.state === 'kicking'
    if (isAttackingDuringStop) {
      const atkType = fighterState.animation.attackType || 'jab'
      const phases = ATTACK_PHASES[atkType] || ATTACK_PHASES.jab
      animProgress = (phases.active + phases.hold) / 2
    } else if (hitStopProgressRef.current[posKey] === 0 && animProgress > 0) {
      hitStopProgressRef.current[posKey] = animProgress
      animProgress = hitStopProgressRef.current[posKey]
    } else {
      animProgress = hitStopProgressRef.current[posKey]
    }
  } else {
    hitStopProgressRef.current[posKey] = 0
  }

  // SF2-style forward lunge
  let lungeOffset = 0
  const isAttacking = fighterState.animation.state === 'punching' || fighterState.animation.state === 'kicking'
  if (isAttacking && animProgress > 0) {
    const atkType = fighterState.animation.attackType || 'jab'
    const phase = getAttackPhase(animProgress, atkType)
    const phaseT = getPhaseProgress(animProgress, atkType, phase)

    const opponentState = fighterNumber === 1 ? fightState.fighter2 : fightState.fighter1
    const opponentScreenX = (opponentState.position.x / 480) * width
    const gapToOpponent = Math.abs(opponentScreenX - x)
    const lungeDistance = clamp(gapToOpponent * 0.7, 20, 80)

    if (phase === 'startup') {
      lungeOffset = fighterState.position.facing * Math.round(lerp(0, -6, easeInQuad(phaseT)))
    } else if (phase === 'active' || phase === 'hold') {
      lungeOffset = fighterState.position.facing * Math.round(lungeDistance)
    } else {
      lungeOffset = fighterState.position.facing * Math.round(lerp(lungeDistance, 0, easeOutCubic(phaseT)))
    }
  }

  // Scale the fighter — anchor at feet
  const feetY = y + 25
  const drawX = x + lungeOffset
  ctx.save()
  ctx.translate(drawX, feetY)
  ctx.scale(FIGHTER_SCALE, FIGHTER_SCALE)
  ctx.translate(-drawX, -feetY)

  const drawColor = isHitFlash && Math.sin(Date.now() * 0.02) > 0 ? '#ffffff' : color
  const palette = getFighterPalette(fighterData.id)
  const hairStyle = getFighterHairStyle(fighterData.id)
  drawHumanoidFighter(ctx, drawX, y, drawColor, fighterState, fighterNumber, animProgress, fighterData.stats, palette, hairStyle)

  // Hit spark at contact point
  if (isHitFlash) {
    const opponentForSpark = fighterNumber === 1 ? fightState.fighter2 : fightState.fighter1
    const opponentScreenX = (opponentForSpark.position.x / 480) * width
    const sparkX = opponentScreenX - fighterState.position.facing * 15
    const sparkY = y - 20
    drawHitSpark(ctx, sparkX, sparkY)
  }

  // Motion trails
  if (fighterState.animation.state === 'punching') {
    drawMotionTrail(ctx, drawX, y, fighterState.position.facing, 'punching')
  }
  if (fighterState.animation.state === 'kicking') {
    drawMotionTrail(ctx, drawX, y, fighterState.position.facing, 'kicking')
  }

  ctx.restore() // end scale transform

  // Sweat particles at screen scale
  if (fighterState.hp < FIGHTER_MAX_HP * 0.5) {
    drawSweatParticles(ctx, x, y - 80 * FIGHTER_SCALE)
  }

  ctx.restore()

  drawFighterNameTag(ctx, fighterData, x, y - 80 * FIGHTER_SCALE, color)
}

// ── Main humanoid fighter drawing with frame-based keyframe animation ───────
const drawHumanoidFighter = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  fighterState: { position: { facing: number }; animation: { state: string; attackType?: string; frameCount: number; duration: number; walkDirection?: string }; hp: number; modifiers: { hitStopFrames: number } },
  fighterNumber: 1 | 2,
  animProgress: number,
  fighterStats?: Fighter['stats'],
  palette?: SkinPalette,
  hairStyle?: HairStyle
) => {
  const skin = palette || { base: '#e8b88a', shadow: '#c89870', highlight: '#fad0a8' }
  const hair = hairStyle || 'full'
  const facing = fighterState.position.facing
  const state = fighterState.animation.state
  const attackType = fighterState.animation.attackType || 'jab'

  const spdMod = fighterStats ? statMod(fighterStats.speed, 0.7, 1.4) : 1.0
  const agrMod = fighterStats ? statMod(fighterStats.aggression, 0.6, 1.5) : 1.0
  const strMod = fighterStats ? statMod(fighterStats.strength, 0.85, 1.15) : 1.0
  const defMod = fighterStats ? statMod(fighterStats.defense, 0.8, 1.3) : 1.0

  ctx.save()

  let headY = y - 50
  let torsoY = y - 35
  let armY = y - 30
  let legY = y - 10
  let bodyLean = 0

  let fShA = 55, fElB = 110
  let bShA = 45, bElB = 120
  let fHiA = -10, fKnB = 20
  let bHiA = 8, bKnB = 25
  let punchGlow = false
  let kickGlow = false
  let gloveScale = 1.0
  let bootScale = 1.0

  switch (state) {
    case 'idle': {
      const now = Date.now()
      const offsetTime = now + fighterNumber * 200
      let cyclePos = offsetTime % IDLE_CYCLE_MS
      let frameIdx = 0
      for (let i = 0; i < IDLE_FRAME_MS.length; i++) {
        if (cyclePos < IDLE_FRAME_MS[i]) { frameIdx = i; break }
        cyclePos -= IDLE_FRAME_MS[i]
      }

      const pose = IDLE_FRAMES[frameIdx]
      const crouchDepth = 5 * agrMod
      headY += pose.headOff * agrMod + crouchDepth * 0.3
      torsoY += pose.torsoOff * agrMod + crouchDepth * 0.5
      armY += pose.armOff * agrMod + crouchDepth * 0.3
      legY += pose.legOff * agrMod - crouchDepth * 0.2
      bodyLean = facing * pose.bodyLean * agrMod

      const defBoost = (defMod - 1) * 8
      fShA = pose.fShA + defBoost
      fElB = pose.fElB + defBoost * 1.5
      bShA = pose.bShA + defBoost * 0.7
      bElB = pose.bElB + defBoost

      fHiA = pose.fHiA
      fKnB = pose.fKnB + crouchDepth * 0.5
      bHiA = pose.bHiA
      bKnB = pose.bKnB + crouchDepth * 0.5
      break
    }

    case 'punching': {
      punchGlow = true
      const poses = PUNCH_POSES[attackType] || PUNCH_POSES.jab
      const phase = getAttackPhase(animProgress, attackType)
      const phaseT = getPhaseProgress(animProgress, attackType, phase)

      switch (phase) {
        case 'startup': {
          const t = easeOutCubic(phaseT)
          const p = lerpPose(POSE_GUARD, poses.chamber, t)
          fShA = p.fShA; fElB = p.fElB; bShA = p.bShA; bElB = p.bElB
          fHiA = p.fHiA; fKnB = p.fKnB * strMod; bHiA = p.bHiA; bKnB = p.bKnB * strMod
          bodyLean = facing * p.bodyLean
          headY += p.headOff; torsoY += p.torsoOff
          gloveScale = p.gloveScale
          break
        }
        case 'active':
        case 'hold': {
          const p = poses.extend
          fShA = p.fShA; fElB = p.fElB; bShA = p.bShA; bElB = p.bElB
          fHiA = p.fHiA; fKnB = p.fKnB * strMod; bHiA = p.bHiA; bKnB = p.bKnB * strMod
          bodyLean = facing * p.bodyLean * strMod
          headY += p.headOff; torsoY += p.torsoOff
          gloveScale = p.gloveScale
          break
        }
        case 'recovery': {
          const t = easeOutCubic(phaseT)
          const p = lerpPose(poses.extend, POSE_GUARD, t)
          fShA = p.fShA; fElB = p.fElB; bShA = p.bShA; bElB = p.bElB
          fHiA = p.fHiA; fKnB = p.fKnB; bHiA = p.bHiA; bKnB = p.bKnB
          bodyLean = facing * lerp(poses.extend.bodyLean * strMod, POSE_GUARD.bodyLean, t)
          headY += p.headOff; torsoY += p.torsoOff
          gloveScale = p.gloveScale
          break
        }
      }
      break
    }

    case 'kicking': {
      kickGlow = true
      const kickPoses = KICK_POSES[attackType] || KICK_POSES.kick
      const phase = getAttackPhase(animProgress, attackType)
      const phaseT = getPhaseProgress(animProgress, attackType, phase)

      switch (phase) {
        case 'startup': {
          const t = easeOutCubic(phaseT)
          const p = lerpPose(POSE_GUARD, kickPoses.chamber, t)
          fShA = p.fShA; fElB = p.fElB; bShA = p.bShA; bElB = p.bElB
          fHiA = p.fHiA; fKnB = p.fKnB; bHiA = p.bHiA; bKnB = p.bKnB
          bodyLean = facing * p.bodyLean
          headY += p.headOff; armY += p.armOff
          bootScale = p.bootScale
          break
        }
        case 'active':
        case 'hold': {
          const p = kickPoses.extend
          fShA = p.fShA; fElB = p.fElB; bShA = p.bShA; bElB = p.bElB
          fHiA = p.fHiA; fKnB = p.fKnB; bHiA = p.bHiA; bKnB = p.bKnB
          bodyLean = facing * p.bodyLean * strMod
          headY += p.headOff; armY += p.armOff
          bootScale = p.bootScale
          break
        }
        case 'recovery': {
          const t = easeOutCubic(phaseT)
          if (t < 0.3) {
            const p = lerpPose(kickPoses.extend, kickPoses.chamber, t / 0.3)
            fShA = p.fShA; fElB = p.fElB; bShA = p.bShA; bElB = p.bElB
            fHiA = p.fHiA; fKnB = p.fKnB; bHiA = p.bHiA; bKnB = p.bKnB
            bodyLean = facing * p.bodyLean; armY += p.armOff; bootScale = p.bootScale
          } else {
            const p = lerpPose(kickPoses.chamber, POSE_GUARD, (t - 0.3) / 0.7)
            fShA = p.fShA; fElB = p.fElB; bShA = p.bShA; bElB = p.bElB
            fHiA = p.fHiA; fKnB = p.fKnB; bHiA = p.bHiA; bKnB = p.bKnB
            bodyLean = facing * p.bodyLean; armY += p.armOff; bootScale = p.bootScale
          }
          break
        }
      }
      break
    }

    case 'hit': {
      if (animProgress < 0.5) {
        const p = POSE_HIT_RECOIL
        fShA = p.fShA; fElB = p.fElB; bShA = p.bShA; bElB = p.bElB
        fHiA = p.fHiA; fKnB = p.fKnB; bHiA = p.bHiA; bKnB = p.bKnB
        bodyLean = facing * p.bodyLean
        headY += p.headOff; torsoY += p.torsoOff
        armY += p.armOff; legY += p.legOff
      } else {
        const recoverT = easeInOutQuad((animProgress - 0.5) / 0.5)
        const p = lerpPose(POSE_HIT_RECOIL, POSE_GUARD, recoverT)
        fShA = p.fShA; fElB = p.fElB; bShA = p.bShA; bElB = p.bElB
        fHiA = p.fHiA; fKnB = p.fKnB; bHiA = p.bHiA; bKnB = p.bKnB
        bodyLean = facing * p.bodyLean
        headY += p.headOff; torsoY += p.torsoOff
        armY += p.armOff; legY += p.legOff
        const stagger = Math.sin(recoverT * Math.PI * 3) * 5 * (1 - recoverT)
        headY += stagger
      }
      break
    }

    case 'blocking': {
      const blockPose = {
        ...POSE_BLOCK_HIGH,
        fShA: POSE_BLOCK_HIGH.fShA * defMod,
        fElB: POSE_BLOCK_HIGH.fElB * defMod,
        bShA: POSE_BLOCK_HIGH.bShA * defMod,
        bElB: POSE_BLOCK_HIGH.bElB * defMod,
      }
      if (animProgress < 0.85) {
        const p = blockPose
        fShA = p.fShA; fElB = p.fElB; bShA = p.bShA; bElB = p.bElB
        fHiA = p.fHiA; fKnB = p.fKnB; bHiA = p.bHiA; bKnB = p.bKnB
        bodyLean = facing * p.bodyLean
        headY += p.headOff
      } else {
        const t = easeOutCubic((animProgress - 0.85) / 0.15)
        const p = lerpPose(blockPose, POSE_GUARD, t)
        fShA = p.fShA; fElB = p.fElB; bShA = p.bShA; bElB = p.bElB
        fHiA = p.fHiA; fKnB = p.fKnB; bHiA = p.bHiA; bKnB = p.bKnB
        bodyLean = facing * p.bodyLean
        headY += p.headOff
      }
      break
    }

    case 'dodging': {
      if (animProgress < 0.6) {
        const p = POSE_DODGE_DUCK
        fShA = p.fShA; fElB = p.fElB; bShA = p.bShA; bElB = p.bElB
        fHiA = p.fHiA; fKnB = p.fKnB; bHiA = p.bHiA; bKnB = p.bKnB
        bodyLean = facing * p.bodyLean
        headY += p.headOff; torsoY += p.torsoOff
      } else {
        const t = easeOutCubic((animProgress - 0.6) / 0.4)
        const p = lerpPose(POSE_DODGE_DUCK, POSE_GUARD, t)
        fShA = p.fShA; fElB = p.fElB; bShA = p.bShA; bElB = p.bElB
        fHiA = p.fHiA; fKnB = p.fKnB; bHiA = p.bHiA; bKnB = p.bKnB
        bodyLean = facing * p.bodyLean
        headY += p.headOff; torsoY += p.torsoOff
      }
      break
    }

    case 'walking': {
      const total = fighterState.animation.frameCount + fighterState.animation.duration
      const walkDir = fighterState.animation.walkDirection || 'forward'
      const isForward = walkDir === 'forward'
      const walkPhase = total > 0 ? (fighterState.animation.frameCount / total) * Math.PI * 2 : 0

      const strideScale = strMod
      const swingAngle = (isForward ? 25 : 15) * strideScale

      const legSwing = Math.sin(walkPhase) * swingAngle
      const oppLegSwing = Math.sin(walkPhase + Math.PI) * swingAngle
      const kneeOnPlant = Math.abs(Math.cos(walkPhase)) * 18

      fHiA = legSwing
      fKnB = 15 + kneeOnPlant
      bHiA = oppLegSwing
      bKnB = 15 + Math.abs(Math.cos(walkPhase + Math.PI)) * 18

      const armSwing = Math.sin(walkPhase + Math.PI) * 15
      const oppArmSwing = Math.sin(walkPhase) * 15

      if (isForward) {
        fShA = 55 + armSwing
        fElB = 100 + armSwing * 0.5
        bShA = 45 + oppArmSwing
        bElB = 100 + oppArmSwing * 0.5
        bodyLean = facing * 8 * agrMod
      } else {
        fShA = 60 + armSwing * 0.5
        fElB = 115
        bShA = 50 + oppArmSwing * 0.5
        bElB = 115
        bodyLean = facing * -4 * defMod
      }

      const normalizedPhase = (walkPhase % (Math.PI * 2)) / (Math.PI * 2)
      const bobAmp = 3 * strMod
      let verticalBob: number
      if (normalizedPhase < 0.4) {
        verticalBob = -Math.sin((normalizedPhase / 0.4) * Math.PI * 0.5) * bobAmp
      } else {
        verticalBob = -Math.cos(((normalizedPhase - 0.4) / 0.6) * Math.PI * 0.5) * bobAmp
      }
      torsoY += verticalBob * 0.7
      headY += verticalBob * 0.2
      armY += verticalBob * 0.8
      legY += verticalBob * 0.3
      break
    }

    case 'down': {
      drawKnockedDownHumanoid(ctx, x, y, color, skin)
      ctx.restore()
      return
    }
  }

  // SF2 pixel-snap
  headY = Math.round(headY)
  torsoY = Math.round(torsoY)
  armY = Math.round(armY)
  legY = Math.round(legY)

  // Body lean as horizontal pixel shift (NO rotation)
  const leanShift = Math.round(facing * bodyLean * 0.4)

  // Draw body parts back-to-front
  const backLegX = facing === 1 ? x - 20 : x + 20
  drawLeg(ctx, backLegX, legY, color, facing, bHiA, bKnB, skin, false, 1.0)

  const backArmX = (facing === 1 ? x - 26 : x + 26) + leanShift
  drawArm(ctx, backArmX, armY, color, facing, bShA, bElB, skin, false, 1.0)

  drawTorso(ctx, x + Math.round(leanShift * 0.6), torsoY, color, state, skin)

  drawHead(ctx, x + leanShift, headY, color, facing, state, fighterState.hp, skin, hair)

  const frontArmX = (facing === 1 ? x + 26 : x - 26) + leanShift
  drawArm(ctx, frontArmX, armY, color, facing, fShA, fElB, skin, punchGlow, gloveScale)

  const frontLegX = facing === 1 ? x + 20 : x - 20
  drawLeg(ctx, frontLegX, legY, color, facing, fHiA, fKnB, skin, kickGlow, bootScale)

  ctx.restore()
}

// ── Head ────────────────────────────────────────────────────────────────────
const drawHead = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, facing: number, state: string, hp: number, palette: SkinPalette, hairStyle: HairStyle) => {
  const O = '#111'
  const C = color
  const Cs = shade(color)
  const Ch = highlight(color)
  const SK = palette.base
  const SS = palette.shadow
  const SH = palette.highlight
  const W = '#fff'

  const ox = x - P * 3 - P / 2
  const oy = y - P * 5

  let hairRows: string[][]
  switch (hairStyle) {
    case 'mohawk':
      hairRows = [
        ['', '', '',  C, '', '', ''],
        ['', '', '',  C, '', '', ''],
        ['',  O, SK,  C, SK, SK,  O],
      ]
      break
    case 'short':
      hairRows = [
        ['', '',  O,  O,  O, '', ''],
        ['',  O,  C,  C,  C,  O, ''],
        [ O,  C,  C,  C,  C,  C,  O],
      ]
      break
    case 'bald':
      hairRows = [
        ['', '',  O,  O,  O, '', ''],
        ['',  O, SH, SH, SH,  O, ''],
        [ O, SH, SH, SH, SH, SH,  O],
      ]
      break
    case 'shaggy':
      hairRows = [
        ['',  C,  C,  C,  C,  C, ''],
        [ C,  C,  C,  C,  C,  C,  C],
        [ C,  C,  C,  C,  C,  C,  C],
      ]
      break
    default:
      hairRows = [
        ['', '',  O,  O,  O, '', ''],
        ['',  O,  C,  C,  C,  O, ''],
        [ O,  C,  C,  C,  C,  C,  O],
      ]
  }

  const head: string[][] = [
    ...hairRows,
    [ O, Ch,  C,  C,  C, Cs,  O],
    [ O, SH, SK, SK, SK, SS,  O],
    [ O, SK, SK, SK, SK, SK,  O],
    [ O, SK, SK, SK, SK, SK,  O],
    [ O, SK, SK, SK, SK, SK,  O],
    ['',  O, SK, SK, SK,  O, ''],
    ['', '',  O,  O,  O, '', ''],
  ]
  drawSprite(ctx, ox, oy, head)

  if (state === 'hit') {
    px(ctx, ox + P * 1, oy + P * 5, '#ff0')
    px(ctx, ox + P * 5, oy + P * 5, '#ff0')
    px(ctx, ox + P * 2, oy + P * 7, '#c00')
    px(ctx, ox + P * 3, oy + P * 7, '#c00')
    px(ctx, ox + P * 4, oy + P * 7, '#c00')
  } else if (hp < FIGHTER_MAX_HP * 0.25) {
    px(ctx, ox + P * 1, oy + P * 5, '#800')
    px(ctx, ox + P * 5, oy + P * 5, '#800')
    px(ctx, ox + P * 3, oy + P * 7, '#c00')
  } else {
    px(ctx, ox + P * 1, oy + P * 5, W)
    px(ctx, ox + P * 5, oy + P * 5, W)
    const pupilOff = facing > 0 ? 1 : 0
    px(ctx, ox + P * (1 + pupilOff), oy + P * 5, '#111')
    px(ctx, ox + P * (5 - (1 - pupilOff)), oy + P * 5, '#111')
    px(ctx, ox + P * 2, oy + P * 7, '#444')
    px(ctx, ox + P * 3, oy + P * 7, '#333')
    px(ctx, ox + P * 4, oy + P * 7, '#444')
  }
}

// ── Torso ───────────────────────────────────────────────────────────────────
const drawTorso = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, state: string, palette: SkinPalette) => {
  const O = '#111'
  const SK = palette.base
  const SS = palette.shadow
  const SH = palette.highlight
  const C = color
  const Cs = shade(color)
  const T = state === 'hit' ? '#cc0000' : C
  const Ts = state === 'hit' ? '#990000' : Cs

  const ox = x - P * 6
  const oy = y

  const torso: string[][] = [
    ['',  O,  O,  O,  O,  O,  O,  O,  O,  O,  O, ''],
    [ O, SH, SH, SK, SK, SK, SK, SK, SK, SS, SS,  O],
    [ O, SH, SK, SH, SK, SK, SK, SK, SS, SK, SS,  O],
    [ O, SK, SK, SK, SH, SK, SK, SH, SK, SK, SK,  O],
    ['',  O, SK, SK, SS, SK, SK, SS, SK, SK,  O, ''],
    ['',  O, SK, SK, SK, SS, SS, SK, SK, SK,  O, ''],
    ['', '',  O, SK, SK, SK, SK, SK, SK,  O, '', ''],
    ['', '',  O,  O,  T,  T,  T,  T,  O,  O, '', ''],
    ['', '', '',  O,  T,  T,  T,  T,  O, '', '', ''],
    ['', '', '',  O,  T,  T,  T,  T,  O, '', '', ''],
    ['', '', '',  O, Ts,  O,  O, Ts,  O, '', '', ''],
    ['', '', '', '',  O, '', '',  O, '', '', '', ''],
  ]
  drawSprite(ctx, ox, oy, torso)
}

// ── Arm with shoulder + elbow joints ────────────────────────────────────────
const drawArm = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  color: string,
  facing: number,
  shoulderAngle: number,
  elbowBend: number,
  palette: SkinPalette,
  isPunching: boolean,
  gScale: number,
) => {
  const SK = palette.base, SS = palette.shadow, SH = palette.highlight
  const C = color
  const Cs = shade(color)
  const G = isPunching ? '#ffdd00' : color
  const GS = isPunching ? '#cc9900' : shade(color)
  const GH = isPunching ? '#ffe866' : highlight(color)

  ctx.save()
  ctx.translate(x, y)

  ctx.rotate(facing * shoulderAngle * Math.PI / 180)
  const ox = -P * 2
  const upperLen = 4
  for (let i = 0; i < upperLen; i++) {
    pxo(ctx, ox, i * P, SH)
    pxo(ctx, ox + P, i * P, SK)
    pxo(ctx, ox + P * 2, i * P, SK)
    pxo(ctx, ox + P * 3, i * P, SS)
  }

  ctx.translate(0, upperLen * P)
  ctx.rotate(facing * elbowBend * Math.PI / 180)
  const foreLen = 3
  for (let i = 0; i < foreLen; i++) {
    pxo(ctx, ox, i * P, C)
    pxo(ctx, ox + P, i * P, C)
    pxo(ctx, ox + P * 2, i * P, C)
    pxo(ctx, ox + P * 3, i * P, Cs)
  }

  // Glove
  const gloveY = foreLen * P
  ctx.save()
  const gloveCenterX = ox + P * 2
  const gloveCenterY = gloveY + P * 2
  ctx.translate(gloveCenterX, gloveCenterY)
  ctx.scale(gScale, gScale)
  ctx.translate(-gloveCenterX, -gloveCenterY)

  const gloveGrid: string[][] = [
    [GH,  G,  G,  G, GS],
    [ G,  G,  G,  G,  G],
    [ G,  G,  G,  G,  G],
    [GS,  G,  G,  G, GS],
  ]
  for (let gy = 0; gy < gloveGrid.length; gy++) {
    for (let gx = 0; gx < gloveGrid[gy].length; gx++) {
      pxo(ctx, ox - P / 2 + gx * P, gloveY + gy * P, gloveGrid[gy][gx])
    }
  }
  ctx.restore()

  if (isPunching) {
    ctx.fillStyle = 'rgba(255,221,0,0.4)'
    ctx.fillRect(ox - P * 2, gloveY - P, P * 8, P * 6)
  }

  ctx.restore()
}

// ── Leg with hip + knee joints ──────────────────────────────────────────────
const drawLeg = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  color: string,
  facing: number,
  hipAngle: number,
  kneeBend: number,
  palette: SkinPalette,
  isKicking: boolean,
  bScale: number,
) => {
  const SK = palette.base, SS = palette.shadow, SH = palette.highlight
  const C = color
  const Cs = shade(color)

  ctx.save()
  ctx.translate(x, y)

  ctx.rotate(facing * hipAngle * Math.PI / 180)
  const ox = -P * 2
  const thighLen = 4
  for (let i = 0; i < thighLen; i++) {
    if (i < 2) {
      pxo(ctx, ox, i * P, C)
      pxo(ctx, ox + P, i * P, C)
      pxo(ctx, ox + P * 2, i * P, C)
      pxo(ctx, ox + P * 3, i * P, Cs)
    } else {
      pxo(ctx, ox, i * P, SH)
      pxo(ctx, ox + P, i * P, SK)
      pxo(ctx, ox + P * 2, i * P, SK)
      pxo(ctx, ox + P * 3, i * P, SS)
    }
  }

  ctx.translate(0, thighLen * P)
  ctx.rotate(facing * kneeBend * Math.PI / 180)
  const shinLen = 4
  for (let i = 0; i < shinLen; i++) {
    pxo(ctx, ox, i * P, C)
    pxo(ctx, ox + P, i * P, C)
    pxo(ctx, ox + P * 2, i * P, C)
    pxo(ctx, ox + P * 3, i * P, Cs)
  }

  // Boot
  const bootY = shinLen * P
  const B = '#222', BD = '#111', BH = '#333'

  ctx.save()
  const bootCenterX = ox + P * 3 / 2
  const bootCenterY = bootY + P
  ctx.translate(bootCenterX, bootCenterY)
  ctx.scale(bScale, bScale)
  ctx.translate(-bootCenterX, -bootCenterY)

  pxo(ctx, ox - P / 2, bootY, BD)
  pxo(ctx, ox + P / 2, bootY, BH)
  pxo(ctx, ox + P * 3 / 2, bootY, B)
  pxo(ctx, ox + P * 5 / 2, bootY, B)
  pxo(ctx, ox + P * 7 / 2, bootY, BD)
  pxo(ctx, ox - P / 2, bootY + P, BD)
  pxo(ctx, ox + P / 2, bootY + P, B)
  pxo(ctx, ox + P * 3 / 2, bootY + P, B)
  pxo(ctx, ox + P * 5 / 2, bootY + P, BD)
  pxo(ctx, ox + P * 7 / 2, bootY + P, BD)
  pxo(ctx, ox - P / 2, bootY + P * 2, BD)
  pxo(ctx, ox + P / 2, bootY + P * 2, BD)
  pxo(ctx, ox + P * 3 / 2, bootY + P * 2, BD)
  pxo(ctx, ox + P * 5 / 2, bootY + P * 2, BD)
  pxo(ctx, ox + P * 7 / 2, bootY + P * 2, BD)
  ctx.restore()

  if (isKicking) {
    ctx.fillStyle = 'rgba(255,100,0,0.4)'
    ctx.fillRect(ox - P * 2, bootY - P, P * 8, P * 5)
  }

  ctx.restore()
}

// ── Knocked down fighter ────────────────────────────────────────────────────
const drawKnockedDownHumanoid = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, palette: SkinPalette) => {
  const SK = palette.base
  const SS = palette.shadow
  const SH = palette.highlight
  const C = color
  const Cs = shade(color)
  const G = '#ffdd00'
  const GS = '#cc9900'

  ctx.save()
  ctx.translate(x, y + 20)

  pxo(ctx, -7 * P, -2 * P, C)
  pxo(ctx, -6 * P, -2 * P, C)
  pxo(ctx, -7 * P, -P, SH)
  pxo(ctx, -6 * P, -P, SK)
  pxo(ctx, -7 * P, 0, SK)
  pxo(ctx, -6 * P, 0, SS)

  for (let i = -5; i <= 0; i++) {
    pxo(ctx, i * P, -2 * P, i < -3 ? SH : SK)
    pxo(ctx, i * P, -P, i < -3 ? SK : SK)
    pxo(ctx, i * P, 0, i < -3 ? SK : SS)
  }
  for (let i = 1; i <= 4; i++) {
    pxo(ctx, i * P, -P, C)
    pxo(ctx, i * P, 0, Cs)
  }

  pxo(ctx, -8 * P, -2 * P, SK)
  pxo(ctx, -8 * P, -P, SK)
  pxo(ctx, -9 * P, -2 * P, G)
  pxo(ctx, -9 * P, -P, G)
  pxo(ctx, -10 * P, -P, GS)
  pxo(ctx, -8 * P, P, SK)
  pxo(ctx, -9 * P, P, G)

  for (let i = 5; i <= 7; i++) {
    pxo(ctx, i * P, -P, SK)
    pxo(ctx, i * P, 0, SS)
  }
  pxo(ctx, 8 * P, -P, '#222')
  pxo(ctx, 8 * P, 0, '#111')
  pxo(ctx, 9 * P, -P, '#222')
  pxo(ctx, 9 * P, 0, '#111')

  const time = Date.now() * 0.003
  for (let i = 0; i < 3; i++) {
    const starX = -5 * P + i * P * 4
    const starY = -4 * P + Math.sin(time + i * 2) * P * 2
    px(ctx, starX, starY, '#ffdd00')
    px(ctx, starX + P, starY, '#ffdd00')
    px(ctx, starX, starY + P, '#ffdd00')
    px(ctx, starX + P, starY + P, '#ffdd00')
  }

  ctx.restore()
}
