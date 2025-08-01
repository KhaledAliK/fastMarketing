-- CreateTable
CREATE TABLE "_UserWalletSubscriptions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserWalletSubscriptions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_UserWalletSubscriptions_B_index" ON "_UserWalletSubscriptions"("B");

-- AddForeignKey
ALTER TABLE "_UserWalletSubscriptions" ADD CONSTRAINT "_UserWalletSubscriptions_A_fkey" FOREIGN KEY ("A") REFERENCES "DiamondWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserWalletSubscriptions" ADD CONSTRAINT "_UserWalletSubscriptions_B_fkey" FOREIGN KEY ("B") REFERENCES "RegularUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
