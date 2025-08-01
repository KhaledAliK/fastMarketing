/*
  Warnings:

  - Added the required column `userId` to the `PlatformProposal` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "PlatformProposal" DROP CONSTRAINT "PlatformProposal_userSubscriptionId_fkey";

-- AlterTable
ALTER TABLE "PlatformProposal" ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "userSubscriptionId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "PlatformProposal" ADD CONSTRAINT "PlatformProposal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "RegularUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformProposal" ADD CONSTRAINT "PlatformProposal_userSubscriptionId_fkey" FOREIGN KEY ("userSubscriptionId") REFERENCES "UserSubscription"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
