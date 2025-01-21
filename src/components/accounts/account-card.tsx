"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

type AccountProps = {
  name: string
  balance: number
  type: 'CREDIT' | 'DEBIT'
}

export function AccountCard({ name, balance, type }: AccountProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${type === 'CREDIT' ? 'text-red-600' : 'text-green-600'}`}>
          {formatCurrency(Math.abs(balance))}
        </p>
      </CardContent>
    </Card>
  )
}