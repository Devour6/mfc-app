import { PrismaClient, FighterClass } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as dotenv from 'dotenv'

// Load .env.local first (Next.js convention), fall back to .env
dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({
  adapter,
  log: ['info', 'warn', 'error'],
})

async function clean() {
  console.log('Cleaning existing data...')
  // Delete in order to respect foreign key constraints
  await prisma.bet.deleteMany()
  await prisma.fightResult.deleteMany()
  await prisma.fight.deleteMany()
  await prisma.training.deleteMany()
  await prisma.fighter.deleteMany()
  await prisma.user.deleteMany()
  console.log('Database cleaned.')
}

async function seed() {
  console.log('Seeding database with sample data...')

  // Create sample users
  const user1 = await prisma.user.create({
    data: {
      auth0Id: 'dev-user-1',
      email: 'user1@example.com',
      name: 'Fight Fan #1',
      username: 'fightfan1',
      credits: 5000,
    }
  })

  const user2 = await prisma.user.create({
    data: {
      auth0Id: 'dev-user-2',
      email: 'user2@example.com',
      name: 'Champion Trainer',
      username: 'champion',
      credits: 10000,
    }
  })

  // MFC house account — owns the 5 house fighters
  const houseUser = await prisma.user.create({
    data: {
      auth0Id: 'mfc-house',
      email: 'arena@mfc.gg',
      name: 'MFC Arena',
      username: 'mfc-arena',
      credits: 0,
    }
  })

  // 5 house fighters — always available for matchmaking
  const fighters = [
    {
      name: 'IRONCLAD-7',
      emoji: '🛡️',
      class: FighterClass.HEAVYWEIGHT,
      ownerId: houseUser.id,
      elo: 1580,
      strength: 80,
      speed: 55,
      defense: 92,
      stamina: 88,
      fightIQ: 65,
      aggression: 50,
      totalTrainingHours: 120,
      totalTrainingSessions: 60,
      wins: 18,
      losses: 4,
      winStreak: 5,
    },
    {
      name: 'NEXUS-PRIME',
      emoji: '🧠',
      class: FighterClass.MIDDLEWEIGHT,
      ownerId: houseUser.id,
      elo: 1720,
      strength: 68,
      speed: 82,
      defense: 70,
      stamina: 78,
      fightIQ: 95,
      aggression: 60,
      totalTrainingHours: 150,
      totalTrainingSessions: 80,
      wins: 22,
      losses: 3,
      winStreak: 9,
    },
    {
      name: 'HAVOC',
      emoji: '💥',
      class: FighterClass.HEAVYWEIGHT,
      ownerId: houseUser.id,
      elo: 1400,
      strength: 95,
      speed: 60,
      defense: 45,
      stamina: 65,
      fightIQ: 50,
      aggression: 98,
      totalTrainingHours: 80,
      totalTrainingSessions: 40,
      wins: 14,
      losses: 8,
      winStreak: 2,
      lossStreak: 0,
    },
    {
      name: 'PHANTOM',
      emoji: '👻',
      class: FighterClass.LIGHTWEIGHT,
      ownerId: houseUser.id,
      elo: 1650,
      strength: 58,
      speed: 94,
      defense: 80,
      stamina: 82,
      fightIQ: 78,
      aggression: 45,
      totalTrainingHours: 110,
      totalTrainingSessions: 55,
      wins: 20,
      losses: 5,
      winStreak: 3,
    },
    {
      name: 'VOLT',
      emoji: '⚡',
      class: FighterClass.MIDDLEWEIGHT,
      ownerId: houseUser.id,
      elo: 1300,
      strength: 65,
      speed: 70,
      defense: 60,
      stamina: 72,
      fightIQ: 62,
      aggression: 68,
      totalTrainingHours: 30,
      totalTrainingSessions: 15,
      wins: 6,
      losses: 4,
      winStreak: 1,
    },
  ]

  const createdFighters = []
  for (const fighterData of fighters) {
    const fighter = await prisma.fighter.create({ data: fighterData })
    createdFighters.push(fighter)
    console.log(`  Created fighter: ${fighter.name} (${fighter.class}, ELO ${fighter.elo})`)
  }

  // Create training sessions for house fighters
  const trainingSessions = [
    {
      fighterId: createdFighters[0].id,
      userId: houseUser.id,
      hours: 8,
      cost: 800,
      strengthGain: 2,
      defenseGain: 3,
    },
    {
      fighterId: createdFighters[1].id,
      userId: houseUser.id,
      hours: 10,
      cost: 1000,
      speedGain: 3,
      fightIQGain: 4,
    },
    {
      fighterId: createdFighters[3].id,
      userId: houseUser.id,
      hours: 6,
      cost: 600,
      speedGain: 2,
      staminaGain: 2,
    },
  ]

  for (const training of trainingSessions) {
    await prisma.training.create({ data: training })
  }
  console.log(`  Created ${trainingSessions.length} training sessions`)

  // Create a completed fight: IRONCLAD-7 vs HAVOC
  const fight1 = await prisma.fight.create({
    data: {
      fighter1Id: createdFighters[0].id,
      fighter2Id: createdFighters[2].id,
      status: 'COMPLETED',
      scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endedAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
      venue: 'MFC Arena',
      title: 'IRONCLAD-7 vs HAVOC',
      maxRounds: 3,
      fightData: {
        winner: 'IRONCLAD-7',
        method: 'TKO',
        round: 2,
        time: '1:45'
      }
    }
  })

  await prisma.fightResult.create({
    data: {
      fightId: fight1.id,
      winnerId: createdFighters[0].id,
      method: 'TKO',
      round: 2,
      time: '1:45',
      fighter1Stats: { strikes: 45, landed: 32, accuracy: 71 },
      fighter2Stats: { strikes: 38, landed: 18, accuracy: 47 },
      fighter1EloChange: 25,
      fighter2EloChange: -25,
      userId: houseUser.id,
    }
  })
  console.log('  Created 1 completed fight with result')

  // Create a scheduled upcoming fight: NEXUS-PRIME vs PHANTOM
  const upcomingFight = await prisma.fight.create({
    data: {
      fighter1Id: createdFighters[1].id,
      fighter2Id: createdFighters[3].id,
      status: 'SCHEDULED',
      scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      venue: 'MFC Championship Arena',
      title: 'NEXUS-PRIME vs PHANTOM — Title Fight',
      maxRounds: 5,
    }
  })
  console.log('  Created 1 scheduled fight')

  // Create a sample pending bet
  await prisma.bet.create({
    data: {
      userId: user1.id,
      fightId: upcomingFight.id,
      fighterId: createdFighters[1].id,
      side: 'FIGHTER1',
      amount: 500,
      odds: 2.1,
      status: 'PENDING',
    }
  })
  console.log('  Created 1 pending bet')

  console.log('\nSeed complete:')
  console.log('  3 users (2 human + MFC house)')
  console.log('  5 house fighters (with ELO ratings)')
  console.log('  3 training sessions')
  console.log('  1 completed fight with result')
  console.log('  1 scheduled fight')
  console.log('  1 pending bet')
}

async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--clean') || args.includes('--reset')) {
    await clean()
  }

  await seed()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
