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

-- CreateTable
CREATE TABLE "ParameterArchive" (
    "transactionid" TEXT NOT NULL,
    "parametername" TEXT NOT NULL,
    "parametervalue" TEXT NOT NULL,

    CONSTRAINT "ParameterArchive_pkey" PRIMARY KEY ("transactionid","parametername")
);

-- AddForeignKey
ALTER TABLE "TransactionArchive" ADD CONSTRAINT "TransactionArchive_actionid_fkey" FOREIGN KEY ("actionid") REFERENCES "Action"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionArchive" ADD CONSTRAINT "TransactionArchive_senderid_fkey" FOREIGN KEY ("senderid") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionArchive" ADD CONSTRAINT "TransactionArchive_receiverid_fkey" FOREIGN KEY ("receiverid") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParameterArchive" ADD CONSTRAINT "ParameterArchive_transactionid_fkey" FOREIGN KEY ("transactionid") REFERENCES "TransactionArchive"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
