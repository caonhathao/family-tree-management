/*
  Warnings:

  - A unique constraint covering the columns `[memberId,groupId]` on the table `group_member` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "group_member_memberId_groupId_key" ON "group_member"("memberId", "groupId");
