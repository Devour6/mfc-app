// scripts/mc/engine.ts
// Combat simulation engine — extracted from monte-carlo-v13.ts.
// Agents never read this file. All tuneable constants live in config.ts.

import {
  COMBAT, TKO, DESPERATION, RECOVERY, STAMINA_COSTS, ABILITIES,
  TEMPO, CONDITION_MULTS, TIER_THRESHOLDS, EXHAUSTION,
  DAMAGE_DICE, POWER_ATTACKS, GEAR_TIER_BONUSES,
} from './config'

// ─── Types ──────────────────────────────────────────────────────────────────

type AttackType = keyof typeof DAMAGE_DICE
type Condition = 'fresh' | 'normal' | 'tired'

const POWER_ATTACKS_SET = new Set(POWER_ATTACKS)

const TICKS_PER_ROUND = COMBAT.TICKS_PER_SECOND * COMBAT.ROUND_SECONDS

const NO_GEAR: GearLoadout = { pieces: [] }

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface FighterStats {
  pow: number  // Power: damage
  end: number  // Endurance: stamina/mitigation
  tec: number  // Technique: accuracy/crits/ability effectiveness
}

interface GearEffect {
  slot: 'gloves' | 'headgear' | 'body' | 'boots'
  tier: 'standard' | 'enhanced' | 'superior' | 'legendary'
  name: string
  // Stat bonuses (applied to fighter)
  primaryBonus: number
  secondaryBonus: number
  primaryStat: 'pow' | 'end' | 'tec'
  secondaryStat?: 'pow' | 'end' | 'tec'
}

interface GearLoadout {
  pieces: GearEffect[]
}

interface FighterConfig {
  stats: FighterStats
  gear?: GearLoadout
  condition?: Condition
}

// ─── Per-round tracking for round-by-round analysis ─────────────────────────

interface RoundData {
  damageDealt: number
  damageTaken: number
  strikesLanded: number
  strikesMissed: number
  abilityProcs: number
  endTempoPercent: number
  endStaminaPercent: number
  endHpPercent: number
}

function emptyRoundData(): RoundData {
  return {
    damageDealt: 0, damageTaken: 0, strikesLanded: 0, strikesMissed: 0,
    abilityProcs: 0, endTempoPercent: 1.0, endStaminaPercent: 1.0, endHpPercent: 1.0,
  }
}

interface TechStats {
  // Relentless (Pressure)
  relentlessBypassDamage: number
  relentlessBypassProcs: number
  // Iron Guard (Turtle)
  ironGuardBlocks: number
  ironGuardCPCatches: number
  grindingGuardDrain: number
  blockCapHits: number
  // Counter Punch (Counter)
  cpDodges: number
  cpProcs: number
  cpProcDamage: number
  cpMissDrains: number
  cpMissStamDrained: number
  // Desperation
  desperationActivations: number
  desperationKOs: number
  // Signatures
  devastatorTriggers: number
  devastatorRolls: number
  devastatorMissPenalties: number  // -2 stam on power attack miss
  ironManRounds: number
  mindReaderReactions: number
  mindReaderStaminaDrain: number  // extra stam cost per reaction
  // Gear passives
  gearPassiveFires: number
  gearPassiveDamage: number
  // General
  totalBlocksDone: number
  totalDodgesDone: number
  decisionsWon: number
}

function emptyTechStats(): TechStats {
  return {
    relentlessBypassDamage: 0, relentlessBypassProcs: 0,
    ironGuardBlocks: 0, ironGuardCPCatches: 0, grindingGuardDrain: 0, blockCapHits: 0,
    cpDodges: 0, cpProcs: 0, cpProcDamage: 0, cpMissDrains: 0, cpMissStamDrained: 0,
    desperationActivations: 0, desperationKOs: 0,
    devastatorTriggers: 0, devastatorRolls: 0, devastatorMissPenalties: 0,
    ironManRounds: 0, mindReaderReactions: 0, mindReaderStaminaDrain: 0,
    gearPassiveFires: 0, gearPassiveDamage: 0,
    totalBlocksDone: 0, totalDodgesDone: 0, decisionsWon: 0,
  }
}

// ─── Fighter State ──────────────────────────────────────────────────────────

interface FighterState {
  stats: FighterStats
  effectiveStats: FighterStats  // After gear bonuses
  hp: number
  stamina: number
  maxStamina: number
  staminaRegen: number  // per tick
  // Modifiers from stats
  powMod: number   // damage modifier
  endMod: number   // mitigation modifier
  tecMod: number   // accuracy/crit modifier
  // Derived
  baseAccuracy: number    // base hit chance
  critChance: number      // base crit chance
  reactionChance: number  // dodge/block chance
  // Tier abilities
  hasTier1: { heavyHands: boolean; thickSkin: boolean; ringSense: boolean }
  hasTier2: { relentless: boolean; ironGuard: boolean; counterPunch: boolean }
  hasTier3: { devastator: boolean; ironMan: boolean; mindReader: boolean }
  // Combat state
  totalDamageDealt: number
  strikesLanded: number
  strikesMissed: number
  critsLanded: number
  desperationActive: boolean
  roundDamage: number[]  // damage dealt per round [R1, R2, R3]
  roundData: RoundData[] // detailed per-round tracking
  blocksThisRound: number
  tech: TechStats
  // Gear state
  gear: GearLoadout
  gearUsedThisFight: Set<string>
  gearUsedThisRound: Set<string>
  // Signature state
  devastatorUsedThisFight: boolean
  exhaustionTable: number[]  // [1.0, 0.91, 0.82]
  cpProcsThisRound: number
}

