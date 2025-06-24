/*
  Warnings:

  - A unique constraint covering the columns `[cartId,sampleId,samplePackId,format]` on the table `cart_items` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cartId_sampleId_samplePackId_format_key" ON "cart_items"("cartId", "sampleId", "samplePackId", "format");
