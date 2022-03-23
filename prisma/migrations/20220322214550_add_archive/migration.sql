-- AlterTable
ALTER TABLE "Parameter" ADD COLUMN     "transactionArchiveId" TEXT;

-- CreateTable
CREATE TABLE "TransactionArchive" (
    "id" TEXT NOT NULL,
    "serverid" TEXT NOT NULL,
    "senderid" TEXT NOT NULL,
    "receiverid" TEXT,
    "actionid" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionArchive_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TransactionArchive" ADD CONSTRAINT "TransactionArchive_actionid_fkey" FOREIGN KEY ("actionid") REFERENCES "Action"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionArchive" ADD CONSTRAINT "TransactionArchive_senderid_fkey" FOREIGN KEY ("senderid") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionArchive" ADD CONSTRAINT "TransactionArchive_receiverid_fkey" FOREIGN KEY ("receiverid") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parameter" ADD CONSTRAINT "Parameter_transactionArchiveId_fkey" FOREIGN KEY ("transactionArchiveId") REFERENCES "TransactionArchive"("id") ON DELETE SET NULL ON UPDATE CASCADE;
