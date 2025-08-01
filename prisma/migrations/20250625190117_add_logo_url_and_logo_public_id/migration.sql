/*
  Warnings:

  - Added the required column `logoPublicId` to the `Platform` table without a default value. This is not possible if the table is not empty.
  - Made the column `logoUrl` on table `Platform` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Platform" ADD COLUMN     "logoPublicId" TEXT NOT NULL,
ALTER COLUMN "logoUrl" SET NOT NULL;
