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
import { TableHeaderCell } from "@/components/transactions/transactions-table-header-cell"
import { ComboboxWithCreate } from "@/components/ui/combobox-with-create"

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

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      // Check if form is ready to submit
      if (formData.accountId && formData.payeeId && formData.categoryId && formData.amount) {
        await handleSubmit()
      }
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell column="date" title="Date" defaultSort={true} />
            <TableHeaderCell column="account" title="Account" />
            <TableHeaderCell column="payee" title="Payee" />
            <TableHeaderCell column="category" title="Category" />
            <TableHeaderCell column="memo" title="Memo" />
            <TableHeaderCell column="amount" title="Amount" />
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>{/* Form row */}
          <TableRow className="bg-muted/50">{/* Remove whitespace between form cells */}
            <TableCell><Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            /></TableCell>
            <TableCell><SearchableSelect
                placeholder="Select account"
                value={formData.accountId}
                onChange={(value) => setFormData(prev => ({ ...prev, accountId: value }))}
                groups={accountGroups}
            /></TableCell>
            <TableCell><ComboboxWithCreate
                placeholder="Select payee"
                value={formData.payeeId}
                onChange={(value) => setFormData(prev => ({ ...prev, payeeId: value }))}
                options={payees.map(p => ({ value: p.id, label: p.name }))}
                onCreateNew={async (name) => {
                  const response = await fetch('/api/payees', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name,
                      icon: name.split(' ')[0] || '💼',
                      // Don't include accountId for regular payees
                    })
                  })
                  const data = await response.json()
                  return data.id
                }}
            /></TableCell>
            <TableCell><ComboboxWithCreate
                placeholder="Select category"
                value={formData.categoryId}
                onChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                options={categories.map(c => ({ value: c.id, label: c.name }))}
                onCreateNew={async (name) => {
                  const response = await fetch('/api/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, icon: '📁' }) // Default icon
                  })
                  const data = await response.json()
                  return data.id
                }}
            /></TableCell>
            <TableCell><Input
                placeholder="Memo"
                value={formData.memo}
                onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
                onKeyDown={handleKeyDown}
            /></TableCell>
            <TableCell><Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                onKeyDown={handleKeyDown}
                className="text-right"
            /></TableCell>
            <TableCell><Button
                onClick={handleSubmit}
                disabled={!formData.accountId || !formData.payeeId || !formData.categoryId || !formData.amount}>
                Add
            </Button></TableCell>
          </TableRow>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>{/* Remove whitespace between transaction cells */}
              <TableCell>{transaction.formattedDate}</TableCell>
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