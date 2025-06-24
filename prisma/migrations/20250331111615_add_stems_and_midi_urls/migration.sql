/*
  Warnings:

  - You are about to drop the `Sample` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Sample" DROP CONSTRAINT "Sample_samplePackId_fkey";

-- DropForeignKey
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_sampleId_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_sampleId_fkey";

-- DropTable
DROP TABLE "Sample";

-- CreateTable
CREATE TABLE "samples" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "stemsUrl" TEXT,
    "midiUrl" TEXT,
    "waveformData" TEXT,
    "duration" DOUBLE PRECISION,
    "bpm" INTEGER,
    "key" TEXT,
    "tags" TEXT[],
    "hasWav" BOOLEAN NOT NULL DEFAULT true,
    "hasStems" BOOLEAN NOT NULL DEFAULT false,
    "hasMidi" BOOLEAN NOT NULL DEFAULT false,
    "wavPrice" DOUBLE PRECISION DEFAULT 2.95,
    "stemsPrice" DOUBLE PRECISION DEFAULT 4.95,
    "midiPrice" DOUBLE PRECISION DEFAULT 1.00,
    "format" TEXT,
    "sampleRate" INTEGER,
    "bitDepth" INTEGER,
    "channels" INTEGER,
    "peakAmplitude" DOUBLE PRECISION,
    "samplePackId" INTEGER NOT NULL,

    CONSTRAINT "samples_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "samples_slug_key" ON "samples"("slug");

-- AddForeignKey
ALTER TABLE "samples" ADD CONSTRAINT "samples_samplePackId_fkey" FOREIGN KEY ("samplePackId") REFERENCES "sample_packs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "samples"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "samples"("id") ON DELETE SET NULL ON UPDATE CASCADE;
