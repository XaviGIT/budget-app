import { useState } from "react";
import { parseISO, differenceInMonths } from "date-fns";
import { GripVertical, MoreHorizontal, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import { useSaveAssignment } from "@/hooks/useBudget";
import { useSortable } from "@dnd-kit/sortable";
import { toast } from "sonner";

type BudgetType = "custom" | "monthly" | "target";

interface BudgetConfig {
  type: BudgetType;
  amount: number;
  targetDate?: string;
  targetAmount?: number;
}

interface BudgetCategoryProps {
  category: {
    id: string;
    name: string;
    assigned: number;
    spent: number;
    budgetConfig?: BudgetConfig;
  };
  month: string;
}

export function BudgetCategory({ category, month }: BudgetCategoryProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [budgetType, setBudgetType] = useState<BudgetType>(
    category.budgetConfig?.type || "custom"
  );
  const [amount, setAmount] = useState(
    category.budgetConfig?.amount?.toString() || "0"
  );
  const [targetDate, setTargetDate] = useState(
    category.budgetConfig?.targetDate || ""
  );
  const [targetAmount, setTargetAmount] = useState(
    category.budgetConfig?.targetAmount?.toString() || ""
  );

  const saveAssignment = useSaveAssignment();

  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id: `category-${category.id}`,
    animateLayoutChanges: () => true,
  });

  const calculateMonthlyTarget = () => {
    if (!targetDate || !targetAmount) return 0;
    const today = new Date();
    const target = parseISO(targetDate);
    const monthsLeft = differenceInMonths(target, today) + 1;
    const amountNeeded = parseFloat(targetAmount);
    return Math.ceil(amountNeeded / monthsLeft);
  };

  const handleSave = async () => {
    try {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      if (budgetType === "target") {
        if (!targetDate || !targetAmount) {
          toast.error("Please enter target date and amount");
          return;
        }
        const parsedTarget = parseFloat(targetAmount);
        if (isNaN(parsedTarget) || parsedTarget < 0) {
          toast.error("Please enter a valid target amount");
          return;
        }
      }

      await saveAssignment.mutateAsync({
        categoryId: category.id,
        month,
        budgetConfig: {
          type: budgetType,
          amount: parsedAmount,
          targetDate: budgetType === "target" ? targetDate : undefined,
          targetAmount:
            budgetType === "target" ? parseFloat(targetAmount) : undefined,
        },
      });

      setIsEditing(false);
      toast.success("Budget updated");
    } catch {
      toast.error("Failed to update budget");
    }
  };

  const displayAmount = () => {
    if (!isEditing) {
      return formatCurrency(category.assigned);
    }

    if (budgetType === "target") {
      const monthlyAmount = calculateMonthlyTarget();
      return formatCurrency(monthlyAmount);
    }

    return formatCurrency(parseFloat(amount) || 0);
  };

  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-4 rounded-md p-2 hover:bg-accent/50"
    >
      <div {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
      </div>

      <div className="flex-1">{category.name}</div>

      {isEditing ? (
        <div className="flex gap-2 items-center">
          <Select
            value={budgetType}
            onValueChange={(value: BudgetType) => setBudgetType(value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Custom</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="target">Target</SelectItem>
            </SelectContent>
          </Select>

          {budgetType === "target" ? (
            <>
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-32"
              />
              <Input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="Target amount"
                className="w-32"
              />
            </>
          ) : (
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-32"
            />
          )}

          <Button onClick={handleSave} size="sm">
            Save
          </Button>
          <Button onClick={() => setIsEditing(false)} variant="ghost" size="sm">
            Cancel
          </Button>
        </div>
      ) : (
        <>
          <div
            className="w-32 text-right cursor-pointer"
            onClick={() => setIsEditing(true)}
          >
            {displayAmount()}
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
        </>
      )}

      <div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Budget
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
