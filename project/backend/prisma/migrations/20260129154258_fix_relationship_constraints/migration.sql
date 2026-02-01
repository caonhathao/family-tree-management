-- DropForeignKey
ALTER TABLE "relationship" DROP CONSTRAINT "relationship_fromMemberId_fkey";

-- DropForeignKey
ALTER TABLE "relationship" DROP CONSTRAINT "relationship_toMemberId_fkey";

-- DropIndex
DROP INDEX "relationship_fromMemberId_key";

-- DropIndex
DROP INDEX "relationship_toMemberId_key";

-- AddForeignKey
ALTER TABLE "relationship" ADD CONSTRAINT "relationship_fromMemberId_fkey" FOREIGN KEY ("fromMemberId") REFERENCES "family_member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationship" ADD CONSTRAINT "relationship_toMemberId_fkey" FOREIGN KEY ("toMemberId") REFERENCES "family_member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
