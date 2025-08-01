-- CreateTable
CREATE TABLE "UserNotificationRecord" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "regularUserId" TEXT,
    "userSubscriptionId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserNotificationRecord_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserNotificationRecord" ADD CONSTRAINT "UserNotificationRecord_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "UserNotification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotificationRecord" ADD CONSTRAINT "UserNotificationRecord_regularUserId_fkey" FOREIGN KEY ("regularUserId") REFERENCES "RegularUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotificationRecord" ADD CONSTRAINT "UserNotificationRecord_userSubscriptionId_fkey" FOREIGN KEY ("userSubscriptionId") REFERENCES "UserSubscription"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
