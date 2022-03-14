/*
  Warnings:

  - The `unlocktime` column on the `Rep` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Rep" DROP COLUMN "unlocktime",
ADD COLUMN     "unlocktime" TIMESTAMP(3);
