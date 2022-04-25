/*
  Warnings:

  - You are about to drop the column `userId` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Rep` table. All the data in the column will be lost.
  - Added the required column `ownerid` to the `Bot` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_userId_fkey";

-- DropForeignKey
ALTER TABLE "Rep" DROP CONSTRAINT "Rep_userId_fkey";

-- AlterTable
ALTER TABLE "Bot" ADD COLUMN     "ownerid" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Game" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "Rep" DROP COLUMN "userId";

-- CreateTable
CREATE TABLE "SessionTable" (
    "id" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiration" TEXT NOT NULL,
    "ip" TEXT NOT NULL,

    CONSTRAINT "SessionTable_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Bot" ADD CONSTRAINT "Bot_ownerid_fkey" FOREIGN KEY ("ownerid") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_userid_fkey" FOREIGN KEY ("userid") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rep" ADD CONSTRAINT "Rep_userid_fkey" FOREIGN KEY ("userid") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionTable" ADD CONSTRAINT "SessionTable_userid_fkey" FOREIGN KEY ("userid") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
