-- DropForeignKey
ALTER TABLE "family" DROP CONSTRAINT "family_groupFamilyId_fkey";

-- AddForeignKey
ALTER TABLE "family" ADD CONSTRAINT "family_groupFamilyId_fkey" FOREIGN KEY ("groupFamilyId") REFERENCES "group_family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
