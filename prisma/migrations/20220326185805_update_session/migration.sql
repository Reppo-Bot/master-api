/*
  Warnings:

  - You are about to drop the `SessionTable` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SessionTable" DROP CONSTRAINT "SessionTable_userid_fkey";

-- DropTable
DROP TABLE "SessionTable";

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "loggedintime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiration" TIMESTAMP(3) NOT NULL,
    "ip" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionArchive" (
    "id" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "loggedintime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiration" TIMESTAMP(3) NOT NULL,
    "ip" TEXT NOT NULL,

    CONSTRAINT "SessionArchive_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userid_fkey" FOREIGN KEY ("userid") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionArchive" ADD CONSTRAINT "SessionArchive_userid_fkey" FOREIGN KEY ("userid") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
