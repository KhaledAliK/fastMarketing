/*
  Warnings:

  - Added the required column `countryCode` to the `RegularUser` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RegularUser" ADD COLUMN     "countryCode" TEXT NOT NULL;
