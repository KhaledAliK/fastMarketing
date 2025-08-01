-- CreateTable
CREATE TABLE "TelegramSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "superAdminId" TEXT,
    "supervisorId" TEXT,
    "salesId" TEXT,
    "session" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramSession_userId_key" ON "TelegramSession"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramSession_superAdminId_key" ON "TelegramSession"("superAdminId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramSession_supervisorId_key" ON "TelegramSession"("supervisorId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramSession_salesId_key" ON "TelegramSession"("salesId");

-- AddForeignKey
ALTER TABLE "TelegramSession" ADD CONSTRAINT "TelegramSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "RegularUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramSession" ADD CONSTRAINT "TelegramSession_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "SuperAdmin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramSession" ADD CONSTRAINT "TelegramSession_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Supervisor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TelegramSession" ADD CONSTRAINT "TelegramSession_salesId_fkey" FOREIGN KEY ("salesId") REFERENCES "Sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;
