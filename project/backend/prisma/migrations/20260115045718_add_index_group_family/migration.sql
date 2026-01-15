-- DropIndex
DROP INDEX "group_member_memberId_idx";

-- CreateIndex
CREATE INDEX "group_family_userId_familyId_idx" ON "group_family"("userId", "familyId");

-- CreateIndex
CREATE INDEX "group_member_memberId_groupId_idx" ON "group_member"("memberId", "groupId");
