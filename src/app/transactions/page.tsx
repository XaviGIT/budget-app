import { TransactionsTable } from "@/components/transactions/transactions-table"
import { type Prisma } from '@prisma/client'
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { format } from "date-fns"

async function getData(searchParams?: { [key: string]: string | undefined }) {
  // Parse sort parameter with null check
  const sort = searchParams?.sort || ''
  const [sortField, sortOrder] = sort.split('_')

  // Build where clause for filters
  const where: Prisma.TransactionWhereInput = {}

  // Add filters based on URL parameters
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (key.startsWith('filter_') && value) {
        const field = key.replace('filter_', '')
        if (field === 'account') {
          where.account = { name: { contains: value, mode: 'insensitive' } }
        } else if (field === 'payee') {
          where.payee = { name: { contains: value, mode: 'insensitive' } }
        } else if (field === 'category') {
          where.category = { name: { contains: value, mode: 'insensitive' } }
        } else if (field === 'memo') {
          where.memo = { contains: value, mode: 'insensitive' }
        }
      }
    })
  }

  // Build order by clause
  let orderBy: Prisma.TransactionOrderByWithRelationInput = { date: 'desc' }

  if (sortField) {
    switch (sortField) {
      case 'date':
      case 'memo':
        orderBy = { [sortField]: sortOrder || 'desc' }
        break
      case 'account':
        orderBy = { account: { name: sortOrder || 'asc' } }
        break
      case 'payee':
        orderBy = { payee: { name: sortOrder || 'asc' } }
        break
      case 'category':
        orderBy = { category: { name: sortOrder || 'asc' } }
        break
      case 'amount':
        orderBy = { outflow: sortOrder || 'desc' }
        break
    }
  }

  // Fetch all data in parallel
  const [transactions, accounts, categories, payees] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy,
      include: {
        account: {
          select: { name: true }
        },
        payee: {
          select: { name: true }
        },
        category: {
          select: { name: true }
        }
      }
    }),
    prisma.account.findMany({
      orderBy: { name: 'asc' }
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' }
    }),
    prisma.payee.findMany({
      orderBy: { name: 'asc' }
    })
  ] as const)

  // Format transactions and properly separate emoji from text for sorting
  const formattedTransactions = transactions.map(transaction => {
    // More aggressive cleaning function
    const cleanString = (str: string) => {
      return str
        .replace(/[\p{Emoji_Modifier_Base}\p{Emoji_Modifier}\p{Emoji_Component}\p{Emoji}\uFE0F\s]+/gu, '') // Remove emojis and their modifiers
        .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces and joiners
        .trim()
    }

    return {
      ...transaction,
      formattedDate: format(transaction.date, 'dd/MM/yyyy'),
      sortableAccountName: cleanString(transaction.account.name),
      sortablePayeeName: cleanString(transaction.payee.name),
      sortableCategoryName: cleanString(transaction.category.name)
    }
  })

  // Sort in memory if needed
  if (sortField && ['account', 'payee', 'category'].includes(sortField)) {
    formattedTransactions.sort((a, b) => {
      const sortKeyMap = {
        'account': 'sortableAccountName',
        'payee': 'sortablePayeeName',
        'category': 'sortableCategoryName'
      } as const

      const key = sortKeyMap[sortField as keyof typeof sortKeyMap]
      const aValue = a[key].toLowerCase() // Convert to lowercase for consistent sorting
      const bValue = b[key].toLowerCase()

      return sortOrder === 'desc'
        ? bValue.localeCompare(aValue, 'en', { sensitivity: 'base' })
        : aValue.localeCompare(bValue, 'en', { sensitivity: 'base' })
    })
  }

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

  // Get account details
  const [sourceAccount, payee] = await Promise.all([
    prisma.account.findUnique({ where: { id: data.accountId } }),
    prisma.payee.findUnique({
      where: { id: data.payeeId },
      include: { account: true }
    })
  ])

  if (!sourceAccount) throw new Error("Account not found")

  // Start a transaction to ensure all updates are atomic
  await prisma.$transaction(async (tx) => {
    // Create the transaction record
    await tx.transaction.create({
      data: {
        date: new Date(data.date),
        accountId: data.accountId,
        payeeId: data.payeeId,
        categoryId: data.categoryId,
        memo: data.memo,
        amount: Math.abs(amount), // Always store positive amount
        toAccountId: payee?.account?.id || null
      }
    })

    // Update source account balance
    const sourceBalanceChange = sourceAccount.type === 'CREDIT'
      ? amount  // For credit accounts, positive amount reduces liability
      : -amount // For debit accounts, positive amount reduces balance

    await tx.account.update({
      where: { id: sourceAccount.id },
      data: { balance: { increment: sourceBalanceChange } }
    })

    // If payee is an account, update its balance too
    if (payee?.account) {
      const targetBalanceChange = payee.account.type === 'CREDIT'
        ? -amount // Opposite of source account
        : amount

      await tx.account.update({
        where: { id: payee.account.id },
        data: { balance: { increment: targetBalanceChange } }
      })
    }
  })

  revalidatePath('/transactions')
}

async function deleteTransaction(id: string) {
  'use server'

  // Get the transaction details first
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      account: true,
      payee: {
        include: {
          account: true
        }
      }
    }
  })

  if (!transaction) return

  // Start a transaction to ensure all updates are atomic
  await prisma.$transaction(async (tx) => {
    // Delete the transaction
    await tx.transaction.delete({
      where: { id }
    })

    // Reverse the original transaction's effect on account balances
    const amount = transaction.outflow ? -transaction.outflow : (transaction.inflow || 0)

    // Update source account balance
    const sourceBalanceChange = transaction.account.type === 'CREDIT'
      ? -amount  // Reverse the original effect
      : amount

    await tx.account.update({
      where: { id: transaction.account.id },
      data: { balance: { increment: sourceBalanceChange } }
    })

    // If payee was an account, update its balance too
    if (transaction.payee.account) {
      const targetBalanceChange = transaction.payee.account.type === 'CREDIT'
        ? amount // Reverse the original effect
        : -amount

      await tx.account.update({
        where: { id: transaction.payee.account.id },
        data: { balance: { increment: targetBalanceChange } }
      })
    }
  })

  revalidatePath('/transactions')
}

async function editTransaction(id: string, data: any) {
  'use server'

  const amount = parseFloat(data.amount)

  // Get the original transaction
  const originalTransaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      account: true,
      payee: {
        include: {
          account: true
        }
      }
    }
  })

  if (!originalTransaction) return

  await prisma.$transaction(async (tx) => {
    // First reverse the original transaction's effects
    // ... (similar to delete logic)

    // Then create the new transaction effects
    // ... (similar to create logic)

    // Update the transaction record
    await tx.transaction.update({
      where: { id },
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
  })

  revalidatePath('/transactions')
}

export default async function TransactionsPage({
  searchParams
}: {
  searchParams?: { [key: string]: string | undefined }
}) {
  const { transactions, accounts, categories, payees } = await getData(searchParams)

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
        onDeleteTransaction={deleteTransaction}
        onEditTransaction={editTransaction}
      />
    </div>
  )
}