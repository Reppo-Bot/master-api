/*
  Warnings:

  - You are about to drop the column `transactionArchiveId` on the `Parameter` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Parameter" DROP CONSTRAINT "Parameter_transactionArchiveId_fkey";

-- AlterTable
ALTER TABLE "Parameter" DROP COLUMN "transactionArchiveId";

-- CreateTable
CREATE TABLE "ParameterArchive" (
    "transactionid" TEXT NOT NULL,
    "parametername" TEXT NOT NULL,
    "parametervalue" TEXT NOT NULL,

    CONSTRAINT "ParameterArchive_pkey" PRIMARY KEY ("transactionid","parametername")
);

-- AddForeignKey
ALTER TABLE "ParameterArchive" ADD CONSTRAINT "ParameterArchive_transactionid_fkey" FOREIGN KEY ("transactionid") REFERENCES "TransactionArchive"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
