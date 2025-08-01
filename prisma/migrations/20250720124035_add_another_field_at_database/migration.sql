/*
  Warnings:

  - Added the required column `superAdminId` to the `PlatformGroupRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PlatformGroupRequest" ADD COLUMN     "superAdminId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "PlatformGroupRequest" ADD CONSTRAINT "PlatformGroupRequest_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "SuperAdmin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
