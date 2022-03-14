-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_receiverid_fkey";

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "receiverid" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_receiverid_fkey" FOREIGN KEY ("receiverid") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