// ─── Core Math ──────────────────────────────────────────────────────────────

function rollDie(sides: number): number { return Math.floor(Math.random() * sides) + 1 }
function rollD20(): number { return rollDie(20) }

function statToModifier(stat: number): number {
  return Math.max(-3, Math.min(3, Math.round((Math.max(0, Math.min(100, stat)) - 50) / 15)))
}

// Diminishing returns: each stat point above 80 counts as 0.5 for combat calcs.
// Stat 95 -> 87.5 effective. Still qualifies for tier 3 at natural 90+.
function effectiveCombatStat(stat: number): number {
  if (stat <= 80) return stat
  return 80 + (stat - 80) * 0.5
}

function computeMaxStamina(end: number, endMod: number): number {
  // Base 100 + END modifier scaling. Compressed range so R1 Tempo starts closer.
  return 100 + (end - 50) * 0.8 + endMod * 5
}

function computeStaminaRegen(end: number): number {
  // Per-tick regen. Higher END = faster regen.
  return 0.3 + (end - 50) / 200
}

// ─── Tempo System ───────────────────────────────────────────────────────────
// Tempo = base_tempo × (current_stamina / max_stamina)
// Determines action rate (ticks between actions).
// Reactions (dodge/block) are NOT limited by Tempo.

function getCurrentTempo(f: FighterState, round: number): number {
  const staminaRatio = Math.max(0.1, f.stamina / f.maxStamina)
  let tempo = COMBAT.BASE_TEMPO * staminaRatio

  // Tempo warm-up: clamp to floor for this round
  const tempoFloor = TEMPO.FLOOR_BY_ROUND[round] * COMBAT.BASE_TEMPO
  tempo = Math.max(tempoFloor, tempo)

  // Desperation: Tempo floor at 70% of base
  if (f.desperationActive) {
    tempo = Math.max(DESPERATION.TEMPO_FLOOR * COMBAT.BASE_TEMPO, tempo)
  }

  return tempo
}

function tempoToActionRate(tempo: number): number {
  // Convert tempo (0-100) to probability of acting per tick
  // At tempo 100: ~0.055 (acts frequently)
  // At tempo 50: ~0.028 (half speed)
  // At tempo 30: ~0.017 (very slow)
  return TEMPO.ACTION_RATE_COEFF * tempo
}

// ─── Fighter Creation ───────────────────────────────────────────────────────

function createFighter(config: FighterConfig): FighterState {
  const { stats } = config
  const gear = config.gear ?? NO_GEAR
  const condition = config.condition ?? 'normal'

  // Apply gear stat bonuses (natural + gear = effective for tier qualifying)
  const effectiveStats = { ...stats }
  for (const piece of gear.pieces) {
    effectiveStats[piece.primaryStat] += piece.primaryBonus
    if (piece.secondaryStat) {
      effectiveStats[piece.secondaryStat] += piece.secondaryBonus
    }
  }

  // Tier abilities use NATURAL stats only — gear doesn't qualify for ability tiers
  const hasTier1 = {
    heavyHands: stats.pow >= TIER_THRESHOLDS.tier1,
    thickSkin: stats.end >= TIER_THRESHOLDS.tier1,
    ringSense: stats.tec >= TIER_THRESHOLDS.tier1,
  }
  const hasTier2 = {
    relentless: stats.pow >= TIER_THRESHOLDS.tier2,
    ironGuard: stats.end >= TIER_THRESHOLDS.tier2,
    counterPunch: stats.tec >= TIER_THRESHOLDS.tier2,
  }
  const hasTier3 = {
    devastator: stats.pow >= TIER_THRESHOLDS.tier3,
    ironMan: stats.end >= TIER_THRESHOLDS.tier3,
    mindReader: stats.tec >= TIER_THRESHOLDS.tier3,
  }

  // Combat stats: apply diminishing returns above 80 (0.5x per point)
  const combatStats: FighterStats = {
    pow: effectiveCombatStat(effectiveStats.pow),
    end: effectiveCombatStat(effectiveStats.end),
    tec: effectiveCombatStat(effectiveStats.tec),
  }

  // Apply condition
  const condMult = CONDITION_MULTS[condition]
  const condTempoMult = condMult.tempo
  const condStaminaMult = condMult.stamina
  const condRecoveryMult = condMult.recovery

  // All combat modifiers derived from diminished combatStats
  const powMod = statToModifier(combatStats.pow)
  const endMod = statToModifier(combatStats.end)
  const tecMod = statToModifier(combatStats.tec)

  const maxStamina = computeMaxStamina(combatStats.end, endMod) * condStaminaMult
  const staminaRegen = computeStaminaRegen(combatStats.end) * condRecoveryMult

  // Accuracy: base 55% + TEC modifier × 5%
  const baseAccuracy = 0.55 + tecMod * 0.05

  // Crit: base 5% + TEC modifier × 2.5%
  const critChance = Math.max(0.02, 0.05 + tecMod * 0.025)

  // Reaction: base 15% + TEC modifier × 5%
  let reactionChance = Math.max(0.05, Math.min(0.45, 0.15 + tecMod * 0.05))

  // Tier 1 bonuses
  if (hasTier1.ringSense) reactionChance = Math.min(0.40, reactionChance + 0.03)

  // Iron Guard reaction bonus (+8% — trained defensive instincts)
  if (hasTier2.ironGuard) reactionChance = Math.min(0.40, reactionChance + 0.08)

  // Tier 3: Mind Reader — enhanced reactions
  if (hasTier3.mindReader) reactionChance = Math.min(0.50, reactionChance + 0.10)

  // Tier 3 cost: Iron Man — too tough to be agile (-10% dodge/block reaction)
  if (hasTier3.ironMan) reactionChance = Math.max(0.05, reactionChance - 0.10)

  return {
    stats, effectiveStats: combatStats,  // Store combat-diminished stats for action selection
    hp: COMBAT.FIGHTER_MAX_HP,
    stamina: maxStamina, maxStamina, staminaRegen,
    powMod, endMod, tecMod,
    baseAccuracy, critChance, reactionChance,
    hasTier1, hasTier2, hasTier3,
    totalDamageDealt: 0, strikesLanded: 0, strikesMissed: 0, critsLanded: 0,
    desperationActive: false,
    roundDamage: [0, 0, 0],
    roundData: [emptyRoundData(), emptyRoundData(), emptyRoundData()],
    blocksThisRound: 0,
    tech: emptyTechStats(),
    gear, gearUsedThisFight: new Set(), gearUsedThisRound: new Set(),
    devastatorUsedThisFight: false,
    exhaustionTable: hasTier3.ironMan ? EXHAUSTION.IRON_MAN : EXHAUSTION.BASELINE,
    cpProcsThisRound: 0,
  }
}

