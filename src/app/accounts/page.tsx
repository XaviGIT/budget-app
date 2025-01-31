import { AccountCard } from "@/components/accounts/account-card"
import { AccountsSummary } from "@/components/accounts/accounts-summary"
import { AccountForm } from "@/components/accounts/account-form"
import { prisma } from "@/lib/prisma"
import { addAccount } from "./actions"

async function getData() {
  const accounts = await prisma.account.findMany({
    orderBy: {
      name: 'asc'
    }
  })

  const totalAssets = accounts
    .filter(account => account.type === 'DEBIT')
    .reduce((sum, account) => sum + account.balance, 0)

  const totalLiabilities = accounts
    .filter(account => account.type === 'CREDIT')
    .reduce((sum, account) => sum + Math.abs(account.balance), 0)

  return {
    accounts,
    totalAssets,
    totalLiabilities
  }
}

export default async function AccountsPage() {
  const { accounts, totalAssets, totalLiabilities } = await getData()

  return (
    <div className="space-y-8 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Accounts</h1>
        <AccountForm onSubmit={addAccount} />
      </div>

      <AccountsSummary
        totalAssets={totalAssets}
        totalLiabilities={totalLiabilities}
      />

      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-green-700">Assets</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {accounts
              .filter(account => account.type === 'DEBIT')
              .map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  accounts={accounts}
                />
            ))}
          </div>
        </div>

        {accounts.some(account => account.type === 'CREDIT') && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-red-700">Liabilities</h2>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {accounts
                .filter(account => account.type === 'CREDIT')
                .map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                  />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}