/*
  Warnings:

  - Added the required column `countryFlag` to the `Group` table without a default value. This is not possible if the table is not empty.
  - Added the required column `countryName` to the `Group` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "countryFlag" TEXT NOT NULL,
ADD COLUMN     "countryName" TEXT NOT NULL;
