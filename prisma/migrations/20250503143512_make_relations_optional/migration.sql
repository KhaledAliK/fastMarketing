-- DropForeignKey
ALTER TABLE "UserSubscription" DROP CONSTRAINT "UserSubscription_packageId_fkey";

-- AlterTable
ALTER TABLE "UserSubscription" ALTER COLUMN "packageId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "SubscriptionPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
