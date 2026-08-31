-- CreateTable
CREATE TABLE "CalculatorScenario" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CalculatorScenario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalculatorScenario_userId_idx" ON "CalculatorScenario"("userId");

-- CreateIndex
CREATE INDEX "CalculatorScenario_userId_isActive_idx" ON "CalculatorScenario"("userId", "isActive");

-- CreateIndex
CREATE INDEX "CalculatorScenario_userId_type_isActive_idx" ON "CalculatorScenario"("userId", "type", "isActive");

-- AddForeignKey
ALTER TABLE "CalculatorScenario" ADD CONSTRAINT "CalculatorScenario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
