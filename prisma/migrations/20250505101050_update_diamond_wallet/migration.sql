/*
  Warnings:

  - You are about to drop the column `userId` on the `DiamondWallet` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "DiamondWallet" DROP CONSTRAINT "DiamondWallet_userId_fkey";

-- DropIndex
DROP INDEX "DiamondWallet_userId_key";

-- AlterTable
ALTER TABLE "DiamondWallet" DROP COLUMN "userId";
