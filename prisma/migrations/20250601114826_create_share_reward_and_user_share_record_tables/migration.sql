-- CreateTable
CREATE TABLE "ShareReward" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "logoUrl" TEXT,
    "diamondReward" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShareReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserShareRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "earnedDiamonds" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserShareRecord_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserShareRecord" ADD CONSTRAINT "UserShareRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "RegularUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserShareRecord" ADD CONSTRAINT "UserShareRecord_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "ShareReward"("id") ON DELETE CASCADE ON UPDATE CASCADE;
