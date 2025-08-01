/*
  Warnings:

  - You are about to drop the column `receiverSuperAdminId` on the `ChatMessage` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "fk_receiver_superadmin";

-- AlterTable
ALTER TABLE "ChatMessage" DROP COLUMN "receiverSuperAdminId";
