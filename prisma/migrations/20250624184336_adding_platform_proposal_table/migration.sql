-- CreateTable
CREATE TABLE "PlatformProposal" (
    "id" TEXT NOT NULL,
    "userSubscriptionId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "proposal" TEXT NOT NULL,

    CONSTRAINT "PlatformProposal_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlatformProposal" ADD CONSTRAINT "PlatformProposal_userSubscriptionId_fkey" FOREIGN KEY ("userSubscriptionId") REFERENCES "UserSubscription"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformProposal" ADD CONSTRAINT "PlatformProposal_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE CASCADE ON UPDATE CASCADE;
