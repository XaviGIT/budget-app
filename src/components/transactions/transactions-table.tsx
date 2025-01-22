"use client"

import { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"

type Transaction = {
  id: string
  date: Date
  formattedDate: string
  account: {
    name: string
  }
  payee: {
    name: string
  }
  category: {
    name: string
  }
  memo: string | null
  outflow: number | null
  inflow: number | null
}

type Account = {
  id: string
  name: string
}

type Category = {
  id: string
  name: string
}

type Payee = {
  id: string
  name: string
}

type FormData = {
  date: string
  accountId: string
  payeeId: string
  categoryId: string
  amount: string
  memo: string
}

export function TransactionsTable({
  transactions,
  accounts,
  categories,
  payees,
  onAddTransaction
}: {
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
  payees: Payee[]
  onAddTransaction: (data: FormData) => Promise<void>
}) {
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    accountId: '',
    payeeId: '',
    categoryId: '',
    amount: '',
    memo: ''
  })

  const handleSubmit = async () => {
    await onAddTransaction(formData)
    setFormData({
      date: new Date().toISOString().split('T')[0],
      accountId: '',
      payeeId: '',
      categoryId: '',
      amount: '',
      memo: ''
    })
  }

  const accountGroups = useMemo(() => [
    {
      label: "Debit Accounts",
      items: accounts
        .filter(account => account.type === 'DEBIT')
        .map(account => ({
          value: account.id,
          label: account.name
        }))
    },
    {
      label: "Credit Accounts",
      items: accounts
        .filter(account => account.type === 'CREDIT')
        .map(account => ({
          value: account.id,
          label: account.name
        }))
    }
  ], [accounts])

  const payeeItems = useMemo(() =>
    payees.map(payee => ({
      value: payee.id,
      label: payee.name
    }))
  , [payees])

  const categoryItems = useMemo(() =>
    categories.map(category => ({
      value: category.id,
      label: category.name
    }))
  , [categories])

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>{/* Remove whitespace between cells */}
            <TableHead className="w-32">Date</TableHead>
            <TableHead className="w-[20%]">Account</TableHead>
            <TableHead>Payee</TableHead>
            <TableHead className="w-[20%]">Category</TableHead>
            <TableHead className="w-40">Memo</TableHead>
            <TableHead className="w-32 text-right">Amount</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>{/* Remove whitespace between rows */}
          <TableRow className="bg-muted/50">{/* Form row cells with no whitespace */}
            <TableCell>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </TableCell>
            <TableCell>
              <SearchableSelect
                placeholder="Select account"
                value={formData.accountId}
                onChange={(value) => setFormData(prev => ({ ...prev, accountId: value }))}
                groups={accountGroups}
              />
            </TableCell>

            <TableCell>
              <SearchableSelect
                placeholder="Select payee"
                value={formData.payeeId}
                onChange={(value) => setFormData(prev => ({ ...prev, payeeId: value }))}
                items={payeeItems}
              />
            </TableCell>

            <TableCell>
              <SearchableSelect
                placeholder="Select category"
                value={formData.categoryId}
                onChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                items={categoryItems}
              />
            </TableCell>
            <TableCell>
              <Input
                placeholder="Memo"
                value={formData.memo}
                onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
              />
            </TableCell>
            <TableCell>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="text-right"
              />
            </TableCell>
            <TableCell>
              <Button
                onClick={handleSubmit}
                disabled={!formData.accountId || !formData.payeeId || !formData.categoryId || !formData.amount}>
                Add
              </Button>
            </TableCell>
          </TableRow>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                {transaction.formattedDate} {/* Use the formatted date */}
              </TableCell>
              <TableCell>{transaction.account.name}</TableCell>
              <TableCell>{transaction.payee.name}</TableCell>
              <TableCell>{transaction.category.name}</TableCell>
              <TableCell>{transaction.memo}</TableCell>
              <TableCell className={`text-right ${transaction.outflow ? 'text-red-600' : 'text-green-600'}`}>
                {transaction.outflow
                  ? `-${formatCurrency(transaction.outflow)}`
                  : formatCurrency(transaction.inflow || 0)}
              </TableCell>
              <TableCell />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}