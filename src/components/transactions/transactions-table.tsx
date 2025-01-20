"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"

type Transaction = {
  id: string
  date: Date
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

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Payee</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Memo</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                {format(new Date(transaction.date), 'dd/MM/yyyy')}
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}