/*
  Warnings:

  - You are about to drop the column `familyId` on the `group_family` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[groupFamilyId]` on the table `family` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `groupFamilyId` to the `family` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "group_family" DROP CONSTRAINT "group_family_familyId_fkey";

-- DropIndex
DROP INDEX "group_family_familyId_idx";

-- DropIndex
DROP INDEX "group_family_familyId_key";

-- AlterTable
ALTER TABLE "family" ADD COLUMN     "groupFamilyId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "group_family" DROP COLUMN "familyId";

-- CreateIndex
CREATE UNIQUE INDEX "family_groupFamilyId_key" ON "family"("groupFamilyId");

-- AddForeignKey
ALTER TABLE "family" ADD CONSTRAINT "family_groupFamilyId_fkey" FOREIGN KEY ("groupFamilyId") REFERENCES "group_family"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
