/*
  Warnings:

  - A unique constraint covering the columns `[familyId]` on the table `group_family` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "group_family" ADD COLUMN     "familyId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "group_family_familyId_key" ON "group_family"("familyId");

-- AddForeignKey
ALTER TABLE "group_family" ADD CONSTRAINT "group_family_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "family"("id") ON DELETE SET NULL ON UPDATE CASCADE;
