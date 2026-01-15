/*
  Warnings:

  - You are about to drop the column `userId` on the `group_family` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "group_family" DROP CONSTRAINT "group_family_userId_fkey";

-- DropIndex
DROP INDEX "group_family_userId_familyId_idx";

-- AlterTable
ALTER TABLE "group_family" DROP COLUMN "userId";

-- CreateIndex
CREATE INDEX "group_family_familyId_idx" ON "group_family"("familyId");
