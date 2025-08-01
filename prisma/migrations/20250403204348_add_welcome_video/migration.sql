-- CreateTable
CREATE TABLE "WelcomeVideo" (
    "id" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WelcomeVideo_pkey" PRIMARY KEY ("id")
);
