/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `accounts` will be added. If there are existing duplicate values, this will fail.
  - Made the column `icon` on table `payees` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "payees" ALTER COLUMN "icon" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "accounts_name_key" ON "accounts"("name");
