"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface AccountFormProps {
  initialData?: {
    id: string
    name: string
    balance: number
    type: 'CREDIT' | 'DEBIT'
  }
  onSubmit: (data: {
    name: string
    balance: number
    type: 'CREDIT' | 'DEBIT'
  }) => Promise<void>
}

export function AccountForm({ initialData, onSubmit }: AccountFormProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    balance: initialData?.balance || 0,
    type: initialData?.type || 'DEBIT'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        await onSubmit(formData)
        setOpen(false)
        setFormData({ name: '', balance: 0, type: 'DEBIT' })
        toast.success(initialData ? "Account updated" : "Account created")
      } catch (error) {
        toast.error(initialData ? "Failed to update account" : "Failed to create account")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={initialData ? "ghost" : "default"}>
          {initialData ? "Edit" : "Add Account"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Account" : "Add Account"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Input
              placeholder="Account name (with emoji)"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>
          <div className="grid gap-2">
            <Input
              type="number"
              step="0.01"
              placeholder="Initial balance"
              value={formData.balance}
              onChange={(e) => setFormData(prev => ({ ...prev, balance: parseFloat(e.target.value) }))}
              required
            />
          </div>
          <div className="grid gap-2">
            <Select
              value={formData.type}
              onValueChange={(value: 'CREDIT' | 'DEBIT') =>
                setFormData(prev => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEBIT">Debit</SelectItem>
                <SelectItem value="CREDIT">Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}