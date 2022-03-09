/*
  Warnings:

  - The primary key for the `Bot` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Bot` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Bot" DROP CONSTRAINT "Bot_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Bot_pkey" PRIMARY KEY ("serverid");
