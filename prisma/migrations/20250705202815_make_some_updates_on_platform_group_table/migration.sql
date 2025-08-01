-- DropForeignKey
ALTER TABLE "PlatformGroup" DROP CONSTRAINT "PlatformGroup_userId_fkey";

-- AlterTable
ALTER TABLE "PlatformGroup" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "PlatformGroup" ADD CONSTRAINT "PlatformGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "RegularUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
