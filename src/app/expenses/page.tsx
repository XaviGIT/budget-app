import { ExpensesList } from "@/components/expenses/expenses-list";
import { Suspense } from "react";

export default function ExpensesPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading expenses...</div>}>
      <ExpensesList />
    </Suspense>
  );
}
