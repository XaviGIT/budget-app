"use client";

import { useState } from "react";
import { GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { useSaveAssignment } from "@/hooks/useBudget";

interface BudgetCategoryProps {
  category: {
    id: string;
    name: string;
    assigned: number;
    spent: number;
  };
  month: string;
}

export function BudgetCategory({ category, month }: BudgetCategoryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [assignedAmount, setAssignedAmount] = useState(
    category.assigned.toString()
  );
  const saveAssignment = useSaveAssignment();

  const handleBlur = async () => {
    setIsEditing(false);
    const amount = parseFloat(assignedAmount);
    if (!isNaN(amount) && amount !== category.assigned) {
      await saveAssignment.mutateAsync({
        categoryId: category.id,
        month,
        amount,
      });
    }
  };

  return (
    <div className="flex items-center gap-4">
      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
      <div className="flex-1">{category.name}</div>
      <div
        className="w-32 text-right cursor-pointer"
        onClick={() => setIsEditing(true)}
      >
        {isEditing ? (
          <Input
            type="number"
            value={assignedAmount}
            onChange={(e) => setAssignedAmount(e.target.value)}
            onBlur={handleBlur}
            className="h-8"
            autoFocus
          />
        ) : (
          formatCurrency(category.assigned)
        )}
      </div>
      <div className="w-32 text-right text-muted-foreground">
        {formatCurrency(category.spent)}
      </div>
      <div
        className={`w-32 text-right ${
          category.assigned - category.spent < 0
            ? "text-red-600"
            : "text-green-600"
        }`}
      >
        {formatCurrency(category.assigned - category.spent)}
      </div>
    </div>
  );
}
