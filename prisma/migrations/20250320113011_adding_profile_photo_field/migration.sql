/*
  Warnings:

  - You are about to drop the column `image` on the `RegularUser` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Sales` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `SuperAdmin` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Supervisor` table. All the data in the column will be lost.
  - Added the required column `profilePhoto` to the `RegularUser` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profilePhoto` to the `Sales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profilePhoto` to the `SuperAdmin` table without a default value. This is not possible if the table is not empty.
  - Added the required column `profilePhoto` to the `Supervisor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RegularUser" DROP COLUMN "image",
ADD COLUMN     "profilePhoto" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Sales" DROP COLUMN "image",
ADD COLUMN     "profilePhoto" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "SuperAdmin" DROP COLUMN "image",
ADD COLUMN     "profilePhoto" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "Supervisor" DROP COLUMN "image",
ADD COLUMN     "profilePhoto" JSONB NOT NULL;
