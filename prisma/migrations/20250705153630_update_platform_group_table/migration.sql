-- AlterTable
ALTER TABLE "PlatformGroup" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "salesId" TEXT,
ADD COLUMN     "superAdminId" TEXT,
ADD COLUMN     "supervisorId" TEXT;

-- AddForeignKey
ALTER TABLE "PlatformGroup" ADD CONSTRAINT "PlatformGroup_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "SuperAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformGroup" ADD CONSTRAINT "PlatformGroup_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Supervisor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformGroup" ADD CONSTRAINT "PlatformGroup_salesId_fkey" FOREIGN KEY ("salesId") REFERENCES "Sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;
