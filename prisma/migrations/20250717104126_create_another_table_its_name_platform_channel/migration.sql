-- CreateTable
CREATE TABLE "PlatformChannel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformChannel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformChannel_link_key" ON "PlatformChannel"("link");

-- AddForeignKey
ALTER TABLE "PlatformChannel" ADD CONSTRAINT "PlatformChannel_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformChannel" ADD CONSTRAINT "PlatformChannel_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "Platform"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformChannel" ADD CONSTRAINT "PlatformChannel_regularUserId_fkey" FOREIGN KEY ("regularUserId") REFERENCES "RegularUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformChannel" ADD CONSTRAINT "PlatformChannel_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Supervisor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformChannel" ADD CONSTRAINT "PlatformChannel_salesId_fkey" FOREIGN KEY ("salesId") REFERENCES "Sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformChannel" ADD CONSTRAINT "PlatformChannel_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "SuperAdmin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
