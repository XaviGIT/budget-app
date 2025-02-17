import { useState } from "react";
import { BudgetCategory } from "./budget-category";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryGroupForm } from "./category-group-form";
import {
  useUpdateCategoryGroup,
  useDeleteCategoryGroup,
} from "@/hooks/useCategoryGroups";
import { toast } from "sonner";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";

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
  otherGroups: Array<{
    id: string;
    name: string;
  }>;
}

export function CategoryGroup({
  group,
  month,
  otherGroups,
}: CategoryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [transferToGroupId, setTransferToGroupId] = useState<string>("");

  const updateGroup = useUpdateCategoryGroup();
  const deleteGroup = useDeleteCategoryGroup();

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    isDragging,
  } = useSortable({
    id: `group-${group.id}`,
    data: {
      type: "group",
      group,
    },
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `group-drop-${group.id}`,
    data: {
      type: "group",
      id: group.id,
    },
  });

  const style = {
    opacity: isDragging ? 0.5 : 1,
  };

  const handleUpdate = async (data: { name: string }) => {
    try {
      await updateGroup.mutateAsync({
        id: group.id,
        data,
      });
      toast.success("Category group updated");
      setIsEditing(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update category group"
      );
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGroup.mutateAsync({
        id: group.id,
        transferToGroupId: transferToGroupId || undefined,
      });
      toast.success("Category group deleted");
      setIsDeleting(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete category group"
      );
    }
  };

  return (
    <div ref={setSortableRef} style={style} className="space-y-2">
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setIsDeleting(true)}
              className="text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isExpanded && (
        <div
          ref={setDroppableRef}
          className={`space-y-2 pl-10 min-h-[40px] transition-colors p-2
        ${isOver ? "bg-accent/50 rounded-lg border-2 border-dashed border-accent-foreground/20" : ""}`}
        >
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
          {isOver && group.categories.length === 0 && (
            <div className="h-[40px] rounded-md" />
          )}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category Group</DialogTitle>
          </DialogHeader>
          <CategoryGroupForm
            initialData={{
              name: group.name,
            }}
            onSubmit={handleUpdate}
            submitLabel="Update Group"
          />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category group?
              {group.categories.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p>
                    This group has categories. Select a group to transfer them
                    to:
                  </p>
                  <Select
                    value={transferToGroupId}
                    onValueChange={setTransferToGroupId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {otherGroups
                        .filter((g) => g.id !== group.id)
                        .map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            {g.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={group.categories.length > 0 && !transferToGroupId}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
