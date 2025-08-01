/*
  Warnings:

  - You are about to drop the column `verificationTokenId` on the `RegularUser` table. All the data in the column will be lost.
  - You are about to drop the column `verificationTokenId` on the `Sales` table. All the data in the column will be lost.
  - You are about to drop the column `verificationTokenId` on the `SuperAdmin` table. All the data in the column will be lost.
  - You are about to drop the column `verificationTokenId` on the `Supervisor` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `VerificationToken` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `VerificationToken` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[superAdminId]` on the table `VerificationToken` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[regularUserId]` on the table `VerificationToken` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[supervisorId]` on the table `VerificationToken` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[salesId]` on the table `VerificationToken` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "RegularUser" DROP CONSTRAINT "RegularUser_verificationTokenId_fkey";

-- DropForeignKey
ALTER TABLE "Sales" DROP CONSTRAINT "Sales_verificationTokenId_fkey";

-- DropForeignKey
ALTER TABLE "SuperAdmin" DROP CONSTRAINT "SuperAdmin_verificationTokenId_fkey";

-- DropForeignKey
ALTER TABLE "Supervisor" DROP CONSTRAINT "Supervisor_verificationTokenId_fkey";

-- DropIndex
DROP INDEX "VerificationToken_userId_key";

-- AlterTable
ALTER TABLE "RegularUser" DROP COLUMN "verificationTokenId";

-- AlterTable
ALTER TABLE "Sales" DROP COLUMN "verificationTokenId";

-- AlterTable
ALTER TABLE "SuperAdmin" DROP COLUMN "verificationTokenId";

-- AlterTable
ALTER TABLE "Supervisor" DROP COLUMN "verificationTokenId";

-- AlterTable
ALTER TABLE "VerificationToken" DROP COLUMN "created_at",
DROP COLUMN "userId",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "regularUserId" TEXT,
ADD COLUMN     "salesId" TEXT,
ADD COLUMN     "superAdminId" TEXT,
ADD COLUMN     "supervisorId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_superAdminId_key" ON "VerificationToken"("superAdminId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_regularUserId_key" ON "VerificationToken"("regularUserId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_supervisorId_key" ON "VerificationToken"("supervisorId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_salesId_key" ON "VerificationToken"("salesId");

-- AddForeignKey
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "SuperAdmin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_regularUserId_fkey" FOREIGN KEY ("regularUserId") REFERENCES "RegularUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Supervisor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_salesId_fkey" FOREIGN KEY ("salesId") REFERENCES "Sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
