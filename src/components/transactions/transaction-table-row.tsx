"use client"

import { format } from "date-fns"
import { MoreHorizontal, Pencil, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TableCell } from "@/components/ui/table"
import { ComboboxWithCreate } from "@/components/ui/combobox-with-create"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency } from "@/lib/utils"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner" // We'll need to install this
import { motion } from "framer-motion" // And this

interface TransactionRowProps {
  transaction: {
    id: string
    formattedDate: string
    account: { name: string }
    payee: { name: string }
    category: { name: string }
    memo: string | null
    outflow: number | null
    inflow: number | null
    accountId: string
    payeeId: string
    categoryId: string
    date: Date
  }
  isEditing: boolean
  accounts: { id: string; name: string }[]
  categories: { id: string; name: string }[]
  payees: { id: string; name: string }[]
  onEdit: () => void
  onSave: (data: any) => Promise<void>
  onCancel: () => void
  onDelete: (id: string) => void
}

export function TransactionRowItem({
  transaction,
  isEditing,
  accounts,
  categories,
  payees,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: TransactionRowProps) {
  const [editData, setEditData] = useState({
    date: format(new Date(transaction.date), 'yyyy-MM-dd'),
    accountId: transaction.accountId,
    payeeId: transaction.payeeId,
    categoryId: transaction.categoryId,
    amount: transaction.outflow
      ? (-transaction.outflow).toString()
      : transaction.inflow?.toString() || '',
    memo: transaction.memo || ''
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isEditing) return

    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (!isSaving) {
          try {
            setIsSaving(true)
            await onSave(editData)
            toast.success('Transaction updated')
          } catch (error) {
            toast.error('Failed to update transaction')
          } finally {
            setIsSaving(false)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isEditing, editData, isSaving, onSave, onCancel])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await onSave(editData)
      toast.success('Transaction updated')
    } catch (error) {
      toast.error('Failed to update transaction')
    } finally {
      setIsSaving(false)
    }
  }

  if (isEditing) {
    return (
      <motion.tr
        initial={{ backgroundColor: "var(--background)" }}
        animate={{ backgroundColor: "var(--muted)" }}
        exit={{ backgroundColor: "var(--background)" }}
        className="relative"
      >
        <TableCell>
          <Input
            type="date"
            value={editData.date}
            onChange={(e) => setEditData(prev => ({ ...prev, date: e.target.value }))}
            className="h-8"
          />
        </TableCell>
        <TableCell>
          <ComboboxWithCreate
            placeholder="Select account"
            value={editData.accountId}
            onChange={(value) => setEditData(prev => ({ ...prev, accountId: value }))}
            options={accounts.map(a => ({ value: a.id, label: a.name }))}
            onCreateNew={async () => ""}
          />
        </TableCell>
        <TableCell>
          <ComboboxWithCreate
            placeholder="Select payee"
            value={editData.payeeId}
            onChange={(value) => setEditData(prev => ({ ...prev, payeeId: value }))}
            options={payees.map(p => ({ value: p.id, label: p.name }))}
            onCreateNew={async (name) => {
              const response = await fetch('/api/payees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, icon: name.split(' ')[0] || '💼' })
              })
              const data = await response.json()
              return data.id
            }}
          />
        </TableCell>
        <TableCell>
          <ComboboxWithCreate
            placeholder="Select category"
            value={editData.categoryId}
            onChange={(value) => setEditData(prev => ({ ...prev, categoryId: value }))}
            options={categories.map(c => ({ value: c.id, label: c.name }))}
            onCreateNew={async (name) => {
              const response = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, icon: name.split(' ')[0] || '📁' })
              })
              const data = await response.json()
              return data.id
            }}
          />
        </TableCell>
        <TableCell>
          <Input
            placeholder="Memo"
            value={editData.memo}
            onChange={(e) => setEditData(prev => ({ ...prev, memo: e.target.value }))}
            className="h-8"
          />
        </TableCell>
        <TableCell>
          <Input
            type="number"
            step="0.01"
            value={editData.amount}
            onChange={(e) => setEditData(prev => ({ ...prev, amount: e.target.value }))}
            className="h-8 text-right"
          />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </TableCell>
      </motion.tr>
    )
  }

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
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
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={onEdit}
              className="cursor-pointer"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(transaction.id)}
              className="cursor-pointer text-red-600"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </motion.tr>
  )
}