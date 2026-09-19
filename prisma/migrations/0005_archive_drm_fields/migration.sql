-- Archive + DRM fields (Phase: product protection & correctness cleanup)
ALTER TYPE "ProductStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';

ALTER TABLE "Product" ADD COLUMN "archivedAt" TIMESTAMP(3);

ALTER TABLE "DownloadPermission" ADD COLUMN "revokedAt" TIMESTAMP(3),
  ADD COLUMN "maxDownloads" INTEGER,
  ADD COLUMN "downloadCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "DownloadLog" ADD COLUMN "ip" TEXT,
  ADD COLUMN "userAgent" TEXT;
