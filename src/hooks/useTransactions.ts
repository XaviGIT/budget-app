import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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

interface TransactionFormData {
  date: string;
  accountId: string;
  payeeId: string;
  categoryId: string;
  amount: string;
  memo: string;
}

export function useTransactions() {
  return useQuery<Transaction[]>({
    queryKey: ["transactions"],
    queryFn: async () => {
      const response = await fetch("/api/transactions");
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }
      return response.json();
    },
  });
}

export function useAddTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create transaction");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      // Also invalidate accounts since balances will change
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: TransactionFormData;
    }) => {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update transaction");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete transaction");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
