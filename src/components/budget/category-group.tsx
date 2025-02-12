"use client";

import { useState } from "react";
import { BudgetCategory } from "./budget-category";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `group-${group.id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-2">
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
          <div {...attributes} {...listeners}>
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
          </div>
          <h2 className="text-lg font-semibold">{group.name}</h2>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-2 pl-10">
          <SortableContext
            items={group.categories.map((c) => `category-${c.id}`)}
            strategy={verticalListSortingStrategy}
          >
            {group.categories.map((category) => (
              <BudgetCategory
                key={category.id}
                category={category}
                month={month}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}
