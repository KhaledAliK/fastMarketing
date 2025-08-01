/*
  Warnings:

  - You are about to drop the column `duration` on the `SubscriptionPackage` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `SubscriptionPackage` table. All the data in the column will be lost.
  - Added the required column `priceSAR` to the `SubscriptionPackage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceUSD` to the `SubscriptionPackage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `SubscriptionPackage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SubscriptionPackage" DROP COLUMN "duration",
DROP COLUMN "price",
ADD COLUMN     "durationInDays" INTEGER NOT NULL DEFAULT 28,
ADD COLUMN     "features" TEXT[],
ADD COLUMN     "freeHours" INTEGER,
ADD COLUMN     "priceSAR" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "priceUSD" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
