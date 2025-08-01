/*
  Warnings:

  - A unique constraint covering the columns `[whatsappJid]` on the table `PlatformGroup` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "PlatformGroup" ADD COLUMN     "whatsappJid" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PlatformGroup_whatsappJid_key" ON "PlatformGroup"("whatsappJid");
