/*
  Warnings:

  - You are about to drop the column `inflow` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `outflow` on the `transactions` table. All the data in the column will be lost.
  - Added the required column `amount` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('EXPENSE', 'TRANSFER', 'PAYMENT');

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "inflow",
DROP COLUMN "outflow",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "toAccountId" TEXT,
ADD COLUMN     "type" "TransactionType" NOT NULL;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
