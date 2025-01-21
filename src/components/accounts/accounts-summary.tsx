"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

type AccountsSummaryProps = {
  totalAssets: number
  totalLiabilities: number
}

export function AccountsSummary({ totalAssets, totalLiabilities }: AccountsSummaryProps) {
  const netWorth = totalAssets - totalLiabilities

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Total Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(totalAssets)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Total Liabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(totalLiabilities)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Net Worth</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold ${netWorth < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatCurrency(netWorth)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}