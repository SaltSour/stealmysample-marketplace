/*
  Warnings:

  - The `samplePackId` column on the `cart_items` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `samplePackId` column on the `order_items` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `sample_packs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `sample_packs` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[uuid]` on the table `sample_packs` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `samplePackId` on the `Sample` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - The required column `uuid` was added to the `sample_packs` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "Sample" DROP CONSTRAINT "Sample_samplePackId_fkey";

-- DropForeignKey
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_samplePackId_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_samplePackId_fkey";

-- AlterTable
ALTER TABLE "Sample" ADD COLUMN     "bitDepth" INTEGER NOT NULL DEFAULT 16,
ADD COLUMN     "channels" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "format" TEXT NOT NULL DEFAULT 'wav',
ADD COLUMN     "peakAmplitude" DOUBLE PRECISION,
ADD COLUMN     "sampleRate" INTEGER NOT NULL DEFAULT 44100,
DROP COLUMN "samplePackId",
ADD COLUMN     "samplePackId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "cart_items" DROP COLUMN "samplePackId",
ADD COLUMN     "samplePackId" INTEGER;

-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "samplePackId",
ADD COLUMN     "samplePackId" INTEGER;

-- AlterTable
ALTER TABLE "sample_packs" ADD COLUMN "uuid" TEXT;

-- AlterTable
UPDATE "sample_packs" SET "uuid" = gen_random_uuid()::text WHERE "uuid" IS NULL;

-- AlterTable
ALTER TABLE "sample_packs" ALTER COLUMN "uuid" SET NOT NULL;

-- AlterTable
ALTER TABLE "sample_packs" ADD COLUMN "new_id" SERIAL;

-- AlterTable
UPDATE "Sample" SET "samplePackId" = sp."new_id"
FROM "sample_packs" sp WHERE "Sample"."samplePackId"::text = sp.id;

-- AlterTable
UPDATE "cart_items" SET "samplePackId" = sp."new_id"
FROM "sample_packs" sp WHERE "cart_items"."samplePackId"::text = sp.id;

-- AlterTable
UPDATE "order_items" SET "samplePackId" = sp."new_id"
FROM "sample_packs" sp WHERE "order_items"."samplePackId"::text = sp.id;

-- AlterTable
ALTER TABLE "sample_packs" DROP CONSTRAINT "sample_packs_pkey";

-- AlterTable
ALTER TABLE "sample_packs" DROP COLUMN "id";

-- AlterTable
ALTER TABLE "sample_packs" RENAME COLUMN "new_id" TO "id";

-- AlterTable
ALTER TABLE "sample_packs" ADD PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Sample" ALTER COLUMN "samplePackId" TYPE INTEGER USING "samplePackId"::integer;

-- AlterTable
ALTER TABLE "cart_items" ALTER COLUMN "samplePackId" TYPE INTEGER USING "samplePackId"::integer;

-- AlterTable
ALTER TABLE "order_items" ALTER COLUMN "samplePackId" TYPE INTEGER USING "samplePackId"::integer;

-- CreateIndex
CREATE INDEX "Sample_samplePackId_idx" ON "Sample"("samplePackId");

-- CreateIndex
CREATE UNIQUE INDEX "sample_packs_uuid_key" ON "sample_packs"("uuid");

-- AddForeignKey
ALTER TABLE "Sample" ADD CONSTRAINT "Sample_samplePackId_fkey" FOREIGN KEY ("samplePackId") REFERENCES "sample_packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_samplePackId_fkey" FOREIGN KEY ("samplePackId") REFERENCES "sample_packs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_samplePackId_fkey" FOREIGN KEY ("samplePackId") REFERENCES "sample_packs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
