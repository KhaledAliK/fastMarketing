-- AlterTable
ALTER TABLE "UserShareRecord" ADD COLUMN     "walletId" TEXT;

-- AddForeignKey
ALTER TABLE "UserShareRecord" ADD CONSTRAINT "UserShareRecord_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "DiamondWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
