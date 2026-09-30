-- Safe to apply on the existing production database.
-- Duplicates are removed before the new unique indexes.
-- Nullable exerciseId and dedupeKey values stay nullable, so rows without those values are left alone.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sessionVersion" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" DROP COLUMN IF EXISTS "restMessageId";

CREATE TABLE IF NOT EXISTS "RestTimer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RestTimer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RestTimer_userId_token_key" ON "RestTimer"("userId", "token");

DO $$ BEGIN
  ALTER TABLE "RestTimer" ADD CONSTRAINT "RestTimer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "WorkoutPlan_userId_idx" ON "WorkoutPlan"("userId");
CREATE INDEX IF NOT EXISTS "WorkoutLog_userId_completedAt_idx" ON "WorkoutLog"("userId", "completedAt");
CREATE INDEX IF NOT EXISTS "LogEntry_workoutLogId_idx" ON "LogEntry"("workoutLogId");
CREATE INDEX IF NOT EXISTS "BodyWeightLog_userId_loggedAt_idx" ON "BodyWeightLog"("userId", "loggedAt");

DELETE FROM "PlanExercise" AS duplicate
USING "PlanExercise" AS keep
WHERE duplicate."planId" = keep."planId"
  AND duplicate."exerciseId" IS NOT NULL
  AND duplicate."exerciseId" = keep."exerciseId"
  AND (
    duplicate."order" > keep."order"
    OR (duplicate."order" = keep."order" AND duplicate."id" > keep."id")
  );

CREATE UNIQUE INDEX IF NOT EXISTS "PlanExercise_planId_exerciseId_key" ON "PlanExercise"("planId", "exerciseId");

DROP INDEX IF EXISTS "AppNotification_userId_dedupeKey_idx";

DELETE FROM "AppNotification" AS duplicate
USING "AppNotification" AS keep
WHERE duplicate."userId" = keep."userId"
  AND duplicate."dedupeKey" IS NOT NULL
  AND duplicate."dedupeKey" = keep."dedupeKey"
  AND (
    duplicate."createdAt" > keep."createdAt"
    OR (duplicate."createdAt" = keep."createdAt" AND duplicate."id" > keep."id")
  );

CREATE UNIQUE INDEX IF NOT EXISTS "AppNotification_userId_dedupeKey_key" ON "AppNotification"("userId", "dedupeKey");
