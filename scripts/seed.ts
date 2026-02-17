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

  // Create sample fighters with varied stats and ELOs matching their records
  const fighters = [
    {
      name: 'Thunder Bolt',
      emoji: '⚡',
      class: FighterClass.HEAVYWEIGHT,
      ownerId: user1.id,
      elo: 1580,
      strength: 75,
      speed: 65,
      defense: 70,
      stamina: 80,
      fightIQ: 60,
      aggression: 85,
      totalTrainingHours: 50,
      totalTrainingSessions: 25,
      wins: 8,
      losses: 2,
      winStreak: 3,
    },
    {
      name: 'Speed Demon',
      emoji: '👹',
      class: FighterClass.LIGHTWEIGHT,
      ownerId: user1.id,
      elo: 1720,
      strength: 55,
      speed: 90,
      defense: 60,
      stamina: 75,
      fightIQ: 80,
      aggression: 70,
      totalTrainingHours: 75,
      totalTrainingSessions: 40,
      wins: 12,
      losses: 1,
      winStreak: 7,
    },
    {
      name: 'Iron Wall',
      emoji: '🛡️',
      class: FighterClass.MIDDLEWEIGHT,
      ownerId: user2.id,
      elo: 1650,
      strength: 70,
      speed: 50,
      defense: 95,
      stamina: 85,
      fightIQ: 75,
      aggression: 40,
      totalTrainingHours: 100,
      totalTrainingSessions: 50,
      wins: 15,
      losses: 3,
      winStreak: 0,
      lossStreak: 1,
    },
    {
      name: 'Glass Cannon',
      emoji: '💥',
      class: FighterClass.HEAVYWEIGHT,
      ownerId: user2.id,
      elo: 1120,
      strength: 95,
      speed: 70,
      defense: 40,
      stamina: 60,
      fightIQ: 55,
      aggression: 90,
      totalTrainingHours: 30,
      totalTrainingSessions: 15,
      wins: 5,
      losses: 4,
      winStreak: 0,
      lossStreak: 2,
    },
    {
      name: 'Rookie Rising',
      emoji: '🌟',
      class: FighterClass.LIGHTWEIGHT,
      ownerId: user1.id,
      elo: 1025,
      strength: 45,
      speed: 55,
      defense: 50,
      stamina: 60,
      fightIQ: 40,
      aggression: 65,
      totalTrainingHours: 5,
      totalTrainingSessions: 3,
      wins: 1,
      losses: 0,
      winStreak: 1,
    },
  ]

  const createdFighters = []
  for (const fighterData of fighters) {
    const fighter = await prisma.fighter.create({ data: fighterData })
    createdFighters.push(fighter)
    console.log(`  Created fighter: ${fighter.name} (${fighter.class}, ELO ${fighter.elo})`)
  }

  // Create sample training sessions
  const trainingSessions = [
    {
      fighterId: createdFighters[0].id,
      userId: user1.id,
      hours: 4,
      cost: 400,
      strengthGain: 2,
      staminaGain: 1,
    },
    {
      fighterId: createdFighters[1].id,
      userId: user1.id,
      hours: 6,
      cost: 600,
      speedGain: 3,
      fightIQGain: 2,
    },
    {
      fighterId: createdFighters[2].id,
      userId: user2.id,
      hours: 8,
      cost: 800,
      defenseGain: 2,
      staminaGain: 3,
    },
  ]

  for (const training of trainingSessions) {
    await prisma.training.create({ data: training })
  }
  console.log(`  Created ${trainingSessions.length} training sessions`)

  // Create a completed fight with result
  const fight1 = await prisma.fight.create({
    data: {
      fighter1Id: createdFighters[0].id,
      fighter2Id: createdFighters[3].id,
      status: 'COMPLETED',
      scheduledAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endedAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
      venue: 'MFC Arena',
      title: 'Thunder Bolt vs Glass Cannon',
      maxRounds: 3,
      fightData: {
        winner: 'Thunder Bolt',
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
      userId: user1.id,
    }
  })
  console.log('  Created 1 completed fight with result')

  // Create a scheduled upcoming fight
  const upcomingFight = await prisma.fight.create({
    data: {
      fighter1Id: createdFighters[1].id,
      fighter2Id: createdFighters[2].id,
      status: 'SCHEDULED',
      scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      venue: 'MFC Championship Arena',
      title: 'Speed Demon vs Iron Wall - Title Fight',
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
  console.log('  2 users')
  console.log('  5 fighters (with ELO ratings)')
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
