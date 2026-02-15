import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@auth0/nextjs-auth0'
import { prisma } from '@/lib/prisma'
import { FighterClass } from '@prisma/client'

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
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      fighters: user.fighters,
      credits: user.credits 
    })
  } catch (error) {
    console.error('Error fetching fighters:', error)
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

    const { name, emoji, fighterClass } = await request.json()

    if (!name || !emoji || !fighterClass) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create fighter with random starting stats (40-60 range)
    const fighter = await prisma.fighter.create({
      data: {
        name,
        emoji,
        class: fighterClass as FighterClass,
        ownerId: user.id,
        // Random starting stats between 40-60
        strength: Math.floor(Math.random() * 21) + 40,
        speed: Math.floor(Math.random() * 21) + 40,
        defense: Math.floor(Math.random() * 21) + 40,
        stamina: Math.floor(Math.random() * 21) + 40,
        fightIQ: Math.floor(Math.random() * 21) + 40,
        aggression: Math.floor(Math.random() * 21) + 40,
        trainingCost: 100.0, // Base training cost
      }
    })

    return NextResponse.json({ fighter })
  } catch (error) {
    console.error('Error creating fighter:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}