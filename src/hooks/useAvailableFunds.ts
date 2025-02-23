import { useQuery } from "@tanstack/react-query";
import { useAccounts } from "./useAccounts";

export function useAvailableFunds(month: string) {
  const { data: accounts } = useAccounts();

  return useQuery({
    queryKey: ["availableFunds", month],
    queryFn: async () => {
      // Get total from debit and savings accounts
      const totalBalance =
        accounts
          ?.filter(
            (account) => account.type === "DEBIT" || account.type === "SAVINGS"
          )
          .reduce((sum, account) => sum + account.balance, 0) ?? 0;

      // Get total assigned in budget
      const response = await fetch(`/api/budget/${month}`);
      if (!response.ok) {
        throw new Error("Failed to fetch budget assignments");
      }
      const { groups } = await response.json();

      const totalAssigned = groups.reduce(
        (sum: number, group: { categories: Array<{ assigned: number }> }) =>
          sum +
          group.categories.reduce(
            (catSum, category) => catSum + category.assigned,
            0
          ),
        0
      );

      return {
        totalBalance,
        totalAssigned,
        availableToAssign: totalBalance - totalAssigned,
      };
    },
    enabled: !!accounts && !!month,
  });
}
