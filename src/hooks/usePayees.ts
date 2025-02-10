import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Payee {
  id: string;
  name: string;
  icon: string;
  accountId: string | null;
  account?: {
    id: string;
    name: string;
    type: "CREDIT" | "DEBIT" | "SAVINGS";
  } | null;
}

interface PayeeFormData {
  name: string;
  icon: string;
  accountId?: string | null;
}

export function usePayees() {
  return useQuery<Payee[]>({
    queryKey: ["payees"],
    queryFn: async () => {
      const response = await fetch("/api/payees");
      if (!response.ok) {
        throw new Error("Failed to fetch payees");
      }
      return response.json();
    },
  });
}

export function useCreatePayee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PayeeFormData) => {
      const response = await fetch("/api/payees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create payee");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payees"] });
    },
  });
}

export function useUpdatePayee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PayeeFormData }) => {
      const response = await fetch(`/api/payees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update payee");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payees"] });
    },
  });
}

export function useDeletePayee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/payees/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete payee");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payees"] });
    },
  });
}
