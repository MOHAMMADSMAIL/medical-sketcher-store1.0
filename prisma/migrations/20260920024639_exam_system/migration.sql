-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "audioMediaId" TEXT,
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'de',
ADD COLUMN     "level" TEXT,
ADD COLUMN     "skill" TEXT,
ADD COLUMN     "sourceProductId" TEXT;

-- CreateTable
CREATE TABLE "ExamAttempt" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "answers" JSONB,
    "score" INTEGER,
    "passed" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExamAttempt_assessmentId_userId_idx" ON "ExamAttempt"("assessmentId", "userId");

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_sourceProductId_fkey" FOREIGN KEY ("sourceProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_audioMediaId_fkey" FOREIGN KEY ("audioMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
