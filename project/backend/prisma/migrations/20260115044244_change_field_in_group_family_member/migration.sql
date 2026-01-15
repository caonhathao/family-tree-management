/*
  Warnings:

  - You are about to drop the column `familyId` on the `group_member` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "group_member" DROP CONSTRAINT "group_member_familyId_fkey";

-- AlterTable
ALTER TABLE "group_member" DROP COLUMN "familyId";
