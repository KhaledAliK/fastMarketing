/*
  Warnings:

  - Added the required column `superAdminId` to the `SubscriptionPackage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SubscriptionPackage" ADD COLUMN     "superAdminId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "SubscriptionPackage" ADD CONSTRAINT "SubscriptionPackage_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "SuperAdmin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
