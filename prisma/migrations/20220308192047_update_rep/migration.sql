/*
  Warnings:

  - A unique constraint covering the columns `[userid,serverid]` on the table `Rep` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Rep_userid_serverid_key" ON "Rep"("userid", "serverid");
