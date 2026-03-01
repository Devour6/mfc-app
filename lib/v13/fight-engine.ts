// lib/v13/fight-engine.ts
// Sprint 1, Task 1J.2: V13 Fight Engine Core Loop + State Machine.
// Tick-based combat simulation with 8-phase state machine, 3-round structure,
// and callback-driven lifecycle. Uses combat-math.ts pure functions for all calculations.

import {
  rollDamage,
  applyMitigation,
  relentlessMitigation,
  blockReduction,
  hitChance,
  effectiveCritChance,
  effectiveReactionChance,
  staminaCost,
  computeMaxStamina,
  computeStaminaRegen,
  resolveTierAbilities,
  counterPunchRate,
  counterPunchDamageMult,
  cpCatchRate,
  getCurrentTempo,
  actionRate,
  recoveryHp,
  scoreDecision,
  roundWinner,
  checkTKO,
  isDesperate as isDesperateHp,
  desperationDamage,
  applyCondition,
  isPowerAttack,
  BLOCK_CAP_PER_ROUND,
  CP_PROC_CAP_PER_ROUND,
  CP_MISS_DRAIN,
  FIGHTER_MAX_HP,
} from './combat-math'
import type { TierAbilities } from './combat-math'
import {
  QUEUE_SECONDS,
  MATCHUP_REVEAL_SECONDS,
  PRE_FIGHT_SECONDS,
  REPRICING_SECONDS,
  SETTLEMENT_SECONDS,
  INTERMISSION_SECONDS,
  BASE_TEMPO,
  TICKS_PER_SECOND,
  TICK_INTERVAL_MS,
  ROUND_SECONDS,
  MAX_ROUNDS,
  EXHAUSTION,
  RECOVERY_RATES,
  RECOVERY_TRAILING_BONUS,
  RECOVERY_END_MOD_MULT,
  statToMod,
} from './constants'
import type {
  FightPhase,
  FinishMethod,
  V13Fighter,
  V13FighterStats,
  V13FighterState,
  V13CombatStats,
  V13FightState,
  V13FightResult,
  RoundScore,
  V13RecoveryData,
  V13EngineCallbacks,
  V13GearLoadout,
} from './types'

// Engine-local constants

/** Heavy Hands (POW T1): flat bonus damage on power attacks. */
const HEAVY_HANDS_BONUS = 1

// Devastator (POW T3): exploding dice on natural crit + power attack, 1x/fight.
// Roll d6 >= threshold for bonus damage multiplier. Power attack misses cost extra stamina.
const DEVASTATOR_DAMAGE_MULT = 1.5
const DEVASTATOR_EXPLODE_THRESHOLD = 5 // d6 >= 5 (~33%)
const DEVASTATOR_MISS_STAMINA_PENALTY = 3

/** Thick Skin (END T1): flat damage reduction on all incoming hits. */
const THICK_SKIN_REDUCTION = 1

/** Pause between 'finish' and 'settlement' phases. */
const FINISH_PAUSE_SECONDS = 3

type AttackType = 'jab' | 'cross' | 'hook' | 'uppercut' | 'roundhouse' | 'combo'
type FighterAction = AttackType | 'dodge' | 'block' | 'move'

const ATTACK_TYPES: readonly AttackType[] = [
  'jab', 'cross', 'hook', 'uppercut', 'roundhouse', 'combo',
]
const ALL_ACTIONS: readonly FighterAction[] = [
  ...ATTACK_TYPES, 'dodge', 'block', 'move',
]

interface InternalFighterState {
  // Public fields (projected to V13FighterState)
  id: string
  hp: number
  stamina: number
  maxStamina: number
  tempo: number
  isDesperate: boolean
  blocksThisRound: number
  stats: V13CombatStats

  // Engine-internal
  config: V13Fighter
  effectiveStats: V13FighterStats
  abilities: TierAbilities
  powMod: number
  endMod: number
  tecMod: number
  staminaRegen: number
  roundDamage: [number, number, number]
  roundStrikes: [number, number, number]
  cpProcsThisRound: number
  exhaustionTable: readonly number[]
  devastatorUsedThisFight: boolean
  critsLanded: number
}

