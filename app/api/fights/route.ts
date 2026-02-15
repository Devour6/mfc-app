import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { prisma } from '@/lib/prisma'
import { FightMethod } from '@prisma/client'

// Enhanced Fight Algorithm Constants
const BASE_WIN_PROBABILITY = 0.5 // 50% base chance
const MAX_STAT_DIFFERENCE_IMPACT = 0.4 // Max 40% swing from stat differences
const MOMENTUM_MULTIPLIER = 0.05 // 5% per win/loss streak
const MAX_MOMENTUM = 0.15 // Cap momentum at 15%
const UPSET_MINIMUM_PROBABILITY = 0.05 // Always at least 5% chance for underdog

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fighter1Id, fighter2Id, venue, title } = await request.json()

    if (!fighter1Id || !fighter2Id) {
      return NextResponse.json({ error: 'Both fighters required' }, { status: 400 })
    }

    if (fighter1Id === fighter2Id) {
      return NextResponse.json({ error: 'Fighter cannot fight themselves' }, { status: 400 })
    }

    // Fetch both fighters
    const [fighter1, fighter2] = await Promise.all([
      prisma.fighter.findUnique({ where: { id: fighter1Id } }),
      prisma.fighter.findUnique({ where: { id: fighter2Id } })
    ])

    if (!fighter1 || !fighter2) {
      return NextResponse.json({ error: 'One or both fighters not found' }, { status: 404 })
    }

    // Create fight record
    const fight = await prisma.fight.create({
      data: {
        fighter1Id,
        fighter2Id,
        status: 'LIVE',
        scheduledAt: new Date(),
        startedAt: new Date(),
        venue: venue || 'MFC Arena',
        title: title || `${fighter1.name} vs ${fighter2.name}`,
        maxRounds: 3,
      }
    })

    // Run the enhanced fight algorithm
    const fightResult = await runEnhancedFightAlgorithm(fighter1, fighter2, fight.id)

    return NextResponse.json({
      fight: {
        id: fight.id,
        ...fightResult
      }
    })

  } catch (error) {
    console.error('Error running fight:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function runEnhancedFightAlgorithm(fighter1: any, fighter2: any, fightId: string) {
  // Calculate enhanced fight probability based on training, stats, and momentum
  const fighter1Power = calculateFighterPower(fighter1)
  const fighter2Power = calculateFighterPower(fighter2)
  
  console.log(`Fight Power - ${fighter1.name}: ${fighter1Power.toFixed(2)}, ${fighter2.name}: ${fighter2Power.toFixed(2)}`)
  
  // Calculate win probability with enhanced algorithm
  let fighter1WinProb = calculateWinProbability(fighter1Power, fighter2Power)
  
  console.log(`Base probability - ${fighter1.name}: ${(fighter1WinProb * 100).toFixed(1)}%`)
  
  // Ensure minimum upset chance (no fight is ever 100% certain)
  if (fighter1WinProb > (1 - UPSET_MINIMUM_PROBABILITY)) {
    fighter1WinProb = 1 - UPSET_MINIMUM_PROBABILITY
  } else if (fighter1WinProb < UPSET_MINIMUM_PROBABILITY) {
    fighter1WinProb = UPSET_MINIMUM_PROBABILITY
  }
  
  console.log(`Final probability - ${fighter1.name}: ${(fighter1WinProb * 100).toFixed(1)}%`)
  
  // Simulate fight
  const fightOutcome = simulateFight(fighter1, fighter2, fighter1WinProb)
  
  // Update database with results
  const result = await recordFightResult(fightId, fighter1, fighter2, fightOutcome)
  
  return result
}

function calculateFighterPower(fighter: any): number {
  // Base power from stats (training is the primary driver)
  const statTotal = fighter.strength + fighter.speed + fighter.defense + 
                   fighter.stamina + fighter.fightIQ + fighter.aggression
  const basePower = statTotal / 6 // Average stat (0-100)
  
  // Training multiplier (total training hours boost power)
  const trainingBonus = Math.min(20, fighter.totalTrainingHours / 10) // Up to 20 point bonus
  
  // Record momentum (win streaks boost, loss streaks hurt)
  let momentum = 0
  if (fighter.winStreak > 0) {
    momentum = Math.min(MAX_MOMENTUM, fighter.winStreak * MOMENTUM_MULTIPLIER)
  } else if (fighter.lossStreak > 0) {
    momentum = -Math.min(MAX_MOMENTUM, fighter.lossStreak * MOMENTUM_MULTIPLIER)
  }
  
  const totalPower = basePower + trainingBonus + (momentum * 100)
  
  console.log(`${fighter.name} - Base: ${basePower.toFixed(1)}, Training: +${trainingBonus.toFixed(1)}, Momentum: ${momentum >= 0 ? '+' : ''}${(momentum * 100).toFixed(1)}, Total: ${totalPower.toFixed(1)}`)
  
  return Math.max(0, totalPower)
}

function calculateWinProbability(power1: number, power2: number): number {
  if (power1 === power2) return 0.5
  
  // Use logistic function for smooth probability curve
  const powerDifference = power1 - power2
  const maxDifference = 50 // Max meaningful difference in power
  const normalizedDiff = powerDifference / maxDifference
  
  // Logistic function: steep curve but never reaches 0 or 1
  const probability = 1 / (1 + Math.exp(-6 * normalizedDiff))
  
  return probability
}

function simulateFight(fighter1: any, fighter2: any, fighter1WinProb: number) {
  const random = Math.random()
  const winner = random < fighter1WinProb ? fighter1 : fighter2
  const loser = winner === fighter1 ? fighter2 : fighter1
  
  // Determine fight method based on power difference and stats
  const powerDifference = Math.abs(calculateFighterPower(winner) - calculateFighterPower(loser))
  
  let method: FightMethod
  let round = 1
  let time = '0:00'
  
  if (powerDifference > 30) {
    // Big skill gap = likely KO
    method = Math.random() < 0.7 ? 'KO' : 'TKO'
    round = Math.floor(Math.random() * 2) + 1 // Round 1 or 2
    time = `${Math.floor(Math.random() * 3)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
  } else if (powerDifference > 15) {
    // Moderate gap = TKO or decision
    method = Math.random() < 0.6 ? 'TKO' : 'DECISION'
    round = method === 'TKO' ? Math.floor(Math.random() * 3) + 1 : 3
    time = method === 'TKO' ? `${Math.floor(Math.random() * 3)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}` : '3:00'
  } else {
    // Close fight = likely decision
    method = Math.random() < 0.8 ? 'DECISION' : 'TKO'
    round = method === 'TKO' ? 3 : 3
    time = method === 'TKO' ? `2:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}` : '3:00'
  }
  
  // Generate fight stats
  const winnerStats = generateFightStats(winner, true, method)
  const loserStats = generateFightStats(loser, false, method)
  
  return {
    winner,
    loser,
    method,
    round,
    time,
    winnerStats,
    loserStats
  }
}

function generateFightStats(fighter: any, won: boolean, method: FightMethod) {
  const baseStrikes = Math.floor(Math.random() * 50) + 30
  const accuracy = won ? 0.4 + Math.random() * 0.3 : 0.2 + Math.random() * 0.3
  const landed = Math.floor(baseStrikes * accuracy)
  
  return {
    strikes: baseStrikes,
    landed,
    accuracy: accuracy * 100,
    powerShots: Math.floor(landed * 0.3),
    dodges: Math.floor(Math.random() * 15) + 5,
    blocks: Math.floor(Math.random() * 10) + 3,
    damage: won ? Math.floor(Math.random() * 30) + 10 : Math.floor(Math.random() * 50) + 20
  }
}

async function recordFightResult(fightId: string, fighter1: any, fighter2: any, outcome: any) {
  const { winner, loser, method, round, time, winnerStats, loserStats } = outcome
  
  // Calculate ELO changes
  const k = 32 // ELO K-factor
  const expectedWinner = 1 / (1 + Math.pow(10, (loser.elo - winner.elo) / 400))
  const expectedLoser = 1 / (1 + Math.pow(10, (winner.elo - loser.elo) / 400))
  
  const winnerEloChange = Math.round(k * (1 - expectedWinner))
  const loserEloChange = Math.round(k * (0 - expectedLoser))
  
  return await prisma.$transaction(async (tx) => {
    // Update fight status
    await tx.fight.update({
      where: { id: fightId },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
        fightData: {
          winner: winner.name,
          method,
          round,
          time,
          fighter1Stats: fighter1.id === winner.id ? winnerStats : loserStats,
          fighter2Stats: fighter2.id === winner.id ? winnerStats : loserStats,
        }
      }
    })
    
    // Create fight result
    const fightResult = await tx.fightResult.create({
      data: {
        fightId,
        winnerId: winner.id,
        method,
        round,
        time,
        fighter1Stats: fighter1.id === winner.id ? winnerStats : loserStats,
        fighter2Stats: fighter2.id === winner.id ? winnerStats : loserStats,
        fighter1EloChange: fighter1.id === winner.id ? winnerEloChange : loserEloChange,
        fighter2EloChange: fighter2.id === winner.id ? winnerEloChange : loserEloChange,
        userId: winner.ownerId, // Placeholder for now
      }
    })
    
    // Update winner
    await tx.fighter.update({
      where: { id: winner.id },
      data: {
        wins: winner.wins + 1,
        elo: winner.elo + winnerEloChange,
        winStreak: winner.winStreak + 1,
        lossStreak: 0,
        lastFightAt: new Date(),
      }
    })
    
    // Update loser
    await tx.fighter.update({
      where: { id: loser.id },
      data: {
        losses: loser.losses + 1,
        elo: Math.max(100, loser.elo + loserEloChange), // Minimum ELO of 100
        winStreak: 0,
        lossStreak: loser.lossStreak + 1,
        lastFightAt: new Date(),
      }
    })
    
    return {
      winner: winner.name,
      loser: loser.name,
      method,
      round,
      time,
      fightResult,
      eloChanges: {
        winner: winnerEloChange,
        loser: loserEloChange
      }
    }
  })
}