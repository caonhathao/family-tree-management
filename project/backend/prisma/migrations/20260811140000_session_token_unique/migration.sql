-- DropIndex
DROP INDEX "session_userId_userAgent_key";

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");
