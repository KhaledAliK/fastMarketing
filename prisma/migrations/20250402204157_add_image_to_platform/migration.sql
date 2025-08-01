/*
  Warnings:

  - Added the required column `platformUrl` to the `Platform` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publicId` to the `Platform` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Platform" ADD COLUMN     "platformUrl" TEXT NOT NULL,
ADD COLUMN     "publicId" TEXT NOT NULL;
