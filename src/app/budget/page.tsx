import { BudgetList } from "@/components/budget/budget-list";
import { Suspense } from "react";

export default function BudgetPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading budget...</div>}>
      <BudgetList />
    </Suspense>
  );
}
