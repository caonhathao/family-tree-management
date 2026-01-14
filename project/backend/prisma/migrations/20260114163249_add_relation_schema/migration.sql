/*
  Warnings:

  - You are about to drop the column `role` on the `user` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `account` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `user_profile` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "group_family" ADD COLUMN     "role" "USER_ROLE" NOT NULL DEFAULT 'OWNER';

-- AlterTable
ALTER TABLE "user" DROP COLUMN "role";

-- CreateIndex
CREATE UNIQUE INDEX "account_userId_key" ON "account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_profile_userId_key" ON "user_profile"("userId");
