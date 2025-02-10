import { Suspense } from "react";
import { TransactionsList } from "@/components/transactions/transactions-list";
import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="border rounded-lg">
            <div className="p-4">
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        </div>
      }
    >
      <TransactionsList />
    </Suspense>
  );
}
