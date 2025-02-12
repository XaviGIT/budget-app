import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CategoryGroupFormProps {
  onSubmit: (data: { name: string }) => Promise<void>;
  initialData?: {
    name: string;
  };
  submitLabel?: string;
}

export const CategoryGroupForm: React.FC<CategoryGroupFormProps> = ({
  onSubmit,
  initialData,
  submitLabel = "Create Group",
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Group name is required");
      return;
    }

    try {
      await onSubmit(formData);
      if (!initialData) {
        setFormData({ name: "" });
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          placeholder="Group Name"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
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
