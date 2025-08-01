-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'SUPERVISOR', 'SALES', 'REGULAR_USER');

-- CreateTable
CREATE TABLE "SuperAdmin" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SUPER_ADMIN',
    "country" TEXT,
    "city" TEXT,
    "image" TEXT DEFAULT 'https://cdn.pixabay.com/photo/2016/04/01/10/11/avatar-1299805_1280.png',
    "phoneNumber" TEXT NOT NULL,
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "verificationTokenId" TEXT,

    CONSTRAINT "SuperAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegularUser" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'REGULAR_USER',
    "country" TEXT,
    "city" TEXT,
    "image" TEXT DEFAULT 'https://cdn.pixabay.com/photo/2016/04/01/10/11/avatar-1299805_1280.png',
    "phoneNumber" TEXT NOT NULL,
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "verificationTokenId" TEXT,

    CONSTRAINT "RegularUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supervisor" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SUPERVISOR',
    "country" TEXT,
    "city" TEXT,
    "image" TEXT DEFAULT 'https://cdn.pixabay.com/photo/2016/04/01/10/11/avatar-1299805_1280.png',
    "phoneNumber" TEXT NOT NULL,
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "verificationTokenId" TEXT,

    CONSTRAINT "Supervisor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sales" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SALES',
    "country" TEXT,
    "city" TEXT,
    "image" TEXT DEFAULT 'https://cdn.pixabay.com/photo/2016/04/01/10/11/avatar-1299805_1280.png',
    "phoneNumber" TEXT NOT NULL,
    "bankName" TEXT,
    "bankAccountNumber" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "supervisorId" TEXT,
    "verificationTokenId" TEXT,

    CONSTRAINT "Sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "salesId" TEXT,
    "supervisorId" TEXT,
    "subscriberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiamondWallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "level" TEXT NOT NULL DEFAULT 'Bronze',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiamondWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" "Role" NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SuperAdmin_email_key" ON "SuperAdmin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "SuperAdmin_phoneNumber_key" ON "SuperAdmin"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RegularUser_email_key" ON "RegularUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RegularUser_phoneNumber_key" ON "RegularUser"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Supervisor_email_key" ON "Supervisor"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Supervisor_phoneNumber_key" ON "Supervisor"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Sales_email_key" ON "Sales"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Sales_phoneNumber_key" ON "Sales"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_subscriberId_key" ON "Referral"("subscriberId");

-- CreateIndex
CREATE UNIQUE INDEX "DiamondWallet_userId_key" ON "DiamondWallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_userId_key" ON "VerificationToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- AddForeignKey
ALTER TABLE "SuperAdmin" ADD CONSTRAINT "SuperAdmin_verificationTokenId_fkey" FOREIGN KEY ("verificationTokenId") REFERENCES "VerificationToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegularUser" ADD CONSTRAINT "RegularUser_verificationTokenId_fkey" FOREIGN KEY ("verificationTokenId") REFERENCES "VerificationToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supervisor" ADD CONSTRAINT "Supervisor_verificationTokenId_fkey" FOREIGN KEY ("verificationTokenId") REFERENCES "VerificationToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sales" ADD CONSTRAINT "Sales_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Supervisor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sales" ADD CONSTRAINT "Sales_verificationTokenId_fkey" FOREIGN KEY ("verificationTokenId") REFERENCES "VerificationToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_salesId_fkey" FOREIGN KEY ("salesId") REFERENCES "Sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "Supervisor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "RegularUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiamondWallet" ADD CONSTRAINT "DiamondWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "RegularUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
