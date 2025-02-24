"use client";

import { ExpensesCalendar } from "./expenses-calendar";
import { useQuery } from "@tanstack/react-query";

export function ExpensesList() {
  const {
    data: budgets,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const response = await fetch("/api/expenses");
      if (!response.ok) {
        throw new Error("Failed to fetch expenses");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return <div className="p-8">Loading expenses...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-red-500">
        Error loading expenses:{" "}
        {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }

  console.log("Budgets from API:", budgets);

  return <ExpensesCalendar budgets={budgets} />;
}
