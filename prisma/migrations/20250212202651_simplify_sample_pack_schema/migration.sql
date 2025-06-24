/*
  Warnings:

  - You are about to drop the column `hasMidi` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the column `hasStems` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the column `hasWav` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the column `kind` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the column `midiPrice` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the column `stemsPrice` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the column `wavPrice` on the `Sample` table. All the data in the column will be lost.
  - You are about to drop the column `kind` on the `sample_packs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Sample" DROP COLUMN "hasMidi",
DROP COLUMN "hasStems",
DROP COLUMN "hasWav",
DROP COLUMN "kind",
DROP COLUMN "midiPrice",
DROP COLUMN "stemsPrice",
DROP COLUMN "wavPrice";

-- AlterTable
ALTER TABLE "sample_packs" DROP COLUMN "kind",
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'sample-pack';
