/**
 * Custom React Hook for Row Management API Integration
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  createRowManagement,
  deleteRowManagement,
  getRowManagementList,
  updateRowManagement,
} from "@/lib/apiServices";
import type { RowManagement, RowType } from "@shared/api";

function normalizeRowManagementResponse(response: any): RowManagement[] {
  const source = response?.data ?? response;
  if (Array.isArray(source)) return source as RowManagement[];
  if (Array.isArray(source?.items)) return source.items as RowManagement[];
  if (Array.isArray(source?.rows)) return source.rows as RowManagement[];
  return [];
}

export function useRowManagementList(
  restaurantIdOverride?: string,
  options?: { row_type?: RowType | ""; active_only?: boolean; skip?: number; limit?: number },
) {
  const { user } = useAuth();
  const restaurantId =
    restaurantIdOverride !== undefined ? restaurantIdOverride : user?.branchId || "";

  return useQuery({
    queryKey: ["row-management", restaurantId, options],
    queryFn: async () => {
      const raw = await getRowManagementList(restaurantId, options);
      return {
        raw,
        data: normalizeRowManagementResponse(raw),
      };
    },
    enabled: Boolean(restaurantId),
    staleTime: 60000,
  });
}

export function useCreateRowManagement() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: createRowManagement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["row-management"] });
      addToast({
        type: "success",
        title: "Row Created",
        description: "Homepage row has been created successfully",
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Create Row",
        description: error?.message || "An error occurred",
      });
    },
  });
}

export function useUpdateRowManagement() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateRowManagement(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["row-management"] });
      queryClient.invalidateQueries({ queryKey: ["row-management", variables.id] });
      addToast({
        type: "success",
        title: "Row Updated",
        description: "Homepage row has been updated successfully",
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Update Row",
        description: error?.message || "An error occurred",
      });
    },
  });
}

export function useDeleteRowManagement() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: deleteRowManagement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["row-management"] });
      addToast({
        type: "success",
        title: "Row Deleted",
        description: "Homepage row has been deleted successfully",
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Delete Row",
        description: error?.message || "An error occurred",
      });
    },
  });
}

