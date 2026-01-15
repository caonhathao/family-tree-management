/*
  Warnings:

  - Added the required column `userId` to the `group_family` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "group_family" ADD COLUMN     "userId" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "group_family" ADD CONSTRAINT "group_family_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
