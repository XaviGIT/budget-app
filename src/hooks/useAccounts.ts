import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Account {
  id: string;
  name: string;
  balance: number;
  type: "CREDIT" | "DEBIT" | "SAVINGS";
}

interface AccountFormData {
  name: string;
  balance: number;
  type: "CREDIT" | "DEBIT" | "SAVINGS";
}

export function useAccounts() {
  return useQuery<Account[]>({
    queryKey: ["accounts"],
    queryFn: async () => {
      const response = await fetch("/api/accounts");
      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }
      return response.json();
    },
  });
}

export function useAddAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AccountFormData) => {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create account");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AccountFormData }) => {
      const response = await fetch(`/api/accounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update account");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      transferToAccountId,
    }: {
      id: string;
      transferToAccountId?: string;
    }) => {
      const response = await fetch(`/api/accounts/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transferToAccountId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
