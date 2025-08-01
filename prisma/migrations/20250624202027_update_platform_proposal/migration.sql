/*
  Warnings:

  - You are about to drop the column `userSubscriptionId` on the `PlatformProposal` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `PlatformProposal` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PlatformProposal" DROP CONSTRAINT "PlatformProposal_userSubscriptionId_fkey";

-- AlterTable
ALTER TABLE "PlatformProposal" DROP COLUMN "userSubscriptionId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
