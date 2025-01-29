/*
  Warnings:

  - A unique constraint covering the columns `[accountId]` on the table `payees` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "payees" ADD COLUMN     "accountId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "payees_accountId_key" ON "payees"("accountId");

-- AddForeignKey
ALTER TABLE "payees" ADD CONSTRAINT "payees_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
