"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCurrency } from "@/lib/utils";
import { TransactionForm } from "./transaction-form";
import {
  useUpdateTransaction,
  useDeleteTransaction,
} from "@/hooks/useTransactions";
import { toast } from "sonner";

interface Transaction {
  id: string;
  date: Date;
  accountId: string;
  payeeId: string;
  categoryId: string;
  amount: number;
  memo: string | null;
  toAccountId: string | null;
  account: { name: string };
  payee: { name: string };
  category: { name: string };
}

interface TransactionsTableProps {
  transactions: Transaction[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(
    null
  );

  const updateTransaction = useUpdateTransaction();
  const deleteTransaction = useDeleteTransaction();

  const handleEdit = async (data: {
    date: string;
    accountId: string;
    payeeId: string;
    categoryId: string;
    amount: string;
    memo: string;
  }) => {
    if (!editingTransaction) return;

    try {
      await updateTransaction.mutateAsync({
        id: editingTransaction.id,
        data,
      });
      toast.success("Transaction updated");
      setEditingTransaction(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update transaction"
      );
    }
  };

  const handleDelete = async () => {
    if (!transactionToDelete) return;

    try {
      await deleteTransaction.mutateAsync(transactionToDelete);
      toast.success("Transaction deleted");
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete transaction"
      );
    }
  };

  const formatTransactionAmount = (transaction: Transaction) => {
    if (transaction.toAccountId) {
      return `${formatCurrency(Math.abs(transaction.amount))} → ${transaction.payee.name}`;
    }
    return `-${formatCurrency(Math.abs(transaction.amount))}`;
  };

  return (
    <>
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
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  {format(new Date(transaction.date), "MMM d, yyyy")}
                </TableCell>
                <TableCell>{transaction.account.name}</TableCell>
                <TableCell>{transaction.payee.name}</TableCell>
                <TableCell>{transaction.category.name}</TableCell>
                <TableCell>{transaction.memo}</TableCell>
                <TableCell
                  className={`text-right ${
                    transaction.toAccountId ? "text-blue-600" : "text-red-600"
                  }`}
                >
                  {formatTransactionAmount(transaction)}
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
                        onClick={() => setEditingTransaction(transaction)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => {
                          setTransactionToDelete(transaction.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={editingTransaction !== null}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {editingTransaction && (
            <TransactionForm
              initialData={{
                date: format(new Date(editingTransaction.date), "yyyy-MM-dd"),
                accountId: editingTransaction.accountId,
                payeeId: editingTransaction.payeeId,
                categoryId: editingTransaction.categoryId,
                amount: Math.abs(editingTransaction.amount).toString(),
                memo: editingTransaction.memo || "",
              }}
              onSubmit={handleEdit}
              submitLabel="Update Transaction"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
