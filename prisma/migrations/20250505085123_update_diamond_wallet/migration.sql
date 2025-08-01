/*
  Warnings:

  - You are about to drop the column `level` on the `DiamondWallet` table. All the data in the column will be lost.
  - You are about to drop the column `points` on the `DiamondWallet` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `DiamondWallet` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DiamondWallet" DROP COLUMN "level",
DROP COLUMN "points",
ADD COLUMN     "diamondCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "priceSAR" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "priceUSD" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
