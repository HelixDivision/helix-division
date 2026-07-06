/*
  Warnings:

  - Added the required column `variantLabelSnapshot` to the `order_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "imageSnapshot" TEXT,
ADD COLUMN     "variantLabelSnapshot" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "instructionsJson" JSONB;
