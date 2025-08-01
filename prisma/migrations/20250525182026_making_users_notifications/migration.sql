-- CreateEnum
CREATE TYPE "UserNotificationType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "UserNotificationAudience" AS ENUM ('ALL', 'REGULAR_USER', 'USER_SUBSCRIPTION');

-- CreateTable
CREATE TABLE "UserNotification" (
    "id" TEXT NOT NULL,
    "message" TEXT,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "type" "UserNotificationType" NOT NULL,
    "audience" "UserNotificationAudience" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserNotification_pkey" PRIMARY KEY ("id")
);
