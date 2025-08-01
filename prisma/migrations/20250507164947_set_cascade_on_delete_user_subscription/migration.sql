/*
  Warnings:

  - The primary key for the `UserSubscription` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `UserSubscription` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `UserSubscription` table. All the data in the column will be lost.
  - The required column `user_id` was added to the `UserSubscription` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "Audio" DROP CONSTRAINT "Audio_userSubscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_userSubscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "PlatformAction" DROP CONSTRAINT "PlatformAction_userSubscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "UserSubscription" DROP CONSTRAINT "UserSubscription_userId_fkey";

-- DropIndex
DROP INDEX "UserSubscription_userId_isActive_key";

-- AlterTable
ALTER TABLE "UserSubscription" DROP CONSTRAINT "UserSubscription_pkey",
DROP COLUMN "id",
DROP COLUMN "userId",
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("user_id");

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "RegularUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformAction" ADD CONSTRAINT "PlatformAction_userSubscriptionId_fkey" FOREIGN KEY ("userSubscriptionId") REFERENCES "UserSubscription"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userSubscriptionId_fkey" FOREIGN KEY ("userSubscriptionId") REFERENCES "UserSubscription"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Audio" ADD CONSTRAINT "Audio_userSubscriptionId_fkey" FOREIGN KEY ("userSubscriptionId") REFERENCES "UserSubscription"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;