// ─── Action Selection ───────────────────────────────────────────────────────

function selectAction(f: FighterState): AttackType | 'dodge' | 'block' | 'move' {
  // Weight toward power attacks for high-POW, conservative for high-END
  const powBias = f.effectiveStats.pow / 100
  const endBias = f.effectiveStats.end / 100

  const weights: Record<string, number> = {
    jab: 25 * (1 + (1 - powBias) * 0.3),
    cross: 20,
    hook: 12 * (1 + powBias * 0.5),
    uppercut: 6 * (1 + powBias * 0.8),
    roundhouse: 4 * (1 + powBias * 0.8),
    combo: f.stamina >= STAMINA_COSTS.combo ? 5 * (1 + powBias * 0.5) : 0,
    dodge: 5 * (1 + (1 - powBias) * 0.3),
    block: 5 * (1 + endBias * 0.5),
    move: 3,
  }

  // Iron Guard fighters block more
  if (f.hasTier2.ironGuard && f.blocksThisRound < ABILITIES.BLOCK_CAP_PER_ROUND) {
    weights.block *= 1.5
  }

  const affordable = Object.entries(weights).filter(([action]) => {
    const cost = STAMINA_COSTS[action] ?? 0
    return f.stamina >= cost
  })
  if (affordable.length === 0) return 'move'

  const total = affordable.reduce((sum, [, w]) => sum + w, 0)
  let roll = Math.random() * total
  for (const [action, w] of affordable) {
    roll -= w
    if (roll <= 0) return action as AttackType | 'dodge' | 'block' | 'move'
  }
  return 'jab'
}

// ─── Relentless — Bypass END mitigation ─────────────────────────────────────

function getRelentlessBypass(round: number): number {
  // Fraction of endMod mitigation bypassed. Scales with ability ramp.
  // R1: 42%, R2: 55%, R3: 76%
  return Math.min(1.0, ABILITIES.RELENTLESS_BYPASS_BASE * COMBAT.ABILITY_RAMP[round])
}

// ─── Iron Guard — CP Catch Rate ─────────────────────────────────────────────

function getIronGuardCPCatchRate(round: number): number {
  // 55% base, scaling with ability ramp, capped at 70%
  return Math.min(ABILITIES.IRON_GUARD_CP_CATCH_CAP, ABILITIES.IRON_GUARD_CP_CATCH_BASE * COMBAT.ABILITY_RAMP[round])
}

// ─── Counter Punch — Proc on dodge ──────────────────────────────────────────

function getCPProcRate(round: number): number {
  // R1: 21.5%. R2: 28%. R3: 38.7%.
  return ABILITIES.CP_PROC_RATE_BASE * COMBAT.ABILITY_RAMP[round]
}

function getCPDamageMultiplier(round: number): number {
  // Damage scales with ramp
  return COMBAT.ABILITY_RAMP[round]
}

// ─── Attack Resolution ──────────────────────────────────────────────────────

