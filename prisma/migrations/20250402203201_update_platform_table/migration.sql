/*
  Warnings:

  - You are about to drop the column `platformId` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `iconUrl` on the `Platform` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Platform` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_platformId_fkey";

-- AlterTable
ALTER TABLE "Account" DROP COLUMN "platformId";

-- AlterTable
ALTER TABLE "Platform" DROP COLUMN "iconUrl",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
