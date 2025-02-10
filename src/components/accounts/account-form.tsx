import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AccountFormProps {
  onSubmit: (data: {
    name: string;
    balance: number;
    type: "CREDIT" | "DEBIT" | "SAVINGS";
  }) => Promise<void>;
  initialData?: {
    name: string;
    balance: number;
    type: "CREDIT" | "DEBIT" | "SAVINGS";
  };
  submitLabel?: string;
}

export const AccountForm: React.FC<AccountFormProps> = ({
  onSubmit,
  initialData,
  submitLabel = "Create Account",
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    balance: initialData?.balance?.toString() || "",
    type: initialData?.type || "DEBIT",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Validate name
    if (!formData.name.trim()) {
      setError("Account name is required");
      return;
    }

    // Validate and parse balance
    const balance = parseFloat(formData.balance);
    if (isNaN(balance)) {
      setError("Please enter a valid balance");
      return;
    }

    try {
      await onSubmit({
        ...formData,
        balance,
        type: formData.type as "CREDIT" | "DEBIT" | "SAVINGS",
      });

      if (!initialData) {
        // Only reset form if it's a create operation
        setFormData({ name: "", balance: "", type: "DEBIT" });
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or valid numbers only
    if (value === "" || !isNaN(parseFloat(value))) {
      setFormData((prev) => ({ ...prev, balance: value }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input
          placeholder="Account Name"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
        />
      </div>
      <div className="space-y-2">
        <Input
          type="number"
          step="0.01"
          placeholder="Balance"
          value={formData.balance}
          onChange={handleBalanceChange}
        />
      </div>
      <div className="space-y-2">
        <Select
          value={formData.type}
          onValueChange={(value) =>
            setFormData((prev) => ({
              ...prev,
              type: value as "CREDIT" | "DEBIT" | "SAVINGS",
            }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DEBIT">Debit Account</SelectItem>
            <SelectItem value="CREDIT">Credit Card</SelectItem>
            <SelectItem value="SAVINGS">Savings</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="flex justify-end">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
};

export default AccountForm;
