/*
  Warnings:

  - You are about to drop the column `createdById` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `Product` table. All the data in the column will be lost.
  - Added the required column `shopId` to the `InventoryBatch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `Product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopId` to the `Sale` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_ownerId_fkey";

-- DropIndex
DROP INDEX "Product_createdById_idx";

-- DropIndex
DROP INDEX "Product_ownerId_idx";

-- AlterTable
ALTER TABLE "InventoryBatch" ADD COLUMN     "shopId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shopId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "createdById",
DROP COLUMN "ownerId",
ADD COLUMN     "shopId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "shopId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "blockedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Shop_ownerId_idx" ON "Shop"("ownerId");

-- CreateIndex
CREATE INDEX "InventoryBatch_shopId_idx" ON "InventoryBatch"("shopId");

-- CreateIndex
CREATE INDEX "Order_shopId_idx" ON "Order"("shopId");

-- CreateIndex
CREATE INDEX "Product_shopId_idx" ON "Product"("shopId");

-- CreateIndex
CREATE INDEX "Sale_shopId_createdAt_idx" ON "Sale"("shopId", "createdAt");

-- AddForeignKey
ALTER TABLE "Shop" ADD CONSTRAINT "Shop_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryBatch" ADD CONSTRAINT "InventoryBatch_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
