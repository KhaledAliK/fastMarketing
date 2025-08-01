/*
  Warnings:

  - You are about to drop the column `mediaUrl` on the `ShareReward` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ShareReward" DROP COLUMN "mediaUrl",
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "videoUrl" TEXT;
