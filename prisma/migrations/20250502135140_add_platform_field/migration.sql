/*
  Warnings:

  - Added the required column `platform` to the `Account` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "platform" TEXT NOT NULL,
ALTER COLUMN "username" DROP NOT NULL;
