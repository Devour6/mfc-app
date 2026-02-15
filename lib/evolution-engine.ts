import { Fighter, FighterEvolution, SignatureMove, FightHistoryEntry } from '@/types'

// Available signature moves library
const SIGNATURE_MOVES: SignatureMove[] = [
  // Aggressive moves
  {
    id: 'lightning-jab',
    name: 'Lightning Jab',
    description: 'A blindingly fast jab that lands before opponents can react',
    type: 'offensive',
    damageMultiplier: 1.3,
    staminaCost: 15,
    unlockCondition: '50+ aggressive trait, 10+ wins',
    requiredTrait: 'aggressive',
    requiredLevel: 50
  },
  {
    id: 'knockout-cross',
    name: 'Knockout Cross',
    description: 'A devastating cross punch with knockout power',
    type: 'offensive',
    damageMultiplier: 2.0,
    staminaCost: 25,
    unlockCondition: '70+ aggressive trait, 3+ KO wins',
    requiredTrait: 'aggressive',
    requiredLevel: 70
  },
  {
    id: 'berserker-combo',
    name: 'Berserker Combo',
    description: 'An unrelenting 5-punch combination',
    type: 'combo',
    damageMultiplier: 1.8,
    staminaCost: 40,
    unlockCondition: '80+ aggressive trait, 5+ win streak',
    requiredTrait: 'aggressive',
    requiredLevel: 80
  },

  // Defensive moves
  {
    id: 'iron-wall-block',
    name: 'Iron Wall Block',
    description: 'An unbreakable defensive stance',
    type: 'defensive',
    damageMultiplier: 0.3,
    staminaCost: 20,
    unlockCondition: '60+ defensive trait, 100+ blocks',
    requiredTrait: 'defensive',
    requiredLevel: 60
  },
  {
    id: 'matrix-dodge',
    name: 'Matrix Dodge',
    description: 'Dodge with supernatural reflexes',
    type: 'defensive',
    damageMultiplier: 0,
    staminaCost: 15,
    unlockCondition: '70+ defensive trait, 50+ dodges',
    requiredTrait: 'defensive',
    requiredLevel: 70
  },

  // Technical moves
  {
    id: 'precision-strike',
    name: 'Precision Strike',
    description: 'A perfectly placed strike targeting weak points',
    type: 'offensive',
    damageMultiplier: 1.6,
    staminaCost: 20,
    unlockCondition: '60+ technical trait, 80% accuracy',
    requiredTrait: 'technical',
    requiredLevel: 60
  },
  {
    id: 'calculated-combo',
    name: 'Calculated Combo',
    description: 'A scientifically perfect combination',
    type: 'combo',
    damageMultiplier: 1.7,
    staminaCost: 30,
    unlockCondition: '75+ technical trait, 15+ decision wins',
    requiredTrait: 'technical',
    requiredLevel: 75
  },

  // Showboat moves
  {
    id: 'showtime-spin',
    name: 'Showtime Spin',
    description: 'A flashy spinning attack that excites the crowd',
    type: 'combo',
    damageMultiplier: 1.4,
    staminaCost: 25,
    unlockCondition: '50+ showboat trait, crowd favorite',
    requiredTrait: 'showboat',
    requiredLevel: 50
  },
  {
    id: 'signature-taunt',
    name: 'Signature Taunt',
    description: 'A psychological warfare move that frustrates opponents',
    type: 'offensive',
    damageMultiplier: 1.2,
    staminaCost: 10,
    unlockCondition: '60+ showboat trait, 3+ comebacks',
    requiredTrait: 'showboat',
    requiredLevel: 60
  }
]

export class FighterEvolutionEngine {
  
  static createNewEvolution(age: number = this.randomAge()): FighterEvolution {
    const peakStart = 26 + Math.floor(Math.random() * 3) // 26-28
    const peakEnd = peakStart + 3 + Math.floor(Math.random() * 3) // 3-5 year peak
    
    return {
      traits: {
        aggressive: Math.floor(Math.random() * 30) + 10, // Start 10-40
        defensive: Math.floor(Math.random() * 30) + 10,
        showboat: Math.floor(Math.random() * 30) + 10,
        technical: Math.floor(Math.random() * 30) + 10
      },
      signatureMoves: [],
      age,
      peakAgeStart: peakStart,
      peakAgeEnd: peakEnd,
      fightHistory: [],
      evolutionLevel: 1,
      totalFights: 0,
      winStreak: 0,
      careerHighlights: []
    }
  }

