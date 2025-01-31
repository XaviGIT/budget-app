"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AccountForm } from "./account-form"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"
import { deleteAccount, updateAccount } from "@/app/accounts/actions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

interface AccountCardProps {
  account: {
    id: string
    name: string
    balance: number
    type: 'CREDIT' | 'DEBIT'
  }
  accounts: Array<{
    id: string
    name: string
    type: 'CREDIT' | 'DEBIT'
    balance: number
  }>
}

export function AccountCard({ account, accounts }: AccountCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [transferToAccountId, setTransferToAccountId] = useState<string>('')
  const [isPending, startTransition] = useTransition()

  const handleUpdate = async (data: { name: string, balance: number, type: 'CREDIT' | 'DEBIT' }) => {
    startTransition(async () => {
      try {
        console.log('Update data:', data)
        await updateAccount(account.id, data)
        toast.success("Account updated")
      } catch (error) {
        console.error('Update error:', error)
        toast.error("Failed to update account")
      }
    })
  }

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        await deleteAccount(account.id, transferToAccountId || undefined)
        toast.success("Account deleted")
        setDeleteDialogOpen(false)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete account")
      }
    })
  }

  const otherAccounts = accounts?.filter(a => a.id !== account.id)

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">{account.name}</CardTitle>
          <div className="flex gap-2">
            <AccountForm
              initialData={account}
              onSubmit={handleUpdate}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isPending}
            >
              Delete
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold ${
            account.balance < 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            {formatCurrency(account.balance)}
          </p>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <div className="space-y-4">
              <p>Are you sure you want to delete this account?</p>
              {otherAccounts?.length > 0 && (
                <div className="space-y-2">
                  <p>Select an account to transfer existing transactions to:</p>
                  <Select value={transferToAccountId} onValueChange={setTransferToAccountId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {otherAccounts?.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}