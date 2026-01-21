/*
  Warnings:

  - A unique constraint covering the columns `[userId,userAgent]` on the table `session` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "session_token_key";

-- CreateIndex
CREATE UNIQUE INDEX "session_userId_userAgent_key" ON "session"("userId", "userAgent");
