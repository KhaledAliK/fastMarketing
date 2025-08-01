-- CreateTable
CREATE TABLE "PlatformChannelRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "link" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "accessHash" TEXT NOT NULL,
    "imageUrl" TEXT,
    "countryId" TEXT NOT NULL,
    "platformId" TEXT NOT NULL,
    "regularUserId" TEXT,
    "supervisorId" TEXT,
    "salesId" TEXT,
    "superAdminId" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformChannelRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PlatformChannelRequest" ADD CONSTRAINT "PlatformChannelRequest_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformChannelRequest" ADD CONSTRAINT "PlatformChannelRequest_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformChannelRequest" ADD CONSTRAINT "PlatformChannelRequest_regularUserId_fkey" FOREIGN KEY ("regularUserId") REFERENCES "RegularUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformChannelRequest" ADD CONSTRAINT "PlatformChannelRequest_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Supervisor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformChannelRequest" ADD CONSTRAINT "PlatformChannelRequest_salesId_fkey" FOREIGN KEY ("salesId") REFERENCES "Sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformChannelRequest" ADD CONSTRAINT "PlatformChannelRequest_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "SuperAdmin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
