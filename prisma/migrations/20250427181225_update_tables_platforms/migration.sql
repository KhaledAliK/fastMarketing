-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "SubscriptionType" AS ENUM ('FREE', 'MONTHLY', 'YEARLY', 'TRIAL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_MESSAGE', 'NEW_GROUP_INVITE', 'GROUP_UPDATE');

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "description" TEXT,
ADD COLUMN     "groupImageUrl" TEXT;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
ADD COLUMN     "videoUrl" TEXT;

-- AlterTable
ALTER TABLE "UserSubscription" ADD COLUMN     "subscriptionType" "SubscriptionType" NOT NULL DEFAULT 'MONTHLY';

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "notificationType" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "RegularUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
