-- DropForeignKey
ALTER TABLE "bets" DROP CONSTRAINT "bets_userId_fkey";

-- DropForeignKey
ALTER TABLE "fight_results" DROP CONSTRAINT "fight_results_fightId_fkey";

-- DropForeignKey
ALTER TABLE "fighters" DROP CONSTRAINT "fighters_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "trainings" DROP CONSTRAINT "trainings_fighterId_fkey";

-- DropForeignKey
ALTER TABLE "trainings" DROP CONSTRAINT "trainings_userId_fkey";

-- CreateIndex
CREATE INDEX "bets_userId_idx" ON "bets"("userId");

-- CreateIndex
CREATE INDEX "bets_fightId_idx" ON "bets"("fightId");

-- CreateIndex
CREATE INDEX "bets_status_idx" ON "bets"("status");

-- CreateIndex
CREATE INDEX "bets_userId_status_idx" ON "bets"("userId", "status");

-- CreateIndex
CREATE INDEX "bets_fightId_status_idx" ON "bets"("fightId", "status");

-- CreateIndex
CREATE INDEX "bets_createdAt_idx" ON "bets"("createdAt");

-- CreateIndex
CREATE INDEX "fight_results_winnerId_idx" ON "fight_results"("winnerId");

-- CreateIndex
CREATE INDEX "fight_results_userId_idx" ON "fight_results"("userId");

-- CreateIndex
CREATE INDEX "fight_results_createdAt_idx" ON "fight_results"("createdAt");

-- CreateIndex
CREATE INDEX "fighters_ownerId_idx" ON "fighters"("ownerId");

-- CreateIndex
CREATE INDEX "fighters_elo_idx" ON "fighters"("elo" DESC);

-- CreateIndex
CREATE INDEX "fighters_class_isActive_idx" ON "fighters"("class", "isActive");

-- CreateIndex
CREATE INDEX "fighters_isActive_elo_idx" ON "fighters"("isActive", "elo" DESC);

-- CreateIndex
CREATE INDEX "fighters_createdAt_idx" ON "fighters"("createdAt");

-- CreateIndex
CREATE INDEX "fights_status_idx" ON "fights"("status");

-- CreateIndex
CREATE INDEX "fights_fighter1Id_idx" ON "fights"("fighter1Id");

-- CreateIndex
CREATE INDEX "fights_fighter2Id_idx" ON "fights"("fighter2Id");

-- CreateIndex
CREATE INDEX "fights_scheduledAt_idx" ON "fights"("scheduledAt");

-- CreateIndex
CREATE INDEX "fights_status_scheduledAt_idx" ON "fights"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "trainings_fighterId_idx" ON "trainings"("fighterId");

-- CreateIndex
CREATE INDEX "trainings_userId_idx" ON "trainings"("userId");

-- CreateIndex
CREATE INDEX "trainings_createdAt_idx" ON "trainings"("createdAt");

-- CreateIndex
CREATE INDEX "users_auth0Id_idx" ON "users"("auth0Id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- AddForeignKey
ALTER TABLE "fighters" ADD CONSTRAINT "fighters_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "fighters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fight_results" ADD CONSTRAINT "fight_results_fightId_fkey" FOREIGN KEY ("fightId") REFERENCES "fights"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bets" ADD CONSTRAINT "bets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
