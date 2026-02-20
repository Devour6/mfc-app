/*
  Warnings:

  - Added the required column `durationMinutes` to the `trainings` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SkinType" AS ENUM ('BODY', 'HEAD', 'GLOVES', 'BOOTS', 'AURA');

-- CreateEnum
CREATE TYPE "SkinRarity" AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID');

-- CreateEnum
CREATE TYPE "TrainingStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "agent_profiles" ADD COLUMN     "ownerId" TEXT;

-- AlterTable
ALTER TABLE "trainings" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "durationMinutes" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "TrainingStatus" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "hours" DROP NOT NULL,
ALTER COLUMN "cost" DROP NOT NULL;

-- Backfill: mark legacy rows as COMPLETED (they were instant credit-based sessions)
UPDATE "trainings" SET "status" = 'COMPLETED', "completedAt" = "createdAt" WHERE "hours" IS NOT NULL;

-- CreateTable
CREATE TABLE "skins" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SkinType" NOT NULL,
    "rarity" "SkinRarity" NOT NULL,
    "priceCredits" DOUBLE PRECISION NOT NULL,
    "pixels" JSONB NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skin_purchases" (
    "id" TEXT NOT NULL,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "skinId" TEXT NOT NULL,
    "fighterId" TEXT NOT NULL,

    CONSTRAINT "skin_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_requests" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "BillingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "agentId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "billing_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "skins_type_idx" ON "skins"("type");

-- CreateIndex
CREATE INDEX "skins_rarity_idx" ON "skins"("rarity");

-- CreateIndex
CREATE INDEX "skin_purchases_userId_idx" ON "skin_purchases"("userId");

-- CreateIndex
CREATE INDEX "skin_purchases_fighterId_idx" ON "skin_purchases"("fighterId");

-- CreateIndex
CREATE UNIQUE INDEX "skin_purchases_userId_skinId_fighterId_key" ON "skin_purchases"("userId", "skinId", "fighterId");

-- CreateIndex
CREATE INDEX "billing_requests_agentId_idx" ON "billing_requests"("agentId");

-- CreateIndex
CREATE INDEX "billing_requests_ownerId_idx" ON "billing_requests"("ownerId");

-- CreateIndex
CREATE INDEX "billing_requests_status_idx" ON "billing_requests"("status");

-- CreateIndex
CREATE INDEX "billing_requests_createdAt_idx" ON "billing_requests"("createdAt");

-- CreateIndex
CREATE INDEX "agent_profiles_ownerId_idx" ON "agent_profiles"("ownerId");

-- CreateIndex
CREATE INDEX "trainings_status_fighterId_idx" ON "trainings"("status", "fighterId");

-- AddForeignKey
ALTER TABLE "agent_profiles" ADD CONSTRAINT "agent_profiles_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skin_purchases" ADD CONSTRAINT "skin_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skin_purchases" ADD CONSTRAINT "skin_purchases_skinId_fkey" FOREIGN KEY ("skinId") REFERENCES "skins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skin_purchases" ADD CONSTRAINT "skin_purchases_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "fighters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_requests" ADD CONSTRAINT "billing_requests_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "agent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_requests" ADD CONSTRAINT "billing_requests_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