  static randomAge(): number {
    // Start between 18-25
    return 18 + Math.floor(Math.random() * 8)
  }

  static updateAfterFight(
    fighter: Fighter, 
    fightResult: 'win' | 'loss' | 'draw',
    fightData: {
      opponent: string
      method: 'KO' | 'TKO' | 'Decision' | 'Submission'
      round: number
      actions: FightHistoryEntry['actions']
    }
  ): Fighter {
    const evolution = { ...fighter.evolution }
    
    // Add to fight history
    const historyEntry: FightHistoryEntry = {
      fightId: `fight-${Date.now()}`,
      opponent: fightData.opponent,
      result: fightResult,
      method: fightData.method,
      round: fightData.round,
      actions: fightData.actions,
      date: Date.now()
    }
    
    evolution.fightHistory.push(historyEntry)
    evolution.totalFights++
    
    // Update win streak
    if (fightResult === 'win') {
      evolution.winStreak++
    } else {
      evolution.winStreak = 0
    }
    
    // Update traits based on fight performance
    evolution.traits = this.calculateTraitChanges(evolution.traits, historyEntry)
    
    // Check for signature move unlocks
    const newMoves = this.checkSignatureMoveUnlocks(evolution)
    evolution.signatureMoves.push(...newMoves)
    
    // Update evolution level
    evolution.evolutionLevel = this.calculateEvolutionLevel(evolution)
    
    // Add career highlights
    const highlights = this.checkCareerHighlights(evolution, historyEntry)
    evolution.careerHighlights.push(...highlights)
    
    return {
      ...fighter,
      evolution
    }
  }

  private static calculateTraitChanges(
    currentTraits: FighterEvolution['traits'],
    fightEntry: FightHistoryEntry
  ): FighterEvolution['traits'] {
    const traits = { ...currentTraits }
    const actions = fightEntry.actions
    
    // Aggressive trait increases
    if (actions.offensiveActions > 20) traits.aggressive += 2
    if (actions.knockdowns > 0) traits.aggressive += 3
    if (fightEntry.method === 'KO' || fightEntry.method === 'TKO') traits.aggressive += 4
    
    // Defensive trait increases  
    if (actions.blocksLanded > 10) traits.defensive += 2
    if (actions.dodgesSuccessful > 8) traits.defensive += 2
    if (actions.defensiveActions > actions.offensiveActions) traits.defensive += 3
    
    // Technical trait increases
    const accuracy = actions.precisionStrikes / (actions.offensiveActions || 1)
    if (accuracy > 0.7) traits.technical += 3
    if (fightEntry.method === 'Decision' && fightEntry.result === 'win') traits.technical += 2
    if (fightEntry.round >= 5) traits.technical += 1 // Went the distance
    
    // Showboat trait increases
    if (actions.comboActions > 5) traits.showboat += 2
    if (fightEntry.result === 'win' && fightEntry.round === 1) traits.showboat += 3 // Quick finish
    
    // Cap traits at 100
    Object.keys(traits).forEach(key => {
      const trait = key as keyof typeof traits
      traits[trait] = Math.min(100, traits[trait])
    })
    
    return traits
  }

  private static checkSignatureMoveUnlocks(evolution: FighterEvolution): SignatureMove[] {
    const unlocked: SignatureMove[] = []
    const currentMoveIds = evolution.signatureMoves.map(m => m.id)
    
    for (const move of SIGNATURE_MOVES) {
      if (currentMoveIds.includes(move.id)) continue
      
      if (move.requiredTrait && move.requiredLevel) {
        const traitValue = evolution.traits[move.requiredTrait]
        if (traitValue >= move.requiredLevel) {
          // Check additional conditions
          if (this.checkMoveUnlockConditions(move, evolution)) {
            unlocked.push(move)
          }
        }
      }
    }
    
    return unlocked
  }

  private static checkMoveUnlockConditions(
    move: SignatureMove, 
    evolution: FighterEvolution
  ): boolean {
    const condition = move.unlockCondition.toLowerCase()
    const wins = evolution.fightHistory.filter(f => f.result === 'win').length
    const kos = evolution.fightHistory.filter(f => 
      f.result === 'win' && (f.method === 'KO' || f.method === 'TKO')
    ).length
    
    // Basic win requirements
    if (condition.includes('10+ wins') && wins < 10) return false
    if (condition.includes('3+ ko') && kos < 3) return false
    if (condition.includes('5+ win streak') && evolution.winStreak < 5) return false
    
    // More complex conditions would go here
    return true
  }

  private static calculateEvolutionLevel(evolution: FighterEvolution): number {
    const avgTrait = (
      evolution.traits.aggressive + 
      evolution.traits.defensive + 
      evolution.traits.showboat + 
      evolution.traits.technical
    ) / 4
    
    const fightExperience = Math.min(evolution.totalFights * 2, 50)
    const moveBonus = evolution.signatureMoves.length * 5
    
    return Math.floor((avgTrait + fightExperience + moveBonus) / 10)
  }

  private static checkCareerHighlights(
    evolution: FighterEvolution,
    fightEntry: FightHistoryEntry
  ): string[] {
    const highlights: string[] = []
    
    if (evolution.winStreak === 5) {
      highlights.push('5 Fight Win Streak!')
    }
    
    if (evolution.totalFights === 10) {
      highlights.push('Veteran Status Achieved')
    }
    
    if (fightEntry.method === 'KO' && fightEntry.round === 1) {
      highlights.push('First Round Knockout')
    }
    
    return highlights
  }

  static getAgeMultipliers(fighter: Fighter): {
    strength: number
    speed: number
    stamina: number
    fightIQ: number
  } {
    const age = fighter.evolution.age
    const peakStart = fighter.evolution.peakAgeStart
    const peakEnd = fighter.evolution.peakAgeEnd
    
    let strengthMult = 1.0
    let speedMult = 1.0
    let staminaMult = 1.0
    let fightIQMult = 1.0
    
    if (age < peakStart) {
      // Young fighter - still developing
      const development = (age - 18) / (peakStart - 18)
      strengthMult = 0.85 + (development * 0.15)
      speedMult = 0.9 + (development * 0.1)
      staminaMult = 0.95 + (development * 0.05)
      fightIQMult = 0.8 + (development * 0.2)
    } else if (age > peakEnd) {
      // Aging fighter - declining physical but gaining experience
      const decline = (age - peakEnd) / 8 // Decline over 8 years
      strengthMult = Math.max(0.7, 1.0 - (decline * 0.3))
      speedMult = Math.max(0.6, 1.0 - (decline * 0.4))
      staminaMult = Math.max(0.65, 1.0 - (decline * 0.35))
      fightIQMult = Math.min(1.3, 1.0 + (decline * 0.3)) // Experience bonus
    }
    // Peak years remain at 1.0 multipliers
    
    return { strength: strengthMult, speed: speedMult, stamina: staminaMult, fightIQ: fightIQMult }
  }

  static getModifiedStats(fighter: Fighter): Fighter['stats'] {
    const multipliers = this.getAgeMultipliers(fighter)
    const baseStats = fighter.stats
    
    return {
      strength: Math.round(baseStats.strength * multipliers.strength),
      speed: Math.round(baseStats.speed * multipliers.speed),
      defense: baseStats.defense, // Defense doesn't decline much with age
      stamina: Math.round(baseStats.stamina * multipliers.stamina),
      fightIQ: Math.round(baseStats.fightIQ * multipliers.fightIQ),
      aggression: baseStats.aggression // Aggression is personality-based
    }
  }

  static isPrimeAge(fighter: Fighter): boolean {
    const age = fighter.evolution.age
    return age >= fighter.evolution.peakAgeStart && age <= fighter.evolution.peakAgeEnd
  }

  static getCareerStage(fighter: Fighter): 'rising' | 'prime' | 'veteran' | 'declining' {
    const age = fighter.evolution.age
    const peakStart = fighter.evolution.peakAgeStart
    const peakEnd = fighter.evolution.peakAgeEnd
    
    if (age < peakStart) return 'rising'
    if (age >= peakStart && age <= peakEnd) return 'prime'
    if (age <= peakEnd + 3) return 'veteran'
    return 'declining'
  }
}