import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2Icon, PencilIcon, ArrowUpRight } from "lucide-react";
import { AccountForm } from "./account-form";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useUpdateAccount, useDeleteAccount } from "@/hooks/useAccounts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

interface AccountCardProps {
  account: {
    id: string;
    name: string;
    balance: number;
    type: "CREDIT" | "DEBIT" | "SAVINGS";
  };
  accounts: Array<{
    id: string;
    name: string;
    type: "CREDIT" | "DEBIT" | "SAVINGS";
    balance: number;
  }>;
}

export function AccountCard({ account, accounts }: AccountCardProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [transferToAccountId, setTransferToAccountId] = useState<string>("");

  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const handleUpdate = async (data: {
    name: string;
    balance: number;
    type: "CREDIT" | "DEBIT" | "SAVINGS";
  }) => {
    try {
      await updateAccount.mutateAsync({ id: account.id, data });
      toast.success("Account updated");
      setUpdateDialogOpen(false);
    } catch {
      toast.error("Failed to update account");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAccount.mutateAsync({
        id: account.id,
        transferToAccountId: transferToAccountId || undefined,
      });
      toast.success("Account deleted");
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete account"
      );
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if clicking on buttons
    if (
      e.target instanceof HTMLElement &&
      (e.target.closest("button") || e.target.closest('[role="button"]'))
    ) {
      return;
    }

    router.push(`/transactions?filter_account=${account.name}`);
  };

  const otherAccounts = accounts?.filter((a) => a.id !== account.id);

  return (
    <>
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={handleCardClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">
            {account.name}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-blue-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setUpdateDialogOpen(true);
              }}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-red-600 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2Icon className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <p
              className={`text-2xl font-bold ${
                account.type === "CREDIT" || account.balance < 0
                  ? "text-red-600"
                  : "text-green-600"
              }`}
            >
              {formatCurrency(account.balance)}
            </p>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          <AccountForm
            initialData={{
              name: account.name,
              balance: account.balance,
              type: account.type,
            }}
            onSubmit={handleUpdate}
            submitLabel="Update Account"
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <div className="space-y-4">
              <p>Are you sure you want to delete this account?</p>
              {otherAccounts?.length > 0 && (
                <div className="space-y-2">
                  <p>Select an account to transfer existing transactions to:</p>
                  <Select
                    value={transferToAccountId}
                    onValueChange={setTransferToAccountId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {otherAccounts?.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAccount.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteAccount.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteAccount.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
