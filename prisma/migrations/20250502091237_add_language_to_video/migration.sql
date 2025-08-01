/*
  Warnings:

  - Added the required column `language` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Language" AS ENUM ('AR', 'EN');

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "language" "Language" NOT NULL;
