-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "inventoryDeducted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "inventoryReserved" BOOLEAN NOT NULL DEFAULT false;
