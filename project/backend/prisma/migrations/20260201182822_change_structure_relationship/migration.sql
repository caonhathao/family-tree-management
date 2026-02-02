/*
  Warnings:

  - A unique constraint covering the columns `[fromMemberId,toMemberId,type]` on the table `relationship` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "relationship_fromMemberId_toMemberId_idx";

-- DropIndex
DROP INDEX "relationship_fromMemberId_toMemberId_type_idx";

-- CreateIndex
CREATE UNIQUE INDEX "relationship_fromMemberId_toMemberId_type_key" ON "relationship"("fromMemberId", "toMemberId", "type");
