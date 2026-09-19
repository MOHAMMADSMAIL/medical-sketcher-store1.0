-- Bridge migration: align databases created by 0001/0002 with the phase 1-2 schema.
-- NOTE: PasswordResetToken is created by 0003_password_reset_tokens — do NOT duplicate it here.

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "questions" JSONB,
    "passScore" INTEGER NOT NULL DEFAULT 70,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_slug_key" ON "Lesson"("slug");
CREATE UNIQUE INDEX "Assessment_slug_key" ON "Assessment"("slug");

-- Payment: HyperPay checkout fields
ALTER TABLE "Payment" ADD COLUMN "checkoutId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "resultCode" TEXT;
ALTER TABLE "Payment" ADD COLUMN "resultDescription" TEXT;
ALTER TABLE "Payment" ADD COLUMN "paidAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "Payment_checkoutId_key" ON "Payment"("checkoutId");

-- DownloadPermission: order no longer mandatory
ALTER TABLE "DownloadPermission" ALTER COLUMN "orderId" DROP NOT NULL;

-- Media: optional product + original name + primary flag
ALTER TABLE "Media" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "Media" ADD COLUMN "type" TEXT;
ALTER TABLE "Media" ADD COLUMN "originalName" TEXT;
ALTER TABLE "Media" ADD COLUMN "isPrimary" BOOLEAN NOT NULL DEFAULT false;
