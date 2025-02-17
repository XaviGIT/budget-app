import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface BudgetCategory {
  id: string;
  name: string;
  assigned: number;
  spent: number;
}

interface BudgetGroup {
  id: string;
  name: string;
  categories: BudgetCategory[];
}

interface Budget {
  groups: BudgetGroup[];
}

export function useBudget(month: string) {
  return useQuery<Budget>({
    queryKey: ["budget", month],
    queryFn: async () => {
      const response = await fetch(`/api/budget/${month}`);
      if (!response.ok) {
        throw new Error("Failed to fetch budget");
      }
      return response.json();
    },
  });
}

export function useReorder() {
  return useMutation({
    mutationFn: async ({
      type,
      items,
      groupId,
      moveData,
    }: {
      type: "group" | "category";
      items: string[];
      groupId?: string;
      moveData?: {
        categoryId: string;
        sourceGroupId: string;
        targetGroupId: string;
      };
    }) => {
      const response = await fetch("/api/budget/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, items, groupId, moveData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reorder items");
      }
    },
  });
}

export function useSaveAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      categoryId,
      month,
      amount,
    }: {
      categoryId: string;
      month: string;
      amount: number;
    }) => {
      const response = await fetch(`/api/budget/${month}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, amount }),
      });

      if (!response.ok) {
        throw new Error("Failed to save assignment");
      }
    },
    onSuccess: (_, { month }) => {
      queryClient.invalidateQueries({ queryKey: ["budget", month] });
    },
  });
}
