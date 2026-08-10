-- CreateEnum
CREATE TYPE "EMAIL_KIND" AS ENUM ('TODAY', 'REMINDER');

-- CreateEnum
CREATE TYPE "EMAIL_STATUS" AS ENUM ('SENT', 'FAILED');

-- CreateTable
CREATE TABLE "email_log" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "eventInstanceId" UUID NOT NULL,
    "kind" "EMAIL_KIND" NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "EMAIL_STATUS" NOT NULL,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_log_userId_kind_idx" ON "email_log"("userId", "kind");

-- CreateIndex
CREATE INDEX "email_log_eventInstanceId_kind_idx" ON "email_log"("eventInstanceId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "email_log_eventInstanceId_userId_kind_key" ON "email_log"("eventInstanceId", "userId", "kind");

-- AddForeignKey
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_log" ADD CONSTRAINT "email_log_eventInstanceId_fkey" FOREIGN KEY ("eventInstanceId") REFERENCES "event_instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
