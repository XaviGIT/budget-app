"use client";

import { useState } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryGroup } from "./category-group";
import { CategoryGroupForm } from "./category-group-form";
import { useBudget, useReorder } from "@/hooks/useBudget";
import { DndContext, DragEndEvent, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateCategoryGroup } from "@/hooks/useCategoryGroups";

export function BudgetList() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { data: budget, isLoading } = useBudget(format(currentDate, "yyyy-MM"));
  const createGroup = useCreateCategoryGroup();
  const reorder = useReorder();
  const queryClient = useQueryClient();

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleCreateGroup = async (data: { name: string }) => {
    try {
      await createGroup.mutateAsync(data);
      toast.success("Category group created");
      setAddDialogOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create group"
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !budget?.groups) return;

    // Extract data from the draggable item's id
    const [activeType, activeId] = active.id.toString().split("-");
    const [, overId] = over.id.toString().split("-");

    if (activeType === "group") {
      const oldIndex = budget.groups.findIndex((g) => g.id === activeId);
      const newIndex = budget.groups.findIndex((g) => g.id === overId);

      if (oldIndex === -1 || newIndex === -1) return;

      // Optimistically update the local state
      const newGroups = [...budget.groups];
      const [movedGroup] = newGroups.splice(oldIndex, 1);
      newGroups.splice(newIndex, 0, movedGroup);

      queryClient.setQueryData(["budget", format(currentDate, "yyyy-MM")], {
        groups: newGroups,
      });

      try {
        await reorder.mutateAsync({
          type: "group",
          items: newGroups.map((g) => g.id),
        });
      } catch (error) {
        console.error("Failed to reorder groups:", error);
        toast.error("Failed to reorder groups");
        queryClient.invalidateQueries({
          queryKey: ["budget", format(currentDate, "yyyy-MM")],
        });
      }
    } else if (activeType === "category") {
      // Find source group (where the category is coming from)
      const sourceGroup = budget.groups.find((g) =>
        g.categories.some((c) => c.id === activeId)
      );

      // Find target group - this could be different if dropping on a category in another group
      // or the same as source group if reordering within the same group
      const overCategory = budget.groups
        .flatMap((g) => g.categories)
        .find((c) => c.id === overId);
      const targetGroup = overCategory
        ? budget.groups.find((g) => g.categories.includes(overCategory))
        : budget.groups.find((g) => g.id === overId); // In case dropping directly on a group

      if (!sourceGroup || !targetGroup) return;

      const oldIndex = sourceGroup.categories.findIndex(
        (c) => c.id === activeId
      );
      const newIndex = overCategory
        ? targetGroup.categories.findIndex((c) => c.id === overId)
        : targetGroup.categories.length; // If dropping directly on a group, append to end

      if (oldIndex === -1) return;

      // Create new arrays for immutability
      const categoryToMove = sourceGroup.categories[oldIndex];
      const sourceCategories = sourceGroup.categories.filter(
        (_, i) => i !== oldIndex
      );
      const targetCategories = [...targetGroup.categories];

      if (overCategory) {
        targetCategories.splice(newIndex, 0, categoryToMove);
      } else {
        targetCategories.push(categoryToMove);
      }

      // Update all groups
      const newGroups = budget.groups.map((g) => {
        if (g.id === sourceGroup.id) {
          return { ...g, categories: sourceCategories };
        }
        if (g.id === targetGroup.id) {
          return { ...g, categories: targetCategories };
        }
        return g;
      });

      // Optimistically update the UI
      queryClient.setQueryData(["budget", format(currentDate, "yyyy-MM")], {
        groups: newGroups,
      });

      try {
        if (sourceGroup.id === targetGroup.id) {
          // Same group - just reorder
          await reorder.mutateAsync({
            type: "category",
            items: targetCategories.map((c) => c.id),
            groupId: targetGroup.id,
          });
        } else {
          // Different groups - move category and reorder
          await reorder.mutateAsync({
            type: "category",
            items: targetCategories.map((c) => c.id),
            groupId: targetGroup.id,
            moveData: {
              categoryId: activeId,
              sourceGroupId: sourceGroup.id,
              targetGroupId: targetGroup.id,
            },
          });
        }
      } catch (error) {
        console.error("Failed to reorder categories:", error);
        toast.error("Failed to reorder categories");
        queryClient.invalidateQueries({
          queryKey: ["budget", format(currentDate, "yyyy-MM")],
        });
      }
    }
  };

  if (isLoading) return <div className="p-8">Loading budget...</div>;

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Budget</h1>
        <div className="flex items-center gap-4">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Group
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Category Group</DialogTitle>
              </DialogHeader>
              <CategoryGroupForm onSubmit={handleCreateGroup} />
            </DialogContent>
          </Dialog>

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
      </div>

      <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
        <SortableContext
          items={budget?.groups.map((g) => `group-${g.id}`) || []}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-6">
            {budget?.groups.map((group) => (
              <CategoryGroup
                key={group.id}
                group={group}
                month={format(currentDate, "yyyy-MM")}
                otherGroups={[]}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
