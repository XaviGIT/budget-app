import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ComboboxWithCreate } from "@/components/ui/combobox-with-create";
import { Switch } from "@/components/ui/switch";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories, useCreateCategory } from "@/hooks/useCategories";
import { useCreatePayee, usePayees } from "@/hooks/usePayees";

interface TransactionFormProps {
  onSubmit: (data: {
    date: string;
    accountId: string;
    payeeId: string;
    categoryId: string;
    amount: string;
    memo: string;
  }) => Promise<void>;
  initialData?: {
    date: string;
    accountId: string;
    payeeId: string;
    categoryId: string;
    amount: string;
    memo: string;
    transactionType: "expense" | "income";
  };
  defaultAccountName?: string;
  submitLabel?: string;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSubmit,
  initialData,
  defaultAccountName,
  submitLabel = "Add Transaction",
}) => {
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();
  const { data: payees = [] } = usePayees();
  const createCategory = useCreateCategory();
  const createPayee = useCreatePayee();

  const [formData, setFormData] = useState({
    date: initialData?.date || new Date().toISOString().split("T")[0],
    accountId: initialData?.accountId || "",
    payeeId: initialData?.payeeId || "",
    categoryId: initialData?.categoryId || "",
    amount: initialData?.amount || "",
    memo: initialData?.memo || "",
    transactionType: initialData?.transactionType || "expense",
  });
  const [error, setError] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedPayeeData, setSelectedPayeeData] = useState<any>(null);
  const isTransfer = !!selectedPayeeData?.account;
  const isIncome = formData.transactionType === "income";

  useEffect(() => {
    if (formData.payeeId && payees.length > 0) {
      const payee = payees.find((p) => p.id === formData.payeeId);
      setSelectedPayeeData(payee);
    } else {
      setSelectedPayeeData(null);
    }
  }, [formData.payeeId, payees]);

  useEffect(() => {
    if (defaultAccountName && accounts.length > 0 && !formData.accountId) {
      const defaultAccount = accounts.find(
        (account) => account.name === defaultAccountName
      );
      if (defaultAccount) {
        setFormData((prev) => ({ ...prev, accountId: defaultAccount.id }));
      }
    }
  }, [defaultAccountName, accounts, formData.accountId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Validate required fields
    if (
      !formData.accountId ||
      !formData.payeeId ||
      (!isTransfer && !isIncome && !formData.categoryId)
    ) {
      setError("Please fill in all required fields");
      return;
    }

    // Validate amount
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    try {
      await onSubmit(formData);
      if (!initialData) {
        // Only reset form if it's a create operation
        setFormData({
          date: new Date().toISOString().split("T")[0],
          accountId: "",
          payeeId: "",
          categoryId: "",
          amount: "",
          memo: "",
          transactionType: "expense",
        });
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const accountGroups = [
    {
      label: "Debit Accounts",
      items: accounts
        .filter((account) => account.type === "DEBIT")
        .map((account) => ({ value: account.id, label: account.name })),
    },
    {
      label: "Credit Accounts",
      items: accounts
        .filter((account) => account.type === "CREDIT")
        .map((account) => ({ value: account.id, label: account.name })),
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          type="date"
          value={formData.date}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, date: e.target.value }))
          }
        />
      </div>

      <div>
        <SearchableSelect
          placeholder="Select account"
          value={formData.accountId}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, accountId: value }))
          }
          groups={accountGroups}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="income-toggle"
          checked={formData.transactionType === "income"}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onCheckedChange={(checked: any) =>
            setFormData((prev) => ({
              ...prev,
              transactionType: checked ? "income" : "expense",
            }))
          }
        />
        <label htmlFor="income-toggle" className="text-sm font-medium">
          This is income
        </label>
      </div>

      <div>
        <ComboboxWithCreate
          placeholder="Select payee"
          value={formData.payeeId}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, payeeId: value }))
          }
          options={payees.map((p) => ({ value: p.id, label: p.name }))}
          onCreateNew={async (name) => {
            const result = await createPayee.mutateAsync({
              name,
              icon: name.split(" ")[0],
            });
            return result.id;
          }}
        />
      </div>

      <div>
        {isTransfer && (
          <p className="text-sm text-muted-foreground mt-1">
            Transfers between accounts don&apos;t have categories
          </p>
        )}

        {isIncome && (
          <p className="text-sm text-muted-foreground mt-1">
            Income don&apos;t have categories
          </p>
        )}

        {!isTransfer && !isIncome && (
          <ComboboxWithCreate
            placeholder={
              isTransfer
                ? "Category (optional for transfers)"
                : "Select category"
            }
            value={formData.categoryId}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, categoryId: value }))
            }
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            onCreateNew={async (name) => {
              const result = await createCategory.mutateAsync({
                name,
                icon: "📁",
              });
              return result.id;
            }}
          />
        )}
      </div>

      <div>
        <Input
          type="number"
          step="0.01"
          placeholder="Amount"
          value={formData.amount}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, amount: e.target.value }))
          }
        />
      </div>

      <div>
        <Input
          placeholder="Memo (optional)"
          value={formData.memo}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, memo: e.target.value }))
          }
        />
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="flex justify-end">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
};
