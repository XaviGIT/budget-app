import { AccountCard } from "@/components/accounts/account-card"
import { AccountsSummary } from "@/components/accounts/accounts-summary"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

async function getAccounts() {
  const accounts = await prisma.account.findMany({
    orderBy: {
      name: 'asc'
    }
  })

  const debitAccounts = accounts.filter(account => account.type === 'DEBIT')
  const creditAccounts = accounts.filter(account => account.type === 'CREDIT')

  const totalAssets = debitAccounts.reduce((sum, account) => sum + account.balance, 0)
  const totalLiabilities = creditAccounts.reduce((sum, account) => sum + Math.abs(account.balance), 0)

  return {
    debitAccounts,
    creditAccounts,
    totalAssets,
    totalLiabilities
  }
}

export default async function AccountsPage() {
  const { debitAccounts, creditAccounts, totalAssets, totalLiabilities } = await getAccounts()

  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold">Accounts</h1>

      <AccountsSummary
        totalAssets={totalAssets}
        totalLiabilities={totalLiabilities}
      />

      <div className="space-y-8">
        {/* Debit Accounts Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-green-700">Assets</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {debitAccounts.map((account) => (
              <AccountCard
                key={account.id}
                name={account.name}
                balance={account.balance}
                type={account.type}
              />
            ))}
          </div>
        </div>

        {/* Credit Accounts Section */}
        {creditAccounts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-red-700">Liabilities</h2>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {creditAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  name={account.name}
                  balance={account.balance}
                  type={account.type}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}