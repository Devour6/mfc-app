import {
  recordStrength,
  trainingStrength,
  calculateWinProbability,
  probabilityToBias,
  determineFightOutcome,
  FighterProbabilityData,
} from '@/lib/fight-probability'

// ─── recordStrength ─────────────────────────────────────────────────────────

describe('recordStrength', () => {
  it('returns 0.5 for a 0-0 fighter (league average)', () => {
    expect(recordStrength(0, 0, 0)).toBe(0.5)
  })

  it('returns higher value for a winning record', () => {
    const dominant = recordStrength(22, 3, 0)
    const average = recordStrength(0, 0, 0)
    expect(dominant).toBeGreaterThan(average)
  })

  it('returns lower value for a losing record', () => {
    const losing = recordStrength(2, 10, 0)
    const average = recordStrength(0, 0, 0)
    expect(losing).toBeLessThan(average)
  })

  it('weights a deep record more than a shallow one', () => {
    const shallow = recordStrength(1, 0, 0) // 1-0
    const deep = recordStrength(22, 3, 0) // 22-3
    // Both have good ratios but 22-3 should be more extreme
    expect(deep).toBeGreaterThan(shallow)
  })

  it('counts draws as half a win', () => {
    const losing = recordStrength(3, 10, 0) // 3-10 = clearly losing
    const withDraws = recordStrength(3, 10, 6) // 3-10-6 = draws help
    expect(withDraws).toBeGreaterThan(losing)
  })

  it('clamps negative inputs to 0', () => {
    expect(recordStrength(-5, -3, -1)).toBe(0.5) // treated as 0-0-0
  })
})

// ─── trainingStrength ───────────────────────────────────────────────────────

describe('trainingStrength', () => {
  it('returns 0 for 0 training hours', () => {
    expect(trainingStrength(0)).toBe(0)
  })

  it('increases with more training', () => {
    expect(trainingStrength(100)).toBeGreaterThan(trainingStrength(50))
  })

  it('has diminishing returns', () => {
    const gain0to50 = trainingStrength(50) - trainingStrength(0)
    const gain150to200 = trainingStrength(200) - trainingStrength(150)
    expect(gain0to50).toBeGreaterThan(gain150to200)
  })

  it('clamps negative hours to 0', () => {
    expect(trainingStrength(-10)).toBe(0)
  })
})

// ─── calculateWinProbability ────────────────────────────────────────────────

describe('calculateWinProbability', () => {
  const nexusPrime: FighterProbabilityData = { wins: 22, losses: 3, draws: 0, totalTrainingHours: 150 }
  const volt: FighterProbabilityData = { wins: 6, losses: 4, draws: 0, totalTrainingHours: 30 }
  const rookie: FighterProbabilityData = { wins: 0, losses: 0, draws: 0, totalTrainingHours: 0 }

  it('gives dominant fighter higher probability', () => {
    const result = calculateWinProbability('nexus', 'volt', nexusPrime, volt)
    expect(result.fighter1WinProbability).toBeGreaterThan(0.5)
    expect(result.fighter2WinProbability).toBeLessThan(0.5)
    expect(result.favoredFighterId).toBe('nexus')
  })

  it('probabilities sum to 1', () => {
    const result = calculateWinProbability('nexus', 'volt', nexusPrime, volt)
    expect(result.fighter1WinProbability + result.fighter2WinProbability).toBeCloseTo(1.0)
  })

  it('returns 50/50 for identical fighters', () => {
    const result = calculateWinProbability('same', 'same', nexusPrime, nexusPrime)
    expect(result.fighter1WinProbability).toBe(0.5)
    expect(result.fighter2WinProbability).toBe(0.5)
    expect(result.favoredFighterId).toBeNull()
  })

  it('returns 50/50 for two rookies', () => {
    const result = calculateWinProbability('a', 'b', rookie, rookie)
    expect(result.fighter1WinProbability).toBe(0.5)
    expect(result.fighter2WinProbability).toBe(0.5)
  })

  it('never goes below 10% luck floor', () => {
    const god: FighterProbabilityData = { wins: 100, losses: 0, draws: 0, totalTrainingHours: 1000 }
    const result = calculateWinProbability('god', 'rookie', god, rookie)
    expect(result.fighter2WinProbability).toBeGreaterThanOrEqual(0.10)
  })

  it('never goes above 90% luck ceiling', () => {
    const god: FighterProbabilityData = { wins: 100, losses: 0, draws: 0, totalTrainingHours: 1000 }
    const result = calculateWinProbability('god', 'rookie', god, rookie)
    expect(result.fighter1WinProbability).toBeLessThanOrEqual(0.90)
  })

  it('is symmetric — swapping fighters swaps probabilities', () => {
    const r1 = calculateWinProbability('a', 'b', nexusPrime, volt)
    const r2 = calculateWinProbability('b', 'a', volt, nexusPrime)
    expect(r1.fighter1WinProbability).toBeCloseTo(r2.fighter2WinProbability)
    expect(r1.fighter2WinProbability).toBeCloseTo(r2.fighter1WinProbability)
  })
})

// ─── probabilityToBias ──────────────────────────────────────────────────────

describe('probabilityToBias', () => {
  it('returns 0 for a 50/50 fight', () => {
    expect(probabilityToBias(0.50)).toBe(0)
  })

  it('returns max bias (0.40) for 90% probability', () => {
    expect(probabilityToBias(0.90)).toBeCloseTo(0.40)
  })

  it('scales linearly between 50% and 90%', () => {
    expect(probabilityToBias(0.70)).toBeCloseTo(0.20)
  })

  it('never exceeds max bias', () => {
    expect(probabilityToBias(0.99)).toBeLessThanOrEqual(0.40)
  })

  it('returns 0 for probabilities at or below 50%', () => {
    expect(probabilityToBias(0.40)).toBe(0)
  })
})

// ─── determineFightOutcome ──────────────────────────────────────────────────

describe('determineFightOutcome', () => {
  const nexusPrime: FighterProbabilityData = { wins: 22, losses: 3, draws: 0, totalTrainingHours: 150 }
  const volt: FighterProbabilityData = { wins: 6, losses: 4, draws: 0, totalTrainingHours: 30 }

  it('returns a valid winnerId', () => {
    const result = determineFightOutcome('nexus', 'volt', nexusPrime, volt)
    expect(['nexus', 'volt']).toContain(result.winnerId)
  })

  it('returns biasConfig favoring the winner', () => {
    const result = determineFightOutcome('nexus', 'volt', nexusPrime, volt)
    expect(result.biasConfig.favoredFighterId).toBe(result.winnerId)
  })

  it('returns non-negative damageModifier', () => {
    const result = determineFightOutcome('nexus', 'volt', nexusPrime, volt)
    expect(result.biasConfig.damageModifier).toBeGreaterThanOrEqual(0)
  })

  it('includes probability result', () => {
    const result = determineFightOutcome('nexus', 'volt', nexusPrime, volt)
    expect(result.probability.fighter1WinProbability).toBeGreaterThan(0)
    expect(result.probability.fighter2WinProbability).toBeGreaterThan(0)
  })

  it('statistically favors the better fighter over many fights', () => {
    let nexusWins = 0
    const trials = 1000
    for (let i = 0; i < trials; i++) {
      const result = determineFightOutcome('nexus', 'volt', nexusPrime, volt)
      if (result.winnerId === 'nexus') nexusWins++
    }
    // NEXUS should win more than 50% of the time (expected ~59%)
    expect(nexusWins / trials).toBeGreaterThan(0.45)
    // But VOLT should still win sometimes (luck factor)
    expect(nexusWins / trials).toBeLessThan(0.80)
  })
})
