/*
  Warnings:

  - You are about to drop the column `payee` on the `transactions` table. All the data in the column will be lost.
  - Added the required column `payeeId` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "payee",
ADD COLUMN     "payeeId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "payees" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payees_name_key" ON "payees"("name");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_payeeId_fkey" FOREIGN KEY ("payeeId") REFERENCES "payees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
