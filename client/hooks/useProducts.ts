/**
 * Custom React Hook for Products API Integration
 * Provides easy access to products CRUD operations with React Query
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getFeaturedProducts,
  getAvailableProducts,
  type Product,
  type ProductFilters,
} from "@/lib/apiServices";
import { useToast } from "@/contexts/ToastContext";

/**
 * Hook to fetch paginated products list
 */
export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => getProducts(filters),
    staleTime: 30000, // Cache for 30 seconds
  });
}

/**
 * Hook to fetch a single product by ID
 */
export function useProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProductById(productId!),
    enabled: !!productId, // Only fetch if productId exists
  });
}

/**
 * Hook to search products
 */
export function useProductSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: ["products", "search", query],
    queryFn: () => searchProducts(query),
    enabled: enabled && query.length > 0,
    staleTime: 30000,
  });
}

/**
 * Hook to get featured products
 */
export function useFeaturedProducts(limit = 10) {
  return useQuery({
    queryKey: ["products", "featured", limit],
    queryFn: () => getFeaturedProducts(limit),
    staleTime: 60000, // Cache for 1 minute
  });
}

/**
 * Hook to get available products
 */
export function useAvailableProducts(filters?: Omit<ProductFilters, 'available'>) {
  return useQuery({
    queryKey: ["products", "available", filters],
    queryFn: () => getAvailableProducts(filters),
    staleTime: 30000,
  });
}

/**
 * Hook to create a new product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      // Invalidate products queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["products"] });
      addToast({
        type: "success",
        title: "Product Created",
        description: "Product has been created successfully",
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Create Product",
        description: error.message || "An error occurred while creating the product",
      });
    },
  });
}

/**
 * Hook to update a product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      updateProduct(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific product and products list
      queryClient.invalidateQueries({ queryKey: ["product", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      addToast({
        type: "success",
        title: "Product Updated",
        description: "Product has been updated successfully",
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Update Product",
        description: error.message || "An error occurred while updating the product",
      });
    },
  });
}

/**
 * Hook to delete a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      // Invalidate products list
      queryClient.invalidateQueries({ queryKey: ["products"] });
      addToast({
        type: "success",
        title: "Product Deleted",
        description: "Product has been deleted successfully",
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Delete Product",
        description: error.message || "An error occurred while deleting the product",
      });
    },
  });
}

/**
 * Helper function to convert price from cents to dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Helper function to convert price from dollars to cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Helper function to format price for display
 */
export function formatPrice(cents: number): string {
  return `$${centsToDollars(cents).toFixed(2)}`;
}
