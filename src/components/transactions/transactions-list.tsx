"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TransactionsTable } from "./transactions-table";
import { TransactionForm } from "./transaction-form";
import { useTransactions, useAddTransaction } from "@/hooks/useTransactions";
import { toast } from "sonner";

export function TransactionsList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const accountFilter = searchParams.get("filter_account");

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

  const clearAccountFilter = () => {
    router.push("/transactions");
  };

  const filteredTransactions = accountFilter
    ? transactions?.filter((t) => t.account.name === accountFilter)
    : transactions;

  return (
    <div className="space-y-8 p-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {accountFilter && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearAccountFilter}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h1 className="text-3xl font-bold">
            {accountFilter ? `Transactions - ${accountFilter}` : "Transactions"}
          </h1>
        </div>
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
            <TransactionForm
              onSubmit={handleAddTransaction}
              defaultAccountName={accountFilter || undefined}
            />
          </DialogContent>
        </Dialog>
      </div>

      {!filteredTransactions?.length ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground space-y-3">
            <h3 className="text-lg font-medium">No transactions found</h3>
            <p>
              {accountFilter
                ? `No transactions for ${accountFilter}`
                : "Get started by adding your first transaction."}
            </p>
          </div>
        </div>
      ) : (
        <TransactionsTable transactions={filteredTransactions} />
      )}
    </div>
  );
}
