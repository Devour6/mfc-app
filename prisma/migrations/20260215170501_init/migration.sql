-- CreateEnum
CREATE TYPE "FighterClass" AS ENUM ('LIGHTWEIGHT', 'MIDDLEWEIGHT', 'HEAVYWEIGHT');

-- CreateEnum
CREATE TYPE "FightStatus" AS ENUM ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FightMethod" AS ENUM ('KO', 'TKO', 'DECISION', 'SUBMISSION', 'DISQUALIFICATION', 'NO_CONTEST');

-- CreateEnum
CREATE TYPE "BetSide" AS ENUM ('YES', 'NO', 'FIGHTER1', 'FIGHTER2', 'OVER', 'UNDER');

-- CreateEnum
CREATE TYPE "BetStatus" AS ENUM ('PENDING', 'WON', 'LOST', 'CANCELLED', 'REFUNDED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "auth0Id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT,
    "credits" DOUBLE PRECISION NOT NULL DEFAULT 1000.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fighters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "class" "FighterClass" NOT NULL,
    "elo" INTEGER NOT NULL DEFAULT 1000,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "trainingCost" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "strength" INTEGER NOT NULL DEFAULT 50,
    "speed" INTEGER NOT NULL DEFAULT 50,
    "defense" INTEGER NOT NULL DEFAULT 50,
    "stamina" INTEGER NOT NULL DEFAULT 50,
    "fightIQ" INTEGER NOT NULL DEFAULT 50,
    "aggression" INTEGER NOT NULL DEFAULT 50,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "totalTrainingHours" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalTrainingSessions" INTEGER NOT NULL DEFAULT 0,
    "winStreak" INTEGER NOT NULL DEFAULT 0,
    "lossStreak" INTEGER NOT NULL DEFAULT 0,
    "lastFightAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "fighters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainings" (
    "id" TEXT NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "strengthGain" INTEGER NOT NULL DEFAULT 0,
    "speedGain" INTEGER NOT NULL DEFAULT 0,
    "defenseGain" INTEGER NOT NULL DEFAULT 0,
    "staminaGain" INTEGER NOT NULL DEFAULT 0,
    "fightIQGain" INTEGER NOT NULL DEFAULT 0,
    "aggressionGain" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fighterId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "trainings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fights" (
    "id" TEXT NOT NULL,
    "status" "FightStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "maxRounds" INTEGER NOT NULL DEFAULT 3,
    "venue" TEXT,
    "title" TEXT,
    "fightData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fighter1Id" TEXT NOT NULL,
    "fighter2Id" TEXT NOT NULL,

    CONSTRAINT "fights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fight_results" (
    "id" TEXT NOT NULL,
    "method" "FightMethod" NOT NULL,
    "round" INTEGER,
    "time" TEXT,
    "fighter1Stats" JSONB NOT NULL,
    "fighter2Stats" JSONB NOT NULL,
    "fighter1EloChange" INTEGER NOT NULL,
    "fighter2EloChange" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fightId" TEXT NOT NULL,
    "winnerId" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "fight_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bets" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "side" "BetSide" NOT NULL,
    "odds" DOUBLE PRECISION NOT NULL,
    "status" "BetStatus" NOT NULL DEFAULT 'PENDING',
    "payout" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "fightId" TEXT NOT NULL,
    "fighterId" TEXT,

    CONSTRAINT "bets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_auth0Id_key" ON "users"("auth0Id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "fight_results_fightId_key" ON "fight_results"("fightId");

-- AddForeignKey
ALTER TABLE "fighters" ADD CONSTRAINT "fighters_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "fighters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fights" ADD CONSTRAINT "fights_fighter1Id_fkey" FOREIGN KEY ("fighter1Id") REFERENCES "fighters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fights" ADD CONSTRAINT "fights_fighter2Id_fkey" FOREIGN KEY ("fighter2Id") REFERENCES "fighters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fight_results" ADD CONSTRAINT "fight_results_fightId_fkey" FOREIGN KEY ("fightId") REFERENCES "fights"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fight_results" ADD CONSTRAINT "fight_results_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "fighters"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fight_results" ADD CONSTRAINT "fight_results_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bets" ADD CONSTRAINT "bets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bets" ADD CONSTRAINT "bets_fightId_fkey" FOREIGN KEY ("fightId") REFERENCES "fights"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bets" ADD CONSTRAINT "bets_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "fighters"("id") ON DELETE SET NULL ON UPDATE CASCADE;
