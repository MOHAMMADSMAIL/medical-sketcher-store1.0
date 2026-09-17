-- CreateEnum
CREATE TYPE "LearningType" AS ENUM ('READING', 'WRITING', 'LISTENING', 'SPEAKING');

-- CreateEnum
CREATE TYPE "ContentVisibility" AS ENUM ('PUBLIC', 'AUTHENTICATED', 'OWNER_ONLY');

-- CreateTable
CREATE TABLE "LearningContent" (
    "id" TEXT NOT NULL,
    "type" "LearningType" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "body" JSONB,
    "metadata" JSONB,
    "mediaId" TEXT,
    "duration" INTEGER,
    "visibility" "ContentVisibility" NOT NULL DEFAULT 'OWNER_ONLY',
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "order" INTEGER NOT NULL DEFAULT 0,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LearningContent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LearningContent_slug_key" ON "LearningContent"("slug");
CREATE INDEX "LearningContent_type_status_visibility_idx" ON "LearningContent"("type", "status", "visibility");
CREATE INDEX "LearningContent_createdAt_idx" ON "LearningContent"("createdAt");
ALTER TABLE "LearningContent" ADD CONSTRAINT "LearningContent_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