interface AttackResult {
  hit: boolean
  damage: number
  isCrit: boolean
  counterPunchDamage: number
  wasBlocked: boolean
  bypassDamage: number  // Relentless bypass
}

function resolveAttack(
  attacker: FighterState,
  defender: FighterState,
  attackType: AttackType,
  round: number,  // 0-indexed
): AttackResult {
  let counterPunchDamage = 0
  let wasBlocked = false
  let bypassDamage = 0

  // Defender reaction (NOT limited by Tempo)
  const defenderReacts = Math.random() < defender.reactionChance
  if (defender.hasTier3.mindReader && defenderReacts) {
    defender.tech.mindReaderReactions++
    // Tier 3 cost: Mind Reader reactions drain 1 extra stamina (mental fatigue)
    defender.stamina = Math.max(0, defender.stamina - 1)
    defender.tech.mindReaderStaminaDrain++
  }

  let reactionType: 'dodge' | 'block' | null = null
  if (defenderReacts) {
    const isPower = POWER_ATTACKS_SET.has(attackType)
    // Counter fighters prefer dodge (for CP), Turtle fighters prefer block
    if (defender.hasTier2.counterPunch) {
      reactionType = 'dodge'  // Always dodge to trigger CP
    } else if (defender.hasTier2.ironGuard && !isPower && defender.blocksThisRound < ABILITIES.BLOCK_CAP_PER_ROUND) {
      reactionType = 'block'
    } else {
      reactionType = isPower ? 'dodge' : (Math.random() < 0.5 ? 'dodge' : 'block')
    }

    // Check block cap
    if (reactionType === 'block' && defender.blocksThisRound >= ABILITIES.BLOCK_CAP_PER_ROUND) {
      reactionType = 'dodge'  // Forced to dodge after block cap
      defender.tech.blockCapHits++
    }

    const reactionCost = reactionType === 'dodge' ? STAMINA_COSTS.dodge : STAMINA_COSTS.block
    if (defender.stamina >= reactionCost) {
      defender.stamina -= reactionCost
    } else {
      reactionType = null  // Can't afford reaction
    }
  }

  // Dodge resolution
  if (reactionType === 'dodge') {
    defender.tech.totalDodgesDone++
    // Dodge = attack misses. Check Counter Punch proc.
    if (defender.hasTier2.counterPunch) {
      defender.tech.cpDodges++
      // CP proc cap per round
      if (defender.cpProcsThisRound >= ABILITIES.CP_PROC_CAP_PER_ROUND) {
        // Hit cap — still dodge, but no CP attempt, no miss drain
        return { hit: false, damage: 0, isCrit: false, counterPunchDamage: 0, wasBlocked: false, bypassDamage: 0 }
      }
      const cpRate = getCPProcRate(round)
      if (Math.random() < cpRate) {
        // CP procs! Auto-hit, TEC-scaled damage.
        // Check catch: Iron Guard overrides to 55-70%.
        // Non-Relentless fighters have 30% base catch (cover up).
        // Relentless fighters are too aggressive to cover up (0% catch).
        let catchRate: number
        if (attacker.hasTier2.ironGuard) {
          catchRate = getIronGuardCPCatchRate(round)  // 55-70%, overrides base
        } else if (attacker.hasTier2.relentless) {
          catchRate = 0  // Relentless = no covering up
        } else {
          catchRate = ABILITIES.BASE_CP_CATCH  // Non-specialist catch rate
        }
        if (Math.random() < catchRate) {
          if (attacker.hasTier2.ironGuard) attacker.tech.ironGuardCPCatches++
          // Caught! No damage.
        } else {
          // CP lands
          const cpBaseDmg = rollDie(8) + rollDie(8) + defender.tecMod
          const cpMult = getCPDamageMultiplier(round)
          counterPunchDamage = Math.max(1, Math.floor(cpBaseDmg * cpMult))
          defender.tech.cpProcs++
          defender.tech.cpProcDamage += counterPunchDamage
          defender.cpProcsThisRound++
        }
      } else {
        // CP didn't proc — miss drain
        defender.stamina = Math.max(0, defender.stamina - ABILITIES.CP_MISS_DRAIN)
        defender.tech.cpMissDrains++
        defender.tech.cpMissStamDrained += ABILITIES.CP_MISS_DRAIN
      }
    }
    // Tier 3 cost: Devastator — power attacks that miss cost -3 extra stamina (overcommitting)
    if (attacker.hasTier3.devastator && POWER_ATTACKS_SET.has(attackType)) {
      attacker.stamina = Math.max(0, attacker.stamina - 3)
      attacker.tech.devastatorMissPenalties++
    }
    return { hit: false, damage: 0, isCrit: false, counterPunchDamage, wasBlocked: false, bypassDamage: 0 }
  }

  // Hit check (accuracy roll)
  let accuracy = attacker.baseAccuracy
  if (attacker.desperationActive) accuracy += DESPERATION.ACCURACY_PENALTY

  const hit = Math.random() < accuracy
  if (!hit) {
    // Tier 3 cost: Devastator — power attacks that miss cost -3 extra stamina
    if (attacker.hasTier3.devastator && POWER_ATTACKS_SET.has(attackType)) {
      attacker.stamina = Math.max(0, attacker.stamina - 3)
      attacker.tech.devastatorMissPenalties++
    }
    return { hit: false, damage: 0, isCrit: false, counterPunchDamage: 0, wasBlocked: false, bypassDamage: 0 }
  }

  // Crit check
  let effectiveCrit = attacker.critChance
  if (attacker.desperationActive) effectiveCrit += DESPERATION.CRIT_BONUS
  const isCrit = Math.random() < effectiveCrit

  // Damage calculation
  const dice = DAMAGE_DICE[attackType]
  let baseDamage = 0
  for (let i = 0; i < dice.count; i++) {
    baseDamage += rollDie(dice.sides)
  }

  // Crit doubles damage dice
  if (isCrit) baseDamage *= 2

  // POW modifier
  let totalDamage = baseDamage + attacker.powMod

  // Tier 3 cost: Mind Reader — reads over power (-1 base damage)
  if (attacker.hasTier3.mindReader) totalDamage = Math.max(1, totalDamage - 1)

  // Tier 1: Heavy Hands (+1 on power attacks)
  if (attacker.hasTier1.heavyHands && POWER_ATTACKS_SET.has(attackType)) {
    totalDamage += 1
  }

  // Desperation damage bonus
  if (attacker.desperationActive) {
    totalDamage = Math.floor(totalDamage * (1 + DESPERATION.DAMAGE_BONUS))
  }

  // Tier 3: Devastator — exploding dice on natural crits (power attacks)
  if (isCrit && attacker.hasTier3.devastator && POWER_ATTACKS_SET.has(attackType) && !attacker.devastatorUsedThisFight) {
    attacker.tech.devastatorRolls++
    if (rollDie(6) >= 5) {  // ~33% trigger on crit
      totalDamage = Math.floor(totalDamage * 1.5)  // 50% bonus on top of crit
      attacker.devastatorUsedThisFight = true
      attacker.tech.devastatorTriggers++
    }
  }

  // ─── Mitigation ───
  // Per-hit END mitigation: endMod (0-3) reduced from each hit.
  // Relentless: (1) bypasses a FRACTION of mitigation scaling with ramp,
  //             (2) adds +1 flat damage on ALL hits (vs Hybrid/low-END).
  // This is how P beats T (bypass) and P beats Hybrid (+1 flat).

  const mitigation = Math.max(0, defender.endMod)
  if (attacker.hasTier2.relentless) {
    const bypassFraction = getRelentlessBypass(round)
    // Relentless value: bypass OR +1 flat, whichever is higher (floor, not additive).
    // vs Turtle (endMod=2): bypass = 0.84-1.52, floor rarely matters (bypass is the star)
    // vs Hybrid (endMod=1): bypass = 0.42-0.76, floor kicks in (+1 is the value)
    // vs Counter (endMod=0): bypass = 0, floor gives +1 guaranteed
    const rawBypass = mitigation * bypassFraction
    bypassDamage = Math.max(1, rawBypass)  // Floor of +1
    const effectiveMitigation = Math.max(0, mitigation - bypassDamage)
    totalDamage = Math.max(1, totalDamage - effectiveMitigation)
    attacker.tech.relentlessBypassDamage += bypassDamage
    attacker.tech.relentlessBypassProcs++
  } else {
    totalDamage = Math.max(1, totalDamage - mitigation)
  }

  // Block reduction
  if (reactionType === 'block') {
    wasBlocked = true
    defender.blocksThisRound++
    defender.tech.totalBlocksDone++

    let blockReduction = rollDie(6) + defender.endMod
    if (defender.hasTier2.ironGuard) {
      // Doubled block reduction
      blockReduction = (rollDie(6) + rollDie(6)) + defender.endMod * 2
      defender.tech.ironGuardBlocks++

      // Grinding Guard: drain attacker stamina (scales with ability ramp)
      const drain = Math.floor(ABILITIES.GRINDING_GUARD_DRAIN * COMBAT.ABILITY_RAMP[round])
      attacker.stamina = Math.max(0, attacker.stamina - drain)
      defender.tech.grindingGuardDrain += drain
    }

    totalDamage = Math.max(1, totalDamage - blockReduction)
  }

  // Relentless vs blocks: Pressure's damage also partially bypasses block reduction
  // (ability ramp makes block bypass more effective in later rounds)
  if (attacker.hasTier2.relentless && wasBlocked) {
    const bypassPct = getRelentlessBypass(round)
    const blockBypass = Math.floor(baseDamage * bypassPct)
    totalDamage = Math.max(1, totalDamage + blockBypass)
    attacker.tech.relentlessBypassDamage += blockBypass
  }

  // Iron Man (END 95): diminishing damage reduction per round
  // Already handled via exhaustion table

  // Desperation vulnerability: desperate fighters take +15% more damage (glass cannon)
  if (defender.desperationActive) {
    totalDamage = Math.floor(totalDamage * (1 + DESPERATION.VULNERABILITY))
  }
  // Also apply vulnerability to CP damage if attacker is desperate
  if (attacker.desperationActive && counterPunchDamage > 0) {
    counterPunchDamage = Math.floor(counterPunchDamage * (1 + DESPERATION.VULNERABILITY))
  }

  return { hit: true, damage: Math.max(1, totalDamage), isCrit, counterPunchDamage, wasBlocked, bypassDamage }
}

