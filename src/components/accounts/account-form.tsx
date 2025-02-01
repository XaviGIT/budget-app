"use client"

import { useState, useTransition } from "react"
import { PencilIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
    type: 'CREDIT' | 'DEBIT' | 'SAVINGS'
  }
  onSubmit: (data: {
    name: string
    balance: number
    type: 'CREDIT' | 'DEBIT' | 'SAVINGS'
  }) => Promise<void>
}

export function AccountForm({ initialData, onSubmit }: AccountFormProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
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
        <Button
          variant={initialData ? "ghost" : "default"}
          size={initialData ? "icon" : "default"}
          disabled={isPending}
          className={initialData ? "text-muted-foreground hover:text-primary transition-colors" : ''}
        >
          {initialData ? <PencilIcon className="h-4 w-4" /> : "Add Account" }
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
              onValueChange={(value: 'CREDIT' | 'DEBIT' | 'SAVINGS') =>
                setFormData(prev => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Assets</SelectLabel>
                  <SelectItem value="DEBIT">Debit Account</SelectItem>
                  <SelectItem value="SAVINGS">Savings/Investment</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Liabilities</SelectLabel>
                  <SelectItem value="CREDIT">Credit Account</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}