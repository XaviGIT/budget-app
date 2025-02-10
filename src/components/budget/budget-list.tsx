"use client";

import { useState } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryGroup } from "./category-group";
import { useBudget } from "@/hooks/useBudget";

export function BudgetList() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: budget, isLoading } = useBudget(format(currentDate, "yyyy-MM"));

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  if (isLoading) return <div className="p-8">Loading budget...</div>;

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Budget</h1>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium">
            {format(currentDate, "MMMM yyyy")}
          </span>
          <Button variant="ghost" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {budget?.groups.map((group) => (
          <CategoryGroup
            key={group.id}
            group={group}
            month={format(currentDate, "yyyy-MM")}
          />
        ))}
      </div>
    </div>
  );
}
