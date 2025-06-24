/*
  Warnings:

  - You are about to drop the column `tags` on the `samples` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "samples" DROP COLUMN "tags",
ADD COLUMN     "genre" TEXT,
ADD COLUMN     "isProcessed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lufs" DOUBLE PRECISION,
ADD COLUMN     "previewUrl" TEXT,
ADD COLUMN     "truePeak" DOUBLE PRECISION,
ADD COLUMN     "waveformUrl" TEXT;

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sample_downloads" (
    "id" TEXT NOT NULL,
    "sampleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "format" "SampleFormat" NOT NULL DEFAULT 'WAV',

    CONSTRAINT "sample_downloads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SampleTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SampleTags_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "_SampleTags_B_index" ON "_SampleTags"("B");

-- AddForeignKey
ALTER TABLE "sample_downloads" ADD CONSTRAINT "sample_downloads_sampleId_fkey" FOREIGN KEY ("sampleId") REFERENCES "samples"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sample_downloads" ADD CONSTRAINT "sample_downloads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SampleTags" ADD CONSTRAINT "_SampleTags_A_fkey" FOREIGN KEY ("A") REFERENCES "samples"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SampleTags" ADD CONSTRAINT "_SampleTags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