// ─── Fight Simulation ───────────────────────────────────────────────────────

interface FightResult {
  winner: 1 | 2
  method: 'KO' | 'TKO' | 'Decision'
  rounds: number
  endRound: number  // which round fight ended in (1-indexed)
  fighter1: FighterState
  fighter2: FighterState
  totalTicks: number
  // Per-round winner tracking (for round-by-round analysis)
  roundWinners: (1 | 2 | 0)[]  // who dealt more damage each round (0 = tie)
}

function simulateFight(config1: FighterConfig, config2: FighterConfig): FightResult {
  const f1 = createFighter(config1)
  const f2 = createFighter(config2)

  let totalTicks = 0
  const roundWinners: (1 | 2 | 0)[] = []

  for (let round = 0; round < COMBAT.MAX_ROUNDS; round++) {
    let roundTick = 0
    f1.blocksThisRound = 0
    f2.blocksThisRound = 0
    f1.cpProcsThisRound = 0
    f2.cpProcsThisRound = 0
    f1.gearUsedThisRound = new Set()
    f2.gearUsedThisRound = new Set()

    // Exhaustion multiplier for this round
    const f1Exhaust = f1.exhaustionTable[round]
    const f2Exhaust = f2.exhaustionTable[round]
    if (f1.hasTier3.ironMan && round > 0) f1.tech.ironManRounds++
    if (f2.hasTier3.ironMan && round > 0) f2.tech.ironManRounds++

    while (roundTick < TICKS_PER_ROUND) {
      roundTick++
      totalTicks++

      // Process each fighter
      for (const [attacker, defender, isF1] of [[f1, f2, true], [f2, f1, false]] as [FighterState, FighterState, boolean][]) {
        if (defender.hp <= 0 || attacker.hp <= 0) continue

        // Tempo-based action rate
        const tempo = getCurrentTempo(attacker, round)
        const actionRate = tempoToActionRate(tempo) * (isF1 ? f1Exhaust : f2Exhaust)

        if (Math.random() > actionRate) continue

        // Select action
        const action = selectAction(attacker)

        if (action === 'move') continue
        if (action === 'dodge' || action === 'block') {
          const cost = STAMINA_COSTS[action] ?? 0
          if (attacker.stamina >= cost) attacker.stamina -= cost
          continue
        }

        // Attack
        const cost = STAMINA_COSTS[action] ?? 0
        if (attacker.stamina < cost) continue
        attacker.stamina -= cost

        const result = resolveAttack(attacker, defender, action, round)

        // Apply CP damage to attacker
        if (result.counterPunchDamage > 0) {
          attacker.hp = Math.max(0, attacker.hp - result.counterPunchDamage)
          defender.totalDamageDealt += result.counterPunchDamage
          defender.roundDamage[round] += result.counterPunchDamage
          defender.roundData[round].damageDealt += result.counterPunchDamage
          defender.roundData[round].abilityProcs++
          defender.strikesLanded++
          attacker.roundData[round].damageTaken += result.counterPunchDamage

          if (attacker.hp <= 0) {
            const winner: 1 | 2 = isF1 ? 2 : 1
            if (attacker.desperationActive) defender.tech.desperationKOs++
            return { winner, method: 'KO', rounds: round + 1, endRound: round + 1, fighter1: f1, fighter2: f2, totalTicks, roundWinners }
          }

          // Check Desperation trigger from CP damage
          if (attacker.hp < COMBAT.FIGHTER_MAX_HP * DESPERATION.HP_PCT && !attacker.desperationActive) {
            attacker.desperationActive = true
            attacker.tech.desperationActivations++
          }
        }

        if (result.hit) {
          attacker.strikesLanded++
          if (result.isCrit) attacker.critsLanded++
          attacker.totalDamageDealt += result.damage
          attacker.roundDamage[round] += result.damage
          attacker.roundData[round].damageDealt += result.damage
          attacker.roundData[round].strikesLanded++
          defender.hp = Math.max(0, defender.hp - result.damage)
          defender.roundData[round].damageTaken += result.damage

          if (result.bypassDamage > 0) {
            attacker.roundData[round].abilityProcs++
          }

          // KO check
          if (defender.hp <= 0) {
            const winner: 1 | 2 = isF1 ? 1 : 2
            if (defender.desperationActive) attacker.tech.desperationKOs++
            return { winner, method: 'KO', rounds: round + 1, endRound: round + 1, fighter1: f1, fighter2: f2, totalTicks, roundWinners }
          }

          // TKO check
          if (defender.hp < COMBAT.FIGHTER_MAX_HP * TKO.HP_THRESHOLD) {
            const tkoRoll = rollD20()
            if (tkoRoll <= TKO.D20_THRESHOLDS[round]) {
              const winner: 1 | 2 = isF1 ? 1 : 2
              return { winner, method: 'TKO', rounds: round + 1, endRound: round + 1, fighter1: f1, fighter2: f2, totalTicks, roundWinners }
            }
          }

          // Desperation check
          if (defender.hp < COMBAT.FIGHTER_MAX_HP * DESPERATION.HP_PCT && !defender.desperationActive) {
            defender.desperationActive = true
            defender.tech.desperationActivations++
          }
        } else {
          attacker.strikesMissed++
          attacker.roundData[round].strikesMissed++
        }
      }

      // Stamina regen per tick
      f1.stamina = Math.min(f1.maxStamina, f1.stamina + f1.staminaRegen)
      f2.stamina = Math.min(f2.maxStamina, f2.stamina + f2.staminaRegen)
    }

    // End of round — record round data
    f1.roundData[round].endTempoPercent = getCurrentTempo(f1, round) / COMBAT.BASE_TEMPO
    f2.roundData[round].endTempoPercent = getCurrentTempo(f2, round) / COMBAT.BASE_TEMPO
    f1.roundData[round].endStaminaPercent = f1.stamina / f1.maxStamina
    f2.roundData[round].endStaminaPercent = f2.stamina / f2.maxStamina
    f1.roundData[round].endHpPercent = f1.hp / COMBAT.FIGHTER_MAX_HP
    f2.roundData[round].endHpPercent = f2.hp / COMBAT.FIGHTER_MAX_HP

    // Track round winner
    if (f1.roundDamage[round] > f2.roundDamage[round]) roundWinners.push(1)
    else if (f2.roundDamage[round] > f1.roundDamage[round]) roundWinners.push(2)
    else roundWinners.push(0)

    // Between-round recovery (not after R3)
    if (round < COMBAT.MAX_ROUNDS - 1) {
      for (const [fighter, opponent] of [[f1, f2], [f2, f1]] as [FighterState, FighterState][]) {
        let recovery = RECOVERY.RATES[round] * COMBAT.FIGHTER_MAX_HP

        // Trailing bonus
        if (fighter.roundDamage[round] < opponent.roundDamage[round]) {
          recovery += RECOVERY.TRAILING_BONUS * COMBAT.FIGHTER_MAX_HP
        }

        // END modifier bonus
        recovery += fighter.endMod * 0.02 * COMBAT.FIGHTER_MAX_HP

        fighter.hp = Math.min(COMBAT.FIGHTER_MAX_HP, fighter.hp + recovery)
      }
    }
  }

  // Decision — weighted cumulative damage
  const f1WeightedDmg = f1.roundDamage[0] * COMBAT.DECISION_WEIGHTS[0] +
                         f1.roundDamage[1] * COMBAT.DECISION_WEIGHTS[1] +
                         f1.roundDamage[2] * COMBAT.DECISION_WEIGHTS[2]
  const f2WeightedDmg = f2.roundDamage[0] * COMBAT.DECISION_WEIGHTS[0] +
                         f2.roundDamage[1] * COMBAT.DECISION_WEIGHTS[1] +
                         f2.roundDamage[2] * COMBAT.DECISION_WEIGHTS[2]

  let winner: 1 | 2
  if (f1WeightedDmg > f2WeightedDmg) {
    winner = 1
    f1.tech.decisionsWon++
  } else if (f2WeightedDmg > f1WeightedDmg) {
    winner = 2
    f2.tech.decisionsWon++
  } else {
    // Tiebreaker: remaining HP
    winner = f1.hp >= f2.hp ? 1 : 2
  }

  return { winner, method: 'Decision', rounds: COMBAT.MAX_ROUNDS, endRound: COMBAT.MAX_ROUNDS, fighter1: f1, fighter2: f2, totalTicks, roundWinners }
}

