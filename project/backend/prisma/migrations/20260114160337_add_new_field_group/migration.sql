-- DropForeignKey
ALTER TABLE "group_family" DROP CONSTRAINT "group_family_familyId_fkey";

-- AlterTable
ALTER TABLE "group_family" ADD COLUMN     "isLeader" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "group_family" ADD CONSTRAINT "group_family_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "family"("id") ON DELETE SET NULL ON UPDATE CASCADE;
