import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { prisma } from '@/lib/prisma'
import { BetSide, BetStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
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

    const bets = await prisma.bet.findMany({
      where: { userId: user.id },
      include: {
        fight: {
          include: {
            fighter1: { select: { id: true, name: true, emoji: true } },
            fighter2: { select: { id: true, name: true, emoji: true } }
          }
        },
        fighter: { select: { id: true, name: true, emoji: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ bets })

  } catch (error) {
    console.error('Error fetching bets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    const { fightId, fighterId, side, amount } = await request.json()

    if (!fightId || !side || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid bet parameters' }, { status: 400 })
    }

    if (user.credits < amount) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 })
    }

    // Verify fight exists and is available for betting
    const fight = await prisma.fight.findUnique({
      where: { id: fightId },
      include: {
        fighter1: true,
        fighter2: true,
      }
    })

    if (!fight) {
      return NextResponse.json({ error: 'Fight not found' }, { status: 404 })
    }

    if (fight.status !== 'SCHEDULED') {
      return NextResponse.json({ error: 'Fight is not available for betting' }, { status: 400 })
    }

    // Calculate odds based on fighter powers (simplified)
    const fighter1Power = calculateFighterPower(fight.fighter1)
    const fighter2Power = calculateFighterPower(fight.fighter2)
    const fighter1WinProb = calculateWinProbability(fighter1Power, fighter2Power)
    
    let odds: number
    if (side === 'FIGHTER1') {
      odds = 1 / fighter1WinProb
    } else if (side === 'FIGHTER2') {
      odds = 1 / (1 - fighter1WinProb)
    } else {
      // For YES/NO bets, use fighter1 probability
      odds = side === 'YES' ? (1 / fighter1WinProb) : (1 / (1 - fighter1WinProb))
    }

    // Create bet in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct credits
      await tx.user.update({
        where: { id: user.id },
        data: { credits: user.credits - amount }
      })

      // Create bet
      const bet = await tx.bet.create({
        data: {
          userId: user.id,
          fightId,
          fighterId,
          side: side as BetSide,
          amount,
          odds,
          status: 'PENDING' as BetStatus,
        }
      })

      return bet
    })

    return NextResponse.json({
      bet: result,
      remainingCredits: user.credits - amount,
      potentialPayout: amount * odds
    })

  } catch (error) {
    console.error('Error creating bet:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper functions (same as in fights/route.ts)
function calculateFighterPower(fighter: any): number {
  const statTotal = fighter.strength + fighter.speed + fighter.defense + 
                   fighter.stamina + fighter.fightIQ + fighter.aggression
  const basePower = statTotal / 6
  const trainingBonus = Math.min(20, fighter.totalTrainingHours / 10)
  
  let momentum = 0
  if (fighter.winStreak > 0) {
    momentum = Math.min(0.15, fighter.winStreak * 0.05)
  } else if (fighter.lossStreak > 0) {
    momentum = -Math.min(0.15, fighter.lossStreak * 0.05)
  }
  
  return Math.max(0, basePower + trainingBonus + (momentum * 100))
}

function calculateWinProbability(power1: number, power2: number): number {
  if (power1 === power2) return 0.5
  
  const powerDifference = power1 - power2
  const maxDifference = 50
  const normalizedDiff = powerDifference / maxDifference
  const probability = 1 / (1 + Math.exp(-6 * normalizedDiff))
  
  // Ensure minimum 5% chance for upsets
  return Math.max(0.05, Math.min(0.95, probability))
}