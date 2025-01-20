import { TransactionsTable } from "@/components/transactions/transactions-table"
import { prisma } from "@/lib/prisma"

async function getTransactions() {
  "use server"

  const transactions = await prisma.transaction.findMany({
    include: {
      account: {
        select: {
          name: true
        }
      },
      payee: {
        select: {
          name: true
        }
      },
      category: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      date: 'desc'
    }
  })

  return transactions
}

export default async function TransactionsPage() {
  const transactions = await getTransactions()

  return (
    <div className="space-y-4 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Transactions</h1>
      </div>
      <TransactionsTable transactions={transactions} />
    </div>
  )
}