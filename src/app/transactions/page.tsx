import { TransactionsTable } from "@/components/transactions/transactions-table"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { format } from "date-fns"

async function getData() {
  const [transactions, accounts, categories, payees] = await Promise.all([
    prisma.transaction.findMany({
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
    }),
    prisma.account.findMany({
      orderBy: {
        name: 'asc'
      }
    }),
    prisma.category.findMany({
      orderBy: {
        name: 'asc'
      }
    }),
    prisma.payee.findMany({
      orderBy: {
        name: 'asc'
      }
    })
  ])

  const formattedTransactions = transactions.map(transaction => ({
    ...transaction,
    formattedDate: format(transaction.date, 'dd/MM/yyyy')
  }))

  return {
    transactions: formattedTransactions,
    accounts,
    categories,
    payees
  }
}

async function addTransaction(data: any) {
  'use server'

  const amount = parseFloat(data.amount)

  await prisma.transaction.create({
    data: {
      date: new Date(data.date),
      accountId: data.accountId,
      payeeId: data.payeeId,
      categoryId: data.categoryId,
      memo: data.memo,
      outflow: amount < 0 ? Math.abs(amount) : null,
      inflow: amount > 0 ? amount : null,
    }
  })

  revalidatePath('/transactions')
}

export default async function TransactionsPage() {
  const { transactions, accounts, categories, payees } = await getData()

  return (
    <div className="space-y-4 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Transactions</h1>
      </div>
      <TransactionsTable
        transactions={transactions}
        accounts={accounts}
        categories={categories}
        payees={payees}
        onAddTransaction={addTransaction}
      />
    </div>
  )
}