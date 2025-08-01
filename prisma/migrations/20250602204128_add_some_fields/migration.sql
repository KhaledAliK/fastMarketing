/*
  Warnings:

  - Added the required column `platform` to the `UserShareRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ShareReward" ADD COLUMN     "requiredShares" INTEGER NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "UserShareRecord" ADD COLUMN     "platform" TEXT NOT NULL;
