/*
  Warnings:

  - You are about to drop the column `createdById` on the `DiscountCode` table. All the data in the column will be lost.
  - You are about to drop the column `discountRate` on the `DiscountCode` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `DiscountCode` table. All the data in the column will be lost.
  - You are about to drop the `_DiscountCodeToRegularUser` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `percentage` to the `DiscountCode` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DiscountCode" DROP CONSTRAINT "DiscountCode_createdById_fkey";

-- DropForeignKey
ALTER TABLE "_DiscountCodeToRegularUser" DROP CONSTRAINT "_DiscountCodeToRegularUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_DiscountCodeToRegularUser" DROP CONSTRAINT "_DiscountCodeToRegularUser_B_fkey";

-- AlterTable
ALTER TABLE "DiscountCode" DROP COLUMN "createdById",
DROP COLUMN "discountRate",
DROP COLUMN "isActive",
ADD COLUMN     "percentage" INTEGER NOT NULL,
ADD COLUMN     "superAdminId" TEXT,
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "_DiscountCodeToRegularUser";

-- AddForeignKey
ALTER TABLE "DiscountCode" ADD CONSTRAINT "DiscountCode_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "SuperAdmin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountCode" ADD CONSTRAINT "DiscountCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "RegularUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
