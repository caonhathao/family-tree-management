/*
  Warnings:

  - You are about to drop the column `updated` on the `user` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AUTH_TYPE" AS ENUM ('LOGIN', 'REGISTER', 'PASSWORD');

-- CreateEnum
CREATE TYPE "PROVIDERS" AS ENUM ('USER', 'GOOGLE', 'GITHUB');

-- CreateEnum
CREATE TYPE "BLOG_MEDIA_TYPE" AS ENUM ('IMAGE', 'VIDEO', 'OTHER');

-- CreateEnum
CREATE TYPE "USER_ROLE" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "GENDERS" AS ENUM ('MALE', 'FEMALE', 'UNKNOWN');

-- DropForeignKey
ALTER TABLE "album" DROP CONSTRAINT "album_familyId_fkey";

-- DropForeignKey
ALTER TABLE "event" DROP CONSTRAINT "event_familyId_fkey";

-- DropForeignKey
ALTER TABLE "relationship" DROP CONSTRAINT "relationship_familyId_fkey";

-- DropForeignKey
ALTER TABLE "session" DROP CONSTRAINT "session_userId_fkey";

-- DropIndex
DROP INDEX "account_userId_key";

-- AlterTable
ALTER TABLE "invite" ADD COLUMN     "targetId" UUID;

-- AlterTable
ALTER TABLE "user" DROP COLUMN "updated",
ADD COLUMN     "role" "USER_ROLE" NOT NULL DEFAULT 'USER',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "user_profile" ADD COLUMN     "address" TEXT,
ADD COLUMN     "gender" "GENDERS" NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN     "memorableName" TEXT,
ALTER COLUMN "biography" SET DATA TYPE TEXT;

-- CreateTable
CREATE TABLE "auth_log" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "type" "AUTH_TYPE" NOT NULL,
    "authBy" "PROVIDERS" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authProvider" (
    "id" UUID NOT NULL,
    "provider" "PROVIDERS" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "accountId" UUID NOT NULL,

    CONSTRAINT "authProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_media" (
    "id" UUID NOT NULL,
    "blogId" UUID,
    "url" TEXT NOT NULL,
    "type" "BLOG_MEDIA_TYPE" NOT NULL DEFAULT 'OTHER',
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AlbumToGroupFamily" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_AlbumToGroupFamily_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_EventToGroupFamily" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_EventToGroupFamily_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "auth_log_accountId_idx" ON "auth_log"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "authProvider_accountId_key" ON "authProvider"("accountId");

-- CreateIndex
CREATE INDEX "authProvider_accountId_idx" ON "authProvider"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "authProvider_accountId_provider_key" ON "authProvider"("accountId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "blog_slug_key" ON "blog"("slug");

-- CreateIndex
CREATE INDEX "_AlbumToGroupFamily_B_index" ON "_AlbumToGroupFamily"("B");

-- CreateIndex
CREATE INDEX "_EventToGroupFamily_B_index" ON "_EventToGroupFamily"("B");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authProvider" ADD CONSTRAINT "authProvider_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog" ADD CONSTRAINT "blog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_media" ADD CONSTRAINT "blog_media_blogId_fkey" FOREIGN KEY ("blogId") REFERENCES "blog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite" ADD CONSTRAINT "invite_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumToGroupFamily" ADD CONSTRAINT "_AlbumToGroupFamily_A_fkey" FOREIGN KEY ("A") REFERENCES "album"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AlbumToGroupFamily" ADD CONSTRAINT "_AlbumToGroupFamily_B_fkey" FOREIGN KEY ("B") REFERENCES "group_family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventToGroupFamily" ADD CONSTRAINT "_EventToGroupFamily_A_fkey" FOREIGN KEY ("A") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventToGroupFamily" ADD CONSTRAINT "_EventToGroupFamily_B_fkey" FOREIGN KEY ("B") REFERENCES "group_family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
