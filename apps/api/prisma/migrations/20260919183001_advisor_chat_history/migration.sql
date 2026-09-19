-- CreateEnum
CREATE TYPE "AdvisorChatRole" AS ENUM ('user', 'assistant');

-- CreateTable
CREATE TABLE "AdvisorChat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AdvisorChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvisorChatMessage" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "AdvisorChatRole" NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AdvisorChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdvisorChat_userId_idx" ON "AdvisorChat"("userId");

-- CreateIndex
CREATE INDEX "AdvisorChat_userId_isActive_updatedAt_idx" ON "AdvisorChat"("userId", "isActive", "updatedAt");

-- CreateIndex
CREATE INDEX "AdvisorChatMessage_chatId_idx" ON "AdvisorChatMessage"("chatId");

-- CreateIndex
CREATE INDEX "AdvisorChatMessage_userId_idx" ON "AdvisorChatMessage"("userId");

-- CreateIndex
CREATE INDEX "AdvisorChatMessage_chatId_isActive_createdAt_idx" ON "AdvisorChatMessage"("chatId", "isActive", "createdAt");

-- AddForeignKey
ALTER TABLE "AdvisorChat" ADD CONSTRAINT "AdvisorChat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvisorChatMessage" ADD CONSTRAINT "AdvisorChatMessage_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "AdvisorChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvisorChatMessage" ADD CONSTRAINT "AdvisorChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
