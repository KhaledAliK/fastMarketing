-- DropForeignKey
ALTER TABLE "Group" DROP CONSTRAINT "Group_creatorId_fkey";

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "SuperAdmin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
