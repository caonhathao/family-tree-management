/*
  Warnings:

  - The `role` column on the `group_member` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "MEMBER_ROLE" AS ENUM ('OWNER', 'EDITOR', 'VIEWER');

-- AlterTable
ALTER TABLE "group_member" DROP COLUMN "role",
ADD COLUMN     "role" "MEMBER_ROLE" NOT NULL DEFAULT 'OWNER';

-- DropEnum
DROP TYPE "USER_ROLE";
