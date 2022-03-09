/*
  Warnings:

  - A unique constraint covering the columns `[serverid,commandname]` on the table `Action` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Action_serverid_commandname_key" ON "Action"("serverid", "commandname");
