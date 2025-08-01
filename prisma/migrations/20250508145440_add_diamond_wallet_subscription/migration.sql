-- CreateTable
CREATE TABLE "DiamondWalletSubscription" (
    "id" TEXT NOT NULL,
    "diamondCount" INTEGER NOT NULL DEFAULT 0,
    "walletId" TEXT NOT NULL,
    "userId" TEXT,
    "userSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiamondWalletSubscription_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DiamondWalletSubscription" ADD CONSTRAINT "DiamondWalletSubscription_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "DiamondWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiamondWalletSubscription" ADD CONSTRAINT "DiamondWalletSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "RegularUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiamondWalletSubscription" ADD CONSTRAINT "DiamondWalletSubscription_userSubscriptionId_fkey" FOREIGN KEY ("userSubscriptionId") REFERENCES "UserSubscription"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
