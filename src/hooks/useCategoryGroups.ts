import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface CategoryGroup {
  id: string;
  name: string;
  order: number;
  categories: Array<{
    id: string;
    name: string;
  }>;
}

export function useCategoryGroups() {
  return useQuery<CategoryGroup[]>({
    queryKey: ["categoryGroups"],
    queryFn: async () => {
      const response = await fetch("/api/category-groups");
      if (!response.ok) {
        throw new Error("Failed to fetch category groups");
      }
      return response.json();
    },
  });
}

export function useCreateCategoryGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await fetch("/api/category-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create category group");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categoryGroups"] });
      queryClient.invalidateQueries({ queryKey: ["budget"] });
    },
  });
}

export function useUpdateCategoryGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { name: string };
    }) => {
      const response = await fetch(`/api/category-groups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update category group");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categoryGroups"] });
      queryClient.invalidateQueries({ queryKey: ["budget"] });
    },
  });
}

export function useDeleteCategoryGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      transferToGroupId,
    }: {
      id: string;
      transferToGroupId?: string;
    }) => {
      const response = await fetch(`/api/category-groups/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transferToGroupId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete category group");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categoryGroups"] });
      queryClient.invalidateQueries({ queryKey: ["budget"] });
    },
  });
}
