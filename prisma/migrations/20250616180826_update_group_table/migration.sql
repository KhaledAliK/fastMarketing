/*
  Warnings:

  - Added the required column `publicId` to the `Group` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "publicId" TEXT NOT NULL;
