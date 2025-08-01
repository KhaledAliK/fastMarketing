/*
  Warnings:

  - A unique constraint covering the columns `[platformId]` on the table `Video` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `platformId` to the `Video` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "platformId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Video_platformId_key" ON "Video"("platformId");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE CASCADE ON UPDATE CASCADE;
