-- CreateTable
CREATE TABLE "AdvisorAdvice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contextHash" TEXT NOT NULL,
    "advice" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvisorAdvice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdvisorAdvice_userId_key" ON "AdvisorAdvice"("userId");

-- CreateIndex
CREATE INDEX "AdvisorAdvice_userId_idx" ON "AdvisorAdvice"("userId");

-- AddForeignKey
ALTER TABLE "AdvisorAdvice" ADD CONSTRAINT "AdvisorAdvice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
