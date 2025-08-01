/*
  Warnings:

  - You are about to drop the column `userId` on the `Audio` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `PlatformAction` table. All the data in the column will be lost.
  - Added the required column `userSubscriptionId` to the `Audio` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userSubscriptionId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userSubscriptionId` to the `PlatformAction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Audio" DROP CONSTRAINT "Audio_userId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_userId_fkey";

-- DropForeignKey
ALTER TABLE "PlatformAction" DROP CONSTRAINT "PlatformAction_userId_fkey";

-- AlterTable
ALTER TABLE "Audio" DROP COLUMN "userId",
ADD COLUMN     "userSubscriptionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "userId",
ADD COLUMN     "userSubscriptionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PlatformAction" DROP COLUMN "userId",
ADD COLUMN     "userSubscriptionId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "PlatformAction" ADD CONSTRAINT "PlatformAction_userSubscriptionId_fkey" FOREIGN KEY ("userSubscriptionId") REFERENCES "UserSubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userSubscriptionId_fkey" FOREIGN KEY ("userSubscriptionId") REFERENCES "UserSubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audio" ADD CONSTRAINT "Audio_userSubscriptionId_fkey" FOREIGN KEY ("userSubscriptionId") REFERENCES "UserSubscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
