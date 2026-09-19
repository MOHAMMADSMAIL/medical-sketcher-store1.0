-- Close schema/migration drift discovered by the integration test:
-- Media.createdAt, Review.archived/rejectionReason existed in schema.prisma
-- but were never created by any migration; money columns drifted to DECIMAL(65,30).

ALTER TABLE "Media" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Review" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "rejectionReason" TEXT;

ALTER TABLE "Order" ALTER COLUMN "total" SET DATA TYPE DECIMAL(65,30);
ALTER TABLE "OrderItem" ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,30);
ALTER TABLE "Payment" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);
ALTER TABLE "Product" ALTER COLUMN "price" SET DATA TYPE DECIMAL(65,30);
