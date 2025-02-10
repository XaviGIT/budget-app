"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TransactionsTable } from "./transactions-table";
import { useTransactions, useAddTransaction } from "@/hooks/useTransactions";
import { TransactionForm } from "./transaction-form";

export function TransactionsList() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { data: transactions, isLoading, error } = useTransactions();
  const addTransaction = useAddTransaction();

  if (isLoading) {
    return <div className="p-8">Loading transactions...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Error loading transactions</div>;
  }

  const handleAddTransaction = async (data: {
    date: string;
    accountId: string;
    payeeId: string;
    categoryId: string;
    amount: string;
    memo: string;
  }) => {
    try {
      await addTransaction.mutateAsync(data);
      toast.success("Transaction added");
      setAddDialogOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add transaction"
      );
    }
  };

  return (
    <div className="space-y-8 p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Transaction</DialogTitle>
            </DialogHeader>
            <TransactionForm onSubmit={handleAddTransaction} />
          </DialogContent>
        </Dialog>
      </div>

      {!transactions?.length ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground space-y-3">
            <h3 className="text-lg font-medium">No transactions yet</h3>
            <p>Get started by adding your first transaction.</p>
          </div>
        </div>
      ) : (
        <TransactionsTable transactions={transactions} />
      )}
    </div>
  );
}
