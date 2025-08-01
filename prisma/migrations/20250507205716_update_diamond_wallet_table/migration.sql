-- CreateTable
CREATE TABLE "_UserSubscriptionWalletSubscriptions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserSubscriptionWalletSubscriptions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_UserSubscriptionWalletSubscriptions_B_index" ON "_UserSubscriptionWalletSubscriptions"("B");

-- AddForeignKey
ALTER TABLE "_UserSubscriptionWalletSubscriptions" ADD CONSTRAINT "_UserSubscriptionWalletSubscriptions_A_fkey" FOREIGN KEY ("A") REFERENCES "DiamondWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserSubscriptionWalletSubscriptions" ADD CONSTRAINT "_UserSubscriptionWalletSubscriptions_B_fkey" FOREIGN KEY ("B") REFERENCES "UserSubscription"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
