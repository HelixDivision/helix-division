-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoTitle" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "shippedAt" TIMESTAMP(3),
ADD COLUMN     "trackingCarrier" TEXT,
ADD COLUMN     "trackingNumber" TEXT;
