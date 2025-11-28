/**
 * Custom React Hook for Categories API Integration
 * Provides easy access to category CRUD operations with React Query
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  type Category,
  type CategoryFilters,
} from "@/lib/apiServices";
import { useToast } from "@/contexts/ToastContext";

/**
 * Hook to fetch paginated categories list
 */
export function useCategories(filters?: CategoryFilters) {
  return useQuery({
    queryKey: ["categories", filters],
    queryFn: () => getCategories(filters),
    staleTime: 60000, // Cache for 1 minute
  });
}

/**
 * Hook to fetch all active categories (no pagination)
 */
export function useActiveCategories() {
  return useQuery({
    queryKey: ["categories", "active"],
    queryFn: () => getCategories({ active: true, page_size: 100 }),
    staleTime: 60000,
  });
}

/**
 * Hook to fetch a single category by ID
 */
export function useCategory(categoryId: string | undefined) {
  return useQuery({
    queryKey: ["category", categoryId],
    queryFn: () => getCategoryById(categoryId!),
    enabled: !!categoryId,
  });
}

/**
 * Hook to create a new category
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      addToast({
        type: "success",
        title: "Category Created",
        description: "Category has been created successfully",
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Create Category",
        description: error.message || "An error occurred",
      });
    },
  });
}

/**
 * Hook to update a category
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ 
      id, 
      data 
    }: { 
      id: string; 
      data: {
        name?: string;
        slug?: string;
        description?: string;
        active?: boolean;
        sort_order?: number;
        image?: File | null;
      }
    }) => updateCategory(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["category", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      addToast({
        type: "success",
        title: "Category Updated",
        description: "Category has been updated successfully",
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Update Category",
        description: error.message || "An error occurred",
      });
    },
  });
}

/**
 * Hook to delete a category
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      addToast({
        type: "success",
        title: "Category Deleted",
        description: "Category has been deleted successfully",
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Delete Category",
        description: error.message || "An error occurred",
      });
    },
  });
}

/**
 * Helper function to generate slug from category name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single hyphen
}
