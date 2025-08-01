-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "superAdminId" TEXT NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Video_videoUrl_key" ON "Video"("videoUrl");

-- CreateIndex
CREATE UNIQUE INDEX "Video_publicId_key" ON "Video"("publicId");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_superAdminId_fkey" FOREIGN KEY ("superAdminId") REFERENCES "SuperAdmin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
