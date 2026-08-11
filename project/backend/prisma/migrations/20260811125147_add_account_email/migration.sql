-- AlterTable
ALTER TABLE "account" ADD COLUMN     "email" TEXT;

-- Backfill: gán email của user cho các account hiện có
UPDATE "account" a
SET "email" = u."email"
FROM "user" u
WHERE a."userId" = u."id"
  AND a."email" IS NULL;

-- CreateIndex
CREATE INDEX "account_email_idx" ON "account"("email");