interface ActionWeightEntry {
  base: number
  powScale: number
  endScale: number
  tecScale: number
}

const ACTION_WEIGHT_TABLE: Record<FighterAction, ActionWeightEntry> = {
  jab:        { base: 25, powScale: 0,  endScale: 0, tecScale: 2 },
  cross:      { base: 18, powScale: 3,  endScale: 0, tecScale: 1 },
  hook:       { base: 8,  powScale: 4,  endScale: 0, tecScale: 0 },
  uppercut:   { base: 4,  powScale: 5,  endScale: 0, tecScale: 0 },
  roundhouse: { base: 3,  powScale: 3,  endScale: 0, tecScale: 0 },
  combo:      { base: 3,  powScale: 3,  endScale: 0, tecScale: 0 },
  dodge:      { base: 10, powScale: 0,  endScale: 0, tecScale: 4 },
  block:      { base: 10, powScale: 0,  endScale: 5, tecScale: 0 },
  move:       { base: 5,  powScale: 0,  endScale: 0, tecScale: 0 },
}

function applyGearBonuses(
  base: V13FighterStats,
  gear: V13GearLoadout
): V13FighterStats {
  const result = { ...base }
  for (const piece of gear.pieces) {
    result[piece.primaryStat] += piece.primaryBonus
    if (piece.secondaryStat && piece.secondaryBonus) {
      result[piece.secondaryStat] += piece.secondaryBonus
    }
  }
  result.pow = Math.max(0, Math.min(100, result.pow))
  result.end = Math.max(0, Math.min(100, result.end))
  result.tec = Math.max(0, Math.min(100, result.tec))
  return result
}

function createInternalFighter(config: V13Fighter): InternalFighterState {
  const effectiveStats = applyGearBonuses(config.stats, config.gear)
  // Abilities use NATURAL stats (no gear) for tier checks
  const abilities = resolveTierAbilities(
    config.stats.pow, config.stats.end, config.stats.tec
  )
  const rawMaxStamina = computeMaxStamina(effectiveStats.end)
  const conditionedMaxStamina = applyCondition(rawMaxStamina, 'stamina', config.condition)

  return {
    id: config.id,
    hp: FIGHTER_MAX_HP,
    stamina: conditionedMaxStamina,
    maxStamina: conditionedMaxStamina,
    tempo: applyCondition(BASE_TEMPO, 'tempo', config.condition),
    isDesperate: false,
    blocksThisRound: 0,
    stats: {
      strikesThrown: 0,
      strikesLanded: 0,
      powerShots: 0,
      dodges: 0,
      blocks: 0,
      damageDealt: 0,
      damageTaken: 0,
      abilityProcs: 0,
    },
    config,
    effectiveStats,
    abilities,
    powMod: statToMod(effectiveStats.pow),
    endMod: statToMod(effectiveStats.end),
    tecMod: statToMod(effectiveStats.tec),
    staminaRegen: computeStaminaRegen(effectiveStats.end),
    roundDamage: [0, 0, 0],
    roundStrikes: [0, 0, 0],
    cpProcsThisRound: 0,
    exhaustionTable: abilities.tier3.ironMan
      ? EXHAUSTION.IRON_MAN
      : EXHAUSTION.BASELINE,
    devastatorUsedThisFight: false,
    critsLanded: 0,
  }
}

function toPublicFighterState(f: InternalFighterState): V13FighterState {
  return {
    id: f.id,
    hp: f.hp,
    stamina: f.stamina,
    maxStamina: f.maxStamina,
    tempo: f.tempo,
    isDesperate: f.isDesperate,
    blocksThisRound: f.blocksThisRound,
    stats: { ...f.stats },
  }
}

export class V13FightEngine {
  private phase: FightPhase = 'queue'
  private round = 0 // 0-indexed internally
  private clockSeconds = ROUND_SECONDS
  private phaseTimer = QUEUE_SECONDS
  private tickCount = 0
  private tickAccumulator = 0
  private f1: InternalFighterState
  private f2: InternalFighterState
  private roundScores: RoundScore[] = []
  private lastRecovery: V13RecoveryData | undefined
  private result: V13FightResult | undefined
  private callbacks: Partial<V13EngineCallbacks>
  private intervalId: ReturnType<typeof setInterval> | undefined
  private fighter1Config: V13Fighter
  private fighter2Config: V13Fighter

