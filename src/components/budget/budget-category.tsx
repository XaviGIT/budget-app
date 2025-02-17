import { useState } from "react";
import { GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  DialogFooter,
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
import { formatCurrency } from "@/lib/utils";
import { useSaveAssignment } from "@/hooks/useBudget";
import { useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories";
import { toast } from "sonner";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditingAssigned, setIsEditingAssigned] = useState(false);
  const [assignedAmount, setAssignedAmount] = useState(
    category.assigned.toString()
  );
  const [editName, setEditName] = useState(category.name);

  const saveAssignment = useSaveAssignment();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `category-${category.id}`,
    data: {
      type: "category",
      category,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleAssignmentBlur = async () => {
    setIsEditingAssigned(false);
    const amount = parseFloat(assignedAmount);
    if (!isNaN(amount) && amount !== category.assigned) {
      try {
        await saveAssignment.mutateAsync({
          categoryId: category.id,
          month,
          amount,
        });
        toast.success("Budget assignment updated");
      } catch {
        toast.error("Failed to update budget assignment");
        setAssignedAmount(category.assigned.toString());
      }
    }
  };

  const handleUpdate = async () => {
    if (!editName.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      await updateCategory.mutateAsync({
        id: category.id,
        data: {
          name: editName,
          icon: "📁", // Keeping the existing icon
        },
      });
      toast.success("Category updated");
      setIsEditing(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update category"
      );
    }
  };

  const handleDelete = async () => {
    if (category.spent > 0) {
      toast.error("Cannot delete category with transactions");
      setIsDeleting(false);
      return;
    }

    try {
      await deleteCategory.mutateAsync(category.id);
      toast.success("Category deleted");
      setIsDeleting(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete category"
      );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 rounded-md p-2 ${
        isDragging ? "opacity-50 bg-accent" : "hover:bg-accent/50"
      }`}
    >
      <div {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
      </div>
      <div className="flex-1">{category.name}</div>
      <div
        className="w-32 text-right cursor-pointer"
        onClick={() => setIsEditingAssigned(true)}
      >
        {isEditingAssigned ? (
          <Input
            type="number"
            value={assignedAmount}
            onChange={(e) => setAssignedAmount(e.target.value)}
            onBlur={handleAssignmentBlur}
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

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Category Name"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot
              be undone.
              {category.spent > 0 && (
                <div className="mt-2 text-red-600">
                  Warning: This category has transactions. Delete them first.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={category.spent > 0}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
