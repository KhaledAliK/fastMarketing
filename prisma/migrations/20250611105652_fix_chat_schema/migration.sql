/*
  Warnings:

  - You are about to drop the column `receiverId` on the `ChatMessage` table. All the data in the column will be lost.
  - You are about to drop the column `senderId` on the `ChatMessage` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "fk_receiver_regularuser";

-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "fk_receiver_superadmin";

-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "fk_sender_regularuser";

-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "fk_sender_superadmin";

-- AlterTable
ALTER TABLE "ChatMessage" DROP COLUMN "receiverId",
DROP COLUMN "senderId",
ADD COLUMN     "receiverRegularUserId" TEXT,
ADD COLUMN     "receiverSuperAdminId" TEXT,
ADD COLUMN     "senderRegularUserId" TEXT,
ADD COLUMN     "senderSuperAdminId" TEXT;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "fk_sender_regularuser" FOREIGN KEY ("senderRegularUserId") REFERENCES "RegularUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "fk_sender_superadmin" FOREIGN KEY ("senderSuperAdminId") REFERENCES "SuperAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "fk_receiver_regularuser" FOREIGN KEY ("receiverRegularUserId") REFERENCES "RegularUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "fk_receiver_superadmin" FOREIGN KEY ("receiverSuperAdminId") REFERENCES "SuperAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
