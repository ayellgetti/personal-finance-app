-- CreateTable
CREATE TABLE "FreedomScenario" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FreedomScenario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FreedomScenario_userId_isActive_idx" ON "FreedomScenario"("userId", "isActive");

-- AddForeignKey
ALTER TABLE "FreedomScenario" ADD CONSTRAINT "FreedomScenario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
