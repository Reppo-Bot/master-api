-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_serverid_fkey" FOREIGN KEY ("serverid") REFERENCES "Bot"("serverid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionArchive" ADD CONSTRAINT "TransactionArchive_serverid_fkey" FOREIGN KEY ("serverid") REFERENCES "Bot"("serverid") ON DELETE RESTRICT ON UPDATE CASCADE;
