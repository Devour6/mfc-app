import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { prisma } from '@/lib/prisma'

// Training algorithm constants
const BASE_TRAINING_COST = 100
const HOURS_PER_SESSION = 2
const MAX_STAT_GAIN_PER_SESSION = 3
const DIMINISHING_RETURNS_THRESHOLD = 80 // Stats above this have reduced gains

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { fighterId, sessions } = await request.json()

    if (!fighterId || !sessions || sessions <= 0) {
      return NextResponse.json({ error: 'Invalid training parameters' }, { status: 400 })
    }

    const fighter = await prisma.fighter.findUnique({
      where: { 
        id: fighterId,
        ownerId: user.id // Ensure user owns this fighter
      }
    })

    if (!fighter) {
      return NextResponse.json({ error: 'Fighter not found or not owned by user' }, { status: 404 })
    }

    const totalCost = fighter.trainingCost * sessions
    
    if (user.credits < totalCost) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
    }

    // Calculate stat improvements based on training algorithm
    const statGains = calculateStatGains(fighter, sessions)
    const totalHours = HOURS_PER_SESSION * sessions

    // Update fighter and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct credits from user
      await tx.user.update({
        where: { id: user.id },
        data: { credits: user.credits - totalCost }
      })

      // Update fighter stats
      const updatedFighter = await tx.fighter.update({
        where: { id: fighterId },
        data: {
          strength: Math.min(100, fighter.strength + statGains.strength),
          speed: Math.min(100, fighter.speed + statGains.speed),
          defense: Math.min(100, fighter.defense + statGains.defense),
          stamina: Math.min(100, fighter.stamina + statGains.stamina),
          fightIQ: Math.min(100, fighter.fightIQ + statGains.fightIQ),
          aggression: Math.min(100, fighter.aggression + statGains.aggression),
          totalTrainingHours: fighter.totalTrainingHours + totalHours,
          totalTrainingSessions: fighter.totalTrainingSessions + sessions,
          // Increase training cost slightly (diminishing returns)
          trainingCost: fighter.trainingCost * 1.05,
        }
      })

      // Record training session
      const training = await tx.training.create({
        data: {
          fighterId,
          userId: user.id,
          hours: totalHours,
          cost: totalCost,
          strengthGain: statGains.strength,
          speedGain: statGains.speed,
          defenseGain: statGains.defense,
          staminaGain: statGains.stamina,
          fightIQGain: statGains.fightIQ,
          aggressionGain: statGains.aggression,
        }
      })

      return { fighter: updatedFighter, training, remainingCredits: user.credits - totalCost }
    })

    return NextResponse.json({
      success: true,
      fighter: result.fighter,
      training: result.training,
      creditsSpent: totalCost,
      remainingCredits: result.remainingCredits,
      statGains,
    })

  } catch (error) {
    console.error('Error processing training:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function calculateStatGains(fighter: any, sessions: number): {
  strength: number
  speed: number
  defense: number
  stamina: number
  fightIQ: number
  aggression: number
} {
  const gains = {
    strength: 0,
    speed: 0,
    defense: 0,
    stamina: 0,
    fightIQ: 0,
    aggression: 0
  }

  // Each session can improve 1-3 random stats
  for (let session = 0; session < sessions; session++) {
    const statsToImprove = Math.floor(Math.random() * 3) + 1 // 1-3 stats per session
    const availableStats = Object.keys(gains)
    
    for (let i = 0; i < statsToImprove; i++) {
      const statIndex = Math.floor(Math.random() * availableStats.length)
      const statName = availableStats[statIndex] as keyof typeof gains
      const currentStat = fighter[statName] + gains[statName]
      
      // Calculate gain with diminishing returns
      let maxGain = MAX_STAT_GAIN_PER_SESSION
      if (currentStat >= DIMINISHING_RETURNS_THRESHOLD) {
        // Reduced gains for high stats (caps at 100)
        maxGain = Math.max(1, Math.floor(maxGain * (100 - currentStat) / 20))
      }
      
      const gain = Math.floor(Math.random() * maxGain) + 1
      gains[statName] += gain
    }
  }

  return gains
}