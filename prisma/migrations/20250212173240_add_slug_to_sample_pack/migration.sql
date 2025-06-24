/*
  Warnings:

  - The primary key for the `sample_packs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `samples` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `description` on table `sample_packs` required. This step will fail if there are existing NULL values in that column.
  - Made the column `coverImage` on table `sample_packs` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_sampleId_fkey";

-- DropForeignKey
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_samplePackId_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_sampleId_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_samplePackId_fkey";

-- DropForeignKey
ALTER TABLE "sample_packs" DROP CONSTRAINT "sample_packs_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "samples" DROP CONSTRAINT "samples_samplePackId_fkey";

-- AlterTable
ALTER TABLE "cart_items" ALTER COLUMN "samplePackId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "order_items" ALTER COLUMN "samplePackId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "sample_packs" DROP CONSTRAINT "sample_packs_pkey",
ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "coverImage" SET NOT NULL,
ADD CONSTRAINT "sample_packs_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "sample_packs_id_seq";

-- DropTable
DROP TABLE "samples";

-- CreateTable
CREATE TABLE "Sample" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "waveformData" TEXT,
    "duration" DOUBLE PRECISION NOT NULL,
    "bpm" INTEGER,
    "key" TEXT,
    "tags" TEXT[],
    "kind" "SampleKind" NOT NULL DEFAULT 'ONESHOT',
    "hasWav" BOOLEAN NOT NULL DEFAULT true,
    "hasStems" BOOLEAN NOT NULL DEFAULT false,
    "hasMidi" BOOLEAN NOT NULL DEFAULT false,
    "wavPrice" DOUBLE PRECISION,
    "stemsPrice" DOUBLE PRECISION,
    "midiPrice" DOUBLE PRECISION,
    "samplePackId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sample_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sample_samplePackId_idx" ON "Sample"("samplePackId");

-- AddForeignKey
ALTER TABLE "sample_packs" ADD CONSTRAINT "sample_packs_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "creators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sample" ADD CONSTRAINT "Sample_samplePackId_fkey" FOREIGN KEY ("samplePackId") REFERENCES "sample_packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_samplePackId_fkey" FOREIGN KEY ("samplePackId") REFERENCES "sample_packs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "Sample"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_samplePackId_fkey" FOREIGN KEY ("samplePackId") REFERENCES "sample_packs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "Sample"("id") ON DELETE SET NULL ON UPDATE CASCADE;
