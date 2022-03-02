-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL,
    "serverid" TEXT NOT NULL,
    "commandname" TEXT NOT NULL,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "discordid" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bot" (
    "id" TEXT NOT NULL,
    "serverid" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "config" JSONB NOT NULL,

    CONSTRAINT "Bot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "userid" TEXT NOT NULL,
    "gamename" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("userid","gamename")
);

-- CreateTable
CREATE TABLE "Rep" (
    "userid" TEXT NOT NULL,
    "rep" INTEGER NOT NULL,
    "serverid" TEXT NOT NULL,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "unlocktime" INTEGER,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Rep_pkey" PRIMARY KEY ("userid","serverid")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "serverid" TEXT NOT NULL,
    "senderid" TEXT NOT NULL,
    "receiverid" TEXT NOT NULL,
    "actionid" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parameter" (
    "transactionid" TEXT NOT NULL,
    "parametername" TEXT NOT NULL,
    "parametervalue" TEXT NOT NULL,

    CONSTRAINT "Parameter_pkey" PRIMARY KEY ("transactionid","parametername")
);

-- CreateTable
CREATE TABLE "Tags" (
    "userid" TEXT NOT NULL,
    "tagname" TEXT NOT NULL,
    "tagvalue" TEXT NOT NULL,

    CONSTRAINT "Tags_pkey" PRIMARY KEY ("userid","tagname")
);

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rep" ADD CONSTRAINT "Rep_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_actionid_fkey" FOREIGN KEY ("actionid") REFERENCES "Action"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_senderid_fkey" FOREIGN KEY ("senderid") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_receiverid_fkey" FOREIGN KEY ("receiverid") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parameter" ADD CONSTRAINT "Parameter_transactionid_fkey" FOREIGN KEY ("transactionid") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tags" ADD CONSTRAINT "Tags_userid_fkey" FOREIGN KEY ("userid") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
