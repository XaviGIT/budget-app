"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import { BudgetCategory } from "./budget-category";

interface CategoryGroupProps {
  group: {
    id: string;
    name: string;
    categories: Array<{
      id: string;
      name: string;
      assigned: number;
      spent: number;
    }>;
  };
  month: string;
}

export function CategoryGroup({ group, month }: CategoryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
        <div className="flex items-center gap-2 flex-1">
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
          <h2 className="text-lg font-semibold">{group.name}</h2>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-2 pl-10">
          {group.categories.map((category) => (
            <BudgetCategory
              key={category.id}
              category={category}
              month={month}
            />
          ))}
        </div>
      )}
    </div>
  );
}
