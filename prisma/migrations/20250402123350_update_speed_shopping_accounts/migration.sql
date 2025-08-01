/*
  Warnings:

  - You are about to drop the column `email` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `Account` table. All the data in the column will be lost.
  - Added the required column `url` to the `Account` table without a default value. This is not possible if the table is not empty.
  - Made the column `username` on table `Account` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Account" DROP COLUMN "email",
DROP COLUMN "phoneNumber",
ADD COLUMN     "url" TEXT NOT NULL,
ALTER COLUMN "username" SET NOT NULL;