// ─── Simulation Harness ─────────────────────────────────────────────────────

interface SimResult {
  f1WinRate: number
  avgRounds: number
  koRate: number; tkoRate: number; decisionRate: number
  roundDist: [number, number, number]
  avgDmgF1: number; avgDmgF2: number
  avgStrikesF1: number; avgStrikesF2: number
  techF1: TechStats; techF2: TechStats
  // Round-by-round analysis
  f1WinRateByRound: [number, number, number]  // fights ending in R1/R2/R3, f1 win rate
  f1RoundDmgWinRate: [number, number, number]  // per-round: % of rounds where f1 dealt more damage
  avgRoundDmgF1: [number, number, number]
  avgRoundDmgF2: [number, number, number]
  avgTempoEndF1: [number, number, number]
  avgTempoEndF2: [number, number, number]
  desperationKORate: number
}

function runSim(c1: FighterConfig, c2: FighterConfig, n = 10_000): SimResult {
  let f1Wins = 0, totalRounds = 0, ko = 0, tko = 0, dec = 0
  let dmgF1 = 0, dmgF2 = 0, strikesF1 = 0, strikesF2 = 0
  const rd: [number, number, number] = [0, 0, 0]
  const f1WinsByRound: [number, number, number] = [0, 0, 0]
  const fightsByRound: [number, number, number] = [0, 0, 0]
  const f1RoundDmgWins: [number, number, number] = [0, 0, 0]
  const roundsPlayed: [number, number, number] = [0, 0, 0]
  const roundDmgF1: [number, number, number] = [0, 0, 0]
  const roundDmgF2: [number, number, number] = [0, 0, 0]
  const tempoEndF1: [number, number, number] = [0, 0, 0]
  const tempoEndF2: [number, number, number] = [0, 0, 0]
  let despKOs = 0
  const techF1 = emptyTechStats(), techF2 = emptyTechStats()

  for (let i = 0; i < n; i++) {
    const r = simulateFight(c1, c2)
    if (r.winner === 1) f1Wins++
    totalRounds += r.rounds
    if (r.method === 'KO') ko++
    else if (r.method === 'TKO') tko++
    else dec++

    if (r.endRound >= 1 && r.endRound <= 3) {
      rd[r.endRound - 1]++
      fightsByRound[r.endRound - 1]++
      if (r.winner === 1) f1WinsByRound[r.endRound - 1]++
    }

    dmgF1 += r.fighter1.totalDamageDealt; dmgF2 += r.fighter2.totalDamageDealt
    strikesF1 += r.fighter1.strikesLanded; strikesF2 += r.fighter2.strikesLanded

    // Round damage tracking (all 3 rounds for fights that went that far)
    for (let round = 0; round < 3; round++) {
      roundDmgF1[round] += r.fighter1.roundDamage[round]
      roundDmgF2[round] += r.fighter2.roundDamage[round]
      tempoEndF1[round] += r.fighter1.roundData[round].endTempoPercent
      tempoEndF2[round] += r.fighter2.roundData[round].endTempoPercent
    }

    // Per-round damage win tracking
    for (let round = 0; round < r.roundWinners.length; round++) {
      roundsPlayed[round]++
      if (r.roundWinners[round] === 1) f1RoundDmgWins[round]++
    }

    despKOs += r.fighter1.tech.desperationKOs + r.fighter2.tech.desperationKOs

    for (const k of Object.keys(techF1) as (keyof TechStats)[]) {
      techF1[k] += r.fighter1.tech[k]; techF2[k] += r.fighter2.tech[k]
    }
  }

  return {
    f1WinRate: f1Wins / n,
    avgRounds: totalRounds / n,
    koRate: ko / n, tkoRate: tko / n, decisionRate: dec / n,
    roundDist: [rd[0] / n, rd[1] / n, rd[2] / n],
    avgDmgF1: dmgF1 / n, avgDmgF2: dmgF2 / n,
    avgStrikesF1: strikesF1 / n, avgStrikesF2: strikesF2 / n,
    techF1, techF2,
    f1WinRateByRound: [
      fightsByRound[0] > 0 ? f1WinsByRound[0] / fightsByRound[0] : 0,
      fightsByRound[1] > 0 ? f1WinsByRound[1] / fightsByRound[1] : 0,
      fightsByRound[2] > 0 ? f1WinsByRound[2] / fightsByRound[2] : 0,
    ],
    f1RoundDmgWinRate: [
      roundsPlayed[0] > 0 ? f1RoundDmgWins[0] / roundsPlayed[0] : 0,
      roundsPlayed[1] > 0 ? f1RoundDmgWins[1] / roundsPlayed[1] : 0,
      roundsPlayed[2] > 0 ? f1RoundDmgWins[2] / roundsPlayed[2] : 0,
    ],
    avgRoundDmgF1: [roundDmgF1[0] / n, roundDmgF1[1] / n, roundDmgF1[2] / n],
    avgRoundDmgF2: [roundDmgF2[0] / n, roundDmgF2[1] / n, roundDmgF2[2] / n],
    avgTempoEndF1: [tempoEndF1[0] / n, tempoEndF1[1] / n, tempoEndF1[2] / n],
    avgTempoEndF2: [tempoEndF2[0] / n, tempoEndF2[1] / n, tempoEndF2[2] / n],
    desperationKORate: despKOs / n,
  }
}

// ─── Utility Functions ──────────────────────────────────────────────────────

export function makeStats(o: Partial<FighterStats> = {}): FighterStats {
  return { pow: 50, end: 50, tec: 50, ...o }
}

export function makeGear(tier: string, primaryStat: 'pow' | 'end' | 'tec' = 'pow'): GearLoadout {
  const total = GEAR_TIER_BONUSES[tier] ?? 0
  return {
    pieces: [{
      slot: 'gloves' as const, tier: tier as any, name: `${tier} gloves`,
      primaryBonus: total, secondaryBonus: 0, primaryStat,
    }],
  }
}

// Confidence interval for a proportion (95% CI)
export function confidenceInterval(p: number, n: number): { low: number; high: number; se: number } {
  const se = Math.sqrt(Math.abs(p * (1 - p)) / n)
  return { low: p - 1.96 * se, high: p + 1.96 * se, se }
}

// ─── Exports ────────────────────────────────────────────────────────────────

export type { FighterConfig, FighterStats, GearLoadout, GearEffect, Condition, SimResult, TechStats, FightResult }
export { runSim, simulateFight }
