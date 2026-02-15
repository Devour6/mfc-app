import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
      include: {
        fighters: {
          include: {
            _count: {
              select: {
                fightsAsFighter1: true,
                fightsAsFighter2: true,
                trainings: true,
              }
            }
          }
        },
        trainings: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 training sessions
          include: {
            fighter: {
              select: {
                name: true,
                emoji: true
              }
            }
          }
        },
        bets: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Last 10 bets
          include: {
            fight: {
              include: {
                fighter1: { select: { name: true, emoji: true } },
                fighter2: { select: { name: true, emoji: true } }
              }
            }
          }
        },
        _count: {
          select: {
            fighters: true,
            trainings: true,
            bets: true,
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate user stats
    const totalWins = user.fighters.reduce((sum, fighter) => sum + fighter.wins, 0)
    const totalLosses = user.fighters.reduce((sum, fighter) => sum + fighter.losses, 0)
    const totalFights = totalWins + totalLosses
    const winPercentage = totalFights > 0 ? (totalWins / totalFights) * 100 : 0
    const totalTrainingSpent = user.trainings.reduce((sum, training) => sum + training.cost, 0)

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        credits: user.credits,
        createdAt: user.createdAt,
      },
      stats: {
        fightersOwned: user._count.fighters,
        totalFights,
        totalWins,
        totalLosses,
        winPercentage,
        totalTrainingSessions: user._count.trainings,
        totalTrainingSpent,
        totalBets: user._count.bets,
      },
      fighters: user.fighters,
      recentTraining: user.trainings,
      recentBets: user.bets,
    })

  } catch (error) {
    console.error('Error fetching user data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
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

    const { name, username } = await request.json()

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name && { name }),
        ...(username && { username }),
      }
    })

    return NextResponse.json({
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        credits: updatedUser.credits,
      }
    })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}