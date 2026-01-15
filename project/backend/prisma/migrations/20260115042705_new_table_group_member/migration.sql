/*
  Warnings:

  - You are about to drop the column `familyId` on the `group_family` table. All the data in the column will be lost.
  - You are about to drop the column `isLeader` on the `group_family` table. All the data in the column will be lost.
  - You are about to drop the column `memberId` on the `group_family` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `group_family` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "group_family" DROP CONSTRAINT "group_family_familyId_fkey";

-- DropForeignKey
ALTER TABLE "group_family" DROP CONSTRAINT "group_family_memberId_fkey";

-- DropIndex
DROP INDEX "group_family_memberId_idx";

-- AlterTable
ALTER TABLE "group_family" DROP COLUMN "familyId",
DROP COLUMN "isLeader",
DROP COLUMN "memberId",
DROP COLUMN "role";

-- CreateTable
CREATE TABLE "group_member" (
    "id" UUID NOT NULL,
    "role" "USER_ROLE" NOT NULL DEFAULT 'OWNER',
    "groupId" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "familyId" UUID,
    "isLeader" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "group_member_memberId_idx" ON "group_member"("memberId");

-- AddForeignKey
ALTER TABLE "group_member" ADD CONSTRAINT "group_member_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group_family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_member" ADD CONSTRAINT "group_member_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_member" ADD CONSTRAINT "group_member_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "family"("id") ON DELETE SET NULL ON UPDATE CASCADE;
