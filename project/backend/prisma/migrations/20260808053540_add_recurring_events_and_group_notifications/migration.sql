/*
  Warnings:

  - You are about to drop the column `eventDate` on the `event` table. All the data in the column will be lost.
  - You are about to drop the column `familyId` on the `event` table. All the data in the column will be lost.
  - You are about to drop the `_EventToGroupFamily` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notification` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `endTime` to the `event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `groupId` to the `event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `event` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RECURRENCE_FREQUENCY" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "EVENT_INSTANCE_STATUS" AS ENUM ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'SKIPPED');

-- DropForeignKey
ALTER TABLE "_EventToGroupFamily" DROP CONSTRAINT "_EventToGroupFamily_A_fkey";

-- DropForeignKey
ALTER TABLE "_EventToGroupFamily" DROP CONSTRAINT "_EventToGroupFamily_B_fkey";

-- DropForeignKey
ALTER TABLE "notification" DROP CONSTRAINT "notification_userId_fkey";

-- DropIndex
DROP INDEX "event_eventDate_idx";

-- DropIndex
DROP INDEX "event_familyId_idx";

-- AlterTable
ALTER TABLE "event" DROP COLUMN "eventDate",
DROP COLUMN "familyId",
ADD COLUMN     "endTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "groupId" UUID NOT NULL,
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "isRecurring" SET DEFAULT false,
ALTER COLUMN "type" SET DEFAULT 'OTHER';

-- DropTable
DROP TABLE "_EventToGroupFamily";

-- DropTable
DROP TABLE "notification";

-- CreateTable
CREATE TABLE "event_recurrence" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "freq" "RECURRENCE_FREQUENCY" NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "endsAt" TIMESTAMP(3),
    "count" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_recurrence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_instance" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "EVENT_INSTANCE_STATUS" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_instance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "groupId" UUID,
    "eventId" UUID,
    "eventInstanceId" UUID,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "NOTIFICATION_TYPE" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_recurrence_eventId_key" ON "event_recurrence"("eventId");

-- CreateIndex
CREATE INDEX "event_instance_startTime_status_idx" ON "event_instance"("startTime", "status");

-- CreateIndex
CREATE INDEX "event_instance_endTime_status_idx" ON "event_instance"("endTime", "status");

-- CreateIndex
CREATE UNIQUE INDEX "event_instance_eventId_startTime_key" ON "event_instance"("eventId", "startTime");

-- CreateIndex
CREATE INDEX "group_notification_userId_isRead_idx" ON "group_notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "group_notification_groupId_idx" ON "group_notification"("groupId");

-- CreateIndex
CREATE INDEX "group_notification_userId_createdAt_idx" ON "group_notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "event_groupId_startTime_idx" ON "event"("groupId", "startTime");

-- CreateIndex
CREATE INDEX "event_startTime_idx" ON "event"("startTime");

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group_family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_recurrence" ADD CONSTRAINT "event_recurrence_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_instance" ADD CONSTRAINT "event_instance_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_notification" ADD CONSTRAINT "group_notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_notification" ADD CONSTRAINT "group_notification_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group_family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_notification" ADD CONSTRAINT "group_notification_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_notification" ADD CONSTRAINT "group_notification_eventInstanceId_fkey" FOREIGN KEY ("eventInstanceId") REFERENCES "event_instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
