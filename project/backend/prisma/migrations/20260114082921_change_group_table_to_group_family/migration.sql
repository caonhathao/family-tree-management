/*
  Warnings:

  - You are about to drop the `group` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "group" DROP CONSTRAINT "group_familyId_fkey";

-- DropForeignKey
ALTER TABLE "group" DROP CONSTRAINT "group_memberId_fkey";

-- DropTable
DROP TABLE "group";

-- CreateTable
CREATE TABLE "group_family" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "memberId" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_family_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "group_family_memberId_idx" ON "group_family"("memberId");

-- AddForeignKey
ALTER TABLE "group_family" ADD CONSTRAINT "group_family_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_family" ADD CONSTRAINT "group_family_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