  constructor(
    fighter1: V13Fighter,
    fighter2: V13Fighter,
    callbacks?: Partial<V13EngineCallbacks>
  ) {
    this.fighter1Config = fighter1
    this.fighter2Config = fighter2
    this.callbacks = callbacks ?? {}
    this.f1 = createInternalFighter(fighter1)
    this.f2 = createInternalFighter(fighter2)
  }

  /** Start the engine timer. */
  start(): void {
    if (this.intervalId) return
    this.intervalId = setInterval(() => this.tick(), TICK_INTERVAL_MS)
  }

  /** Stop the engine timer. */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
  }

  /** Get the current fight state snapshot. */
  getState(): V13FightState {
    return this.toPublicState()
  }

  /** Advance one tick. Public for synchronous testing. */
  tick(): void {
    this.tickCount++
    this.tickAccumulator++

    switch (this.phase) {
      case 'queue':
      case 'matchup_reveal':
      case 'pre_fight':
      case 'repricing':
      case 'settlement':
      case 'intermission':
        this.tickPhaseTimer()
        break
      case 'finish':
        this.tickPhaseTimer()
        break
      case 'fighting':
        this.tickFighting()
        break
    }

    this.emitState()
  }

  // State machine

  private transitionTo(nextPhase: FightPhase): void {
    this.phase = nextPhase
    this.tickAccumulator = 0

    switch (nextPhase) {
      case 'matchup_reveal':
        this.phaseTimer = MATCHUP_REVEAL_SECONDS
        this.callbacks.onMatchupReveal?.(this.fighter1Config, this.fighter2Config)
        this.callbacks.onPhaseChange?.(nextPhase)
        break
      case 'pre_fight':
        this.phaseTimer = PRE_FIGHT_SECONDS
        this.callbacks.onPhaseChange?.(nextPhase)
        break
      case 'fighting':
        this.callbacks.onPhaseChange?.(nextPhase)
        if (this.round === 0 && this.clockSeconds === ROUND_SECONDS) {
          this.emitCommentary('Round 1 — FIGHT!', 'system')
        }
        break
      case 'repricing':
        this.phaseTimer = REPRICING_SECONDS
        this.callbacks.onRepricingStart?.(this.round + 1)
        break
      case 'finish':
        this.phaseTimer = FINISH_PAUSE_SECONDS
        this.callbacks.onPhaseChange?.(nextPhase)
        break
      case 'settlement':
        this.phaseTimer = SETTLEMENT_SECONDS
        this.callbacks.onPhaseChange?.(nextPhase)
        break
      case 'intermission':
        this.phaseTimer = INTERMISSION_SECONDS
        this.callbacks.onPhaseChange?.(nextPhase)
        break
    }
  }

  private tickPhaseTimer(): void {
    if (this.tickAccumulator >= TICKS_PER_SECOND) {
      this.tickAccumulator = 0
      this.phaseTimer--
      if (this.phaseTimer <= 0) {
        this.onPhaseTimerExpired()
      }
    }
  }

  private onPhaseTimerExpired(): void {
    switch (this.phase) {
      case 'queue':
        this.transitionTo('matchup_reveal')
        break
      case 'matchup_reveal':
        this.transitionTo('pre_fight')
        break
      case 'pre_fight':
        this.transitionTo('fighting')
        break
      case 'repricing':
        this.advanceRound()
        break
      case 'finish':
        this.transitionTo('settlement')
        break
      case 'settlement':
        this.transitionTo('intermission')
        break
      case 'intermission':
        this.stop()
        break
    }
  }

  // Fighting phase

  private tickFighting(): void {
    // Decrement clock every TICKS_PER_SECOND ticks
    if (this.tickAccumulator >= TICKS_PER_SECOND) {
      this.tickAccumulator = 0
      this.clockSeconds--
    }

    // Process both fighters
    const exh1 = this.f1.exhaustionTable[this.round]
    const exh2 = this.f2.exhaustionTable[this.round]

    this.processFighter(this.f1, this.f2, exh1)
    if (this.result) return
    this.processFighter(this.f2, this.f1, exh2)
    if (this.result) return

    // Regen stamina per tick
    this.regenStamina(this.f1)
    this.regenStamina(this.f2)

    // Update tempo from stamina ratio
    this.updateTempo(this.f1)
    this.updateTempo(this.f2)

    // Check desperation
    this.checkDesperationState(this.f1)
    this.checkDesperationState(this.f2)

    // Check round end
    if (this.clockSeconds <= 0) {
      if (this.round < MAX_ROUNDS - 1) {
        this.endRound()
      } else {
        this.scoreDecisionInternal()
      }
    }
  }

  private processFighter(
    attacker: InternalFighterState,
    defender: InternalFighterState,
    exhaustionMult: number
  ): void {
    // Tempo-based action probability
    if (Math.random() >= actionRate(attacker.tempo)) return

    const action = this.selectAction(attacker)
    if (action === 'move') return
    if (action === 'dodge' || action === 'block') {
      attacker.stamina = Math.max(0, attacker.stamina - staminaCost(action))
      return
    }

    this.resolveAttack(attacker, defender, action, exhaustionMult)
  }

  /**
   * Weighted random action selection.
   * Base weights per action are scaled by stat modifiers (POW boosts power attacks,
   * END boosts blocks, TEC boosts dodges). Iron Guard gets 1.5x block weight.
   * Actions are filtered by stamina affordability. Falls back to 'move' if empty.
   */
  private selectAction(fighter: InternalFighterState): FighterAction {
    const weights: number[] = []
    const actions: FighterAction[] = []

    for (const action of ALL_ACTIONS) {
      const cost = staminaCost(action)
      if (cost > fighter.stamina && cost > 0) continue

      const entry = ACTION_WEIGHT_TABLE[action]
      let w = entry.base
      if (fighter.powMod > 0) w += entry.powScale * fighter.powMod
      if (fighter.endMod > 0) w += entry.endScale * fighter.endMod
      if (fighter.tecMod > 0) w += entry.tecScale * fighter.tecMod

      // Iron Guard: boost block weight
      if (action === 'block' && fighter.abilities.tier2.ironGuard) {
        w *= 1.5
      }

      weights.push(Math.max(1, w))
      actions.push(action)
    }

    if (actions.length === 0) return 'move'

    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    let roll = Math.random() * totalWeight
    for (let i = 0; i < weights.length; i++) {
      roll -= weights[i]
      if (roll <= 0) return actions[i]
    }
    return actions[actions.length - 1]
  }

  /**
   * Full damage pipeline for a single attack.
   * Steps: (1) defender reaction roll → dodge/block/none, (2) accuracy check
   * (Devastator miss penalty on power attacks), (3) crit check, (4) dice damage
   * + powMod, (5) tier bonuses (Heavy Hands, Devastator exploding dice on crit +
   * power attack) + desperation + exhaustion, (6) END mitigation (Relentless bypass
   * or standard), (7) Thick Skin reduction, (8) block reduction (Iron Guard
   * doubles + Grinding Guard drain), (9) apply damage, (10) KO/TKO/desperation.
   */
  private resolveAttack(
    attacker: InternalFighterState,
    defender: InternalFighterState,
    attackType: AttackType,
    exhaustionMult: number
  ): void {
    // Deduct stamina
    attacker.stamina = Math.max(0, attacker.stamina - staminaCost(attackType))
    attacker.stats.strikesThrown++
    if (isPowerAttack(attackType)) attacker.stats.powerShots++

    // 1. Defender reaction roll
    const reaction = this.resolveReaction(defender)

    if (reaction === 'dodge') {
      defender.stats.dodges++
      // Counter Punch check on successful dodge
      if (defender.abilities.tier2.counterPunch) {
        this.resolveCounterPunch(defender, attacker)
      }
      return
    }

    // 2. Accuracy check (applies whether blocked or not)
    const power = isPowerAttack(attackType)
    if (Math.random() > hitChance(attacker.tecMod, attacker.isDesperate)) {
      // Devastator fighters pay extra stamina on power attack misses
      if (power && attacker.abilities.tier3.devastator) {
        attacker.stamina = Math.max(0, attacker.stamina - DEVASTATOR_MISS_STAMINA_PENALTY)
      }
      return
    }

    // 3. Crit check
    const isCrit = Math.random() < effectiveCritChance(
      attacker.tecMod, attacker.isDesperate
    )

    // 4. Roll dice damage (includes powMod)
    let damage = rollDamage(attackType, attacker.powMod)
    if (isCrit) {
      damage *= 2
      attacker.critsLanded++
    }

    // 5. Tier bonuses
    if (attacker.abilities.tier1.heavyHands && power) {
      damage += HEAVY_HANDS_BONUS
    }
    // Devastator: on natural crit + power attack, roll d6 for exploding dice (1x/fight)
    if (isCrit && power && attacker.abilities.tier3.devastator
        && !attacker.devastatorUsedThisFight) {
      const d6 = Math.floor(Math.random() * 6) + 1
      if (d6 >= DEVASTATOR_EXPLODE_THRESHOLD) {
        damage = Math.floor(damage * DEVASTATOR_DAMAGE_MULT)
        attacker.devastatorUsedThisFight = true
        attacker.stats.abilityProcs++
        this.emitCommentary(
          `${attacker.config.name} unleashes DEVASTATOR!`, 'action'
        )
      }
    }

    // Desperation bonus
    if (attacker.isDesperate) {
      damage = desperationDamage(damage)
    }

    // Exhaustion scaling
    damage = Math.max(1, Math.floor(damage * exhaustionMult))

    // 6. END mitigation
    if (attacker.abilities.tier2.relentless) {
      const { effectiveMitigation } = relentlessMitigation(
        defender.endMod, this.round
      )
      damage = Math.max(1, damage - effectiveMitigation)
    } else {
      damage = applyMitigation(damage, defender.endMod)
    }

    // Thick Skin (END T1)
    if (defender.abilities.tier1.thickSkin) {
      damage = Math.max(1, damage - THICK_SKIN_REDUCTION)
    }

    // 7. Block reduction
    if (reaction === 'block') {
      defender.stats.blocks++
      if (defender.blocksThisRound < BLOCK_CAP_PER_ROUND) {
        const { reduction, grindingDrain } = blockReduction(
          defender.endMod, defender.abilities.tier2.ironGuard, this.round
        )
        damage = Math.max(0, damage - reduction)
        if (grindingDrain > 0) {
          attacker.stamina = Math.max(0, attacker.stamina - grindingDrain)
          defender.stats.abilityProcs++
        }
        defender.blocksThisRound++
      }
    }

    // 8. Apply damage
    if (damage > 0) {
      defender.hp = Math.max(0, defender.hp - damage)
      attacker.stats.strikesLanded++
      attacker.stats.damageDealt += damage
      defender.stats.damageTaken += damage
      attacker.roundDamage[this.round] += damage
      attacker.roundStrikes[this.round]++

      // Commentary for significant hits
      if (isCrit) {
        this.emitCommentary(
          `CRITICAL HIT! ${attacker.config.name} lands a devastating ${attackType}!`,
          'action'
        )
      } else if (isPowerAttack(attackType) && damage >= 10) {
        this.emitCommentary(
          `${attacker.config.name} connects with a powerful ${attackType}!`,
          'action'
        )
      }
    }

    // 9. KO check
    if (defender.hp <= 0) {
      this.finishFight(attacker, defender, 'KO')
      return
    }

    // 10. TKO check
    if (checkTKO(defender.hp, this.round)) {
      this.finishFight(attacker, defender, 'TKO')
      return
    }

    // 11. Desperation check
    this.checkDesperationState(defender)
  }

  private resolveReaction(
    defender: InternalFighterState
  ): 'dodge' | 'block' | 'none' {
    const chance = effectiveReactionChance(
      defender.tecMod,
      defender.abilities.tier1.ringSense,
      defender.abilities.tier2.ironGuard,
      defender.abilities.tier3.mindReader,
      defender.abilities.tier3.ironMan
    )

    if (Math.random() >= chance) return 'none'

    // TEC-biased fighters dodge more, END-biased fighters block more
    const dodgeWeight = 50 + defender.tecMod * 10
    const blockWeight = 50 + defender.endMod * 10
    const total = dodgeWeight + blockWeight

    return Math.random() * total < dodgeWeight ? 'dodge' : 'block'
  }

  private resolveCounterPunch(
    counterPuncher: InternalFighterState,
    attacker: InternalFighterState
  ): void {
    if (counterPuncher.cpProcsThisRound >= CP_PROC_CAP_PER_ROUND) return

    const procRate = counterPunchRate(this.round)
    if (Math.random() >= procRate) {
      // Failed proc — stamina drain
      counterPuncher.stamina = Math.max(
        0, counterPuncher.stamina - CP_MISS_DRAIN
      )
      return
    }

    // CP proc — check if attacker catches it
    const catchRate = cpCatchRate(
      attacker.abilities.tier2.ironGuard,
      attacker.abilities.tier2.relentless,
      this.round
    )
    if (Math.random() < catchRate) return

    // CP lands
    counterPuncher.cpProcsThisRound++
    counterPuncher.stats.abilityProcs++

    const cpMult = counterPunchDamageMult(this.round)
    let damage = Math.max(
      1, Math.floor(rollDamage('cross', counterPuncher.powMod) * cpMult)
    )
    damage = applyMitigation(damage, attacker.endMod)
    damage = Math.max(1, damage)

    attacker.hp = Math.max(0, attacker.hp - damage)
    counterPuncher.stats.damageDealt += damage
    counterPuncher.stats.strikesLanded++
    attacker.stats.damageTaken += damage
    counterPuncher.roundDamage[this.round] += damage
    counterPuncher.roundStrikes[this.round]++

    this.emitCommentary(
      `${counterPuncher.config.name} fires back with a COUNTER PUNCH!`, 'action'
    )

    // KO/TKO check on original attacker
    if (attacker.hp <= 0) {
      this.finishFight(counterPuncher, attacker, 'KO')
    } else if (checkTKO(attacker.hp, this.round)) {
      this.finishFight(counterPuncher, attacker, 'TKO')
    }
  }

  private regenStamina(fighter: InternalFighterState): void {
    fighter.stamina = Math.min(
      fighter.maxStamina,
      fighter.stamina + fighter.staminaRegen
    )
  }

  private updateTempo(fighter: InternalFighterState): void {
    fighter.tempo = getCurrentTempo(
      fighter.stamina, fighter.maxStamina, this.round, fighter.isDesperate
    )
  }

  private checkDesperationState(fighter: InternalFighterState): void {
    if (!fighter.isDesperate && isDesperateHp(fighter.hp)) {
      fighter.isDesperate = true
      this.emitCommentary(
        `${fighter.config.name} enters DESPERATION MODE!`, 'system'
      )
    }
  }

  private buildRoundScore(): RoundScore {
    return {
      round: this.round + 1,
      fighter1Damage: this.f1.roundDamage[this.round],
      fighter2Damage: this.f2.roundDamage[this.round],
      fighter1Strikes: this.f1.roundStrikes[this.round],
      fighter2Strikes: this.f2.roundStrikes[this.round],
      winner: roundWinner(
        this.f1.roundDamage[this.round], this.f2.roundDamage[this.round]
      ),
    }
  }

  /**
   * End-of-round processing: score the round, calculate HP recovery (base rate +
   * trailing bonus + END modifier * condition), refill stamina, and transition
   * to repricing phase.
   */
  private endRound(): void {
    const score = this.buildRoundScore()
    this.roundScores.push(score)

    this.callbacks.onRoundEnd?.(this.round + 1, score)
    this.emitCommentary(`End of Round ${this.round + 1}!`, 'system')

    // Calculate and apply recovery
    const f1Trailing =
      this.f1.roundDamage[this.round] < this.f2.roundDamage[this.round]
    const f2Trailing =
      this.f2.roundDamage[this.round] < this.f1.roundDamage[this.round]

    const f1Total = recoveryHp(
      this.round, f1Trailing, this.f1.endMod, this.f1.config.condition
    )
    const f2Total = recoveryHp(
      this.round, f2Trailing, this.f2.endMod, this.f2.config.condition
    )

    const f1HpBefore = this.f1.hp
    const f2HpBefore = this.f2.hp
    this.f1.hp = Math.min(FIGHTER_MAX_HP, this.f1.hp + f1Total)
    this.f2.hp = Math.min(FIGHTER_MAX_HP, this.f2.hp + f2Total)

    // Recovery breakdown for UI
    const baseRate = RECOVERY_RATES[this.round] * FIGHTER_MAX_HP
    this.lastRecovery = {
      fighter1: {
        base: baseRate,
        trailing: f1Trailing ? RECOVERY_TRAILING_BONUS * FIGHTER_MAX_HP : 0,
        endBonus: this.f1.endMod * RECOVERY_END_MOD_MULT * FIGHTER_MAX_HP,
        total: f1Total,
        hpBefore: f1HpBefore,
        hpAfter: this.f1.hp,
      },
      fighter2: {
        base: baseRate,
        trailing: f2Trailing ? RECOVERY_TRAILING_BONUS * FIGHTER_MAX_HP : 0,
        endBonus: this.f2.endMod * RECOVERY_END_MOD_MULT * FIGHTER_MAX_HP,
        total: f2Total,
        hpBefore: f2HpBefore,
        hpAfter: this.f2.hp,
      },
      roundWinner: score.winner,
    }

    // Refill stamina
    this.f1.stamina = this.f1.maxStamina
    this.f2.stamina = this.f2.maxStamina

    this.transitionTo('repricing')
  }

  private advanceRound(): void {
    // Reset per-round counters
    this.f1.blocksThisRound = 0
    this.f2.blocksThisRound = 0
    this.f1.cpProcsThisRound = 0
    this.f2.cpProcsThisRound = 0

    this.round++
    this.clockSeconds = ROUND_SECONDS

    this.callbacks.onRepricingEnd?.(this.round + 1)
    this.emitCommentary(`Round ${this.round + 1} — FIGHT!`, 'system')
    this.transitionTo('fighting')
  }

  private finishFight(
    winner: InternalFighterState,
    loser: InternalFighterState,
    method: FinishMethod
  ): void {
    if (this.result) return

    this.result = {
      winnerId: winner.id,
      loserId: loser.id,
      method,
      round: this.round + 1,
      time: ROUND_SECONDS - this.clockSeconds,
      fighter1Stats: { ...this.f1.stats },
      fighter2Stats: { ...this.f2.stats },
      roundScores: [...this.roundScores],
    }

    this.emitCommentary(
      `${method}! ${winner.config.name} wins in Round ${this.round + 1}!`,
      'system'
    )
    this.callbacks.onFightEnd?.(this.result)
    this.transitionTo('finish')
  }

  private scoreDecisionInternal(): void {
    const score = this.buildRoundScore()
    this.roundScores.push(score)

    const winnerId = scoreDecision(
      this.f1.roundDamage, this.f2.roundDamage, this.f1.hp, this.f2.hp
    )
    const winner = winnerId === 1 ? this.f1 : this.f2
    const loser = winnerId === 1 ? this.f2 : this.f1

    this.finishFight(winner, loser, 'Decision')
  }

  private toPublicState(): V13FightState {
    return {
      phase: this.phase,
      round: this.round + 1,
      clock: this.clockSeconds,
      tick: this.tickCount,
      fighter1: toPublicFighterState(this.f1),
      fighter2: toPublicFighterState(this.f2),
      repricingTimer: this.phase === 'repricing' ? this.phaseTimer : 0,
      preFightTimer: this.phase === 'pre_fight' ? this.phaseTimer : 0,
      finishMethod: this.result?.method,
      roundScores: [...this.roundScores],
      lastRecovery: this.lastRecovery,
      result: this.result ? { ...this.result } : undefined,
    }
  }

  private emitState(): void {
    this.callbacks.onStateUpdate?.(this.toPublicState())
  }

  private emitCommentary(
    text: string,
    type: 'action' | 'analysis' | 'system'
  ): void {
    this.callbacks.onCommentary?.(text, type)
  }
}
