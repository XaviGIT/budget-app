"use client";

import { useState } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryGroup } from "./category-group";
import { CategoryGroupForm } from "./category-group-form";
import { useBudget, useReorder } from "@/hooks/useBudget";
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
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  defaultDropAnimation,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateCategoryGroup } from "@/hooks/useCategoryGroups";
import { formatCurrency } from "@/lib/utils";

export function BudgetList() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeData, setActiveData] = useState<any>(null);
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

  // Configure sensors for better drag experience
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Start dragging after moving 8px
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // Store the data of the dragged item for the overlay
    const [type, id] = active.id.toString().split("-");
    if (type === "category") {
      const category = budget?.groups
        .flatMap((g) => g.categories)
        .find((c) => c.id === id);
      setActiveData(category);
    } else if (type === "group") {
      const group = budget?.groups.find((g) => g.id === id);
      setActiveData(group);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !budget?.groups) return;

    // Extract data from the draggable item's id
    const [activeType, activeId] = active.id.toString().split("-");

    if (activeType === "group") {
      const [, overId] = over.id.toString().split("-");
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

      if (!sourceGroup) return;

      // Handle dropping on a group container vs dropping on a category
      let targetGroup;
      let newIndex;

      // Parse the drop target ID
      const fullId = over.id.toString();
      const isGroupDrop = fullId.startsWith("group-drop-");
      const groupId = isGroupDrop
        ? fullId.replace("group-drop-", "")
        : undefined;
      const isCategoryDrop = !isGroupDrop;

      console.log("Drop target analysis:", {
        fullId,
        isGroupDrop,
        groupId,
        isCategoryDrop,
      });

      if (isGroupDrop) {
        // Dropping directly into a group's droppable area
        targetGroup = budget.groups.find((g) => g.id === groupId);
        newIndex = targetGroup?.categories.length || 0;
      } else if (isCategoryDrop) {
        // Dropping onto another category
        const categoryId = fullId.replace("category-", "");
        targetGroup = budget.groups.find((g) =>
          g.categories.some((c) => c.id === categoryId)
        );
        if (targetGroup) {
          newIndex = targetGroup.categories.findIndex(
            (c) => c.id === categoryId
          );
        }
      }

      console.log("Target group:", targetGroup?.name, "New index:", newIndex);

      if (!targetGroup || newIndex === undefined) {
        console.log("No valid target found, aborting drag");
        return;
      }

      // Get the moving category
      const categoryToMove = sourceGroup.categories.find(
        (c) => c.id === activeId
      );
      if (!categoryToMove) return;

      // Create new arrays for immutability
      let sourceCategories = [...sourceGroup.categories];
      let targetCategories = [...targetGroup.categories];

      // Remove from source group
      sourceCategories = sourceCategories.filter((c) => c.id !== activeId);

      // Add to target group at correct position
      if (sourceGroup.id === targetGroup.id) {
        // Same group - just reorder
        targetCategories = sourceCategories; // Reset to source without the moved item
        targetCategories.splice(newIndex, 0, categoryToMove);
      } else {
        // Different groups
        targetCategories.splice(newIndex, 0, categoryToMove);
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
          // Moving between groups
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

    // Reset active states
    setActiveId(null);
    setActiveData(null);
  };

  if (isLoading) return <div className="p-8">Loading budget...</div>;

  const categoryGroups =
    budget?.groups.filter(
      (group) =>
        // Show all groups except empty Uncategorized
        group.name !== "Uncategorized" ||
        (group.name === "Uncategorized" && group.categories.length > 0)
    ) || [];

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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext
          items={categoryGroups.map((g) => `group-${g.id}`) || []}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-6">
            {categoryGroups.map((group) => (
              <CategoryGroup
                key={group.id}
                group={group}
                month={format(currentDate, "yyyy-MM")}
                otherGroups={categoryGroups.filter((g) => g.id !== group.id)}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={defaultDropAnimation}>
          {activeId && activeData && (
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              {activeId.startsWith("category-") ? (
                <div className="flex items-center gap-4">
                  <div className="flex-1">{activeData.name}</div>
                  <div className="w-32 text-right">
                    {formatCurrency(activeData.assigned)}
                  </div>
                  <div className="w-32 text-right text-muted-foreground">
                    {formatCurrency(activeData.spent)}
                  </div>
                  <div className="w-32 text-right">
                    {formatCurrency(activeData.assigned - activeData.spent)}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{activeData.name}</h2>
                </div>
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
