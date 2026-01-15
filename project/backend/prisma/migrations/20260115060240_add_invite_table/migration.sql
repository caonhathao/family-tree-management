-- CreateTable
CREATE TABLE "invite" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "groupId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invite_token_key" ON "invite"("token");

-- CreateIndex
CREATE INDEX "invite_token_idx" ON "invite"("token");

-- AddForeignKey
ALTER TABLE "invite" ADD CONSTRAINT "invite_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "group_family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite" ADD CONSTRAINT "invite_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
