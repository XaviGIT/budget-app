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
import { TableHeaderCell } from "@/components/transactions/transactions-table-header-cell"
import { ComboboxWithCreate } from "@/components/ui/combobox-with-create"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { format } from "date-fns"
import { TransactionRowItem } from "./transaction-table-row"
import { AnimatePresence } from "framer-motion"

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
  onAddTransaction,
  onDeleteTransaction,
  onEditTransaction
}: {
  transactions: Transaction[]
  accounts: Account[]
  categories: Category[]
  payees: Payee[]
  onAddTransaction: (data: FormData) => Promise<void>
  onDeleteTransaction: (id: string) => Promise<void>
  onEditTransaction: (id: string, data: any) => Promise<void>
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    accountId: '',
    payeeId: '',
    categoryId: '',
    amount: '',
    memo: ''
  })

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      date: format(new Date(transaction.date), 'yyyy-MM-dd'),
      accountId: transaction.accountId,
      payeeId: transaction.payeeId,
      categoryId: transaction.categoryId,
      amount: transaction.outflow
        ? (-transaction.outflow).toString()
        : transaction.inflow?.toString() || '',
      memo: transaction.memo || ''
    })
  }

  const handleSubmit = async () => {
  if (editingTransaction) {
    await onEditTransaction(editingTransaction.id, formData)
  } else {
    await onAddTransaction(formData)
  }

  // Reset form
  setFormData({
    date: new Date().toISOString().split('T')[0],
    accountId: '',
    payeeId: '',
    categoryId: '',
    amount: '',
    memo: ''
  })
  setEditingTransaction(null)
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
          <AnimatePresence mode="popLayout">
            {transactions.map((transaction) => (
              <TransactionRowItem
                key={transaction.id}
                transaction={transaction}
                accounts={accounts}
                categories={categories}
                payees={payees}
                isEditing={editingId === transaction.id}
                onEdit={() => setEditingId(transaction.id)}
                onSave={async (data) => {
                  await onEditTransaction(transaction.id, data)
                  setEditingId(null)
                }}
                onCancel={() => setEditingId(null)}
                onDelete={(id) => {
                  setTransactionToDelete(id)
                  setDeleteDialogOpen(true)
                }}
              />
            ))}
          </AnimatePresence>
        </TableBody>
      </Table>
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              transaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (transactionToDelete) {
                  await onDeleteTransaction(transactionToDelete)
                  setTransactionToDelete(null)
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}