/**
 * Custom React Hook for Homebanners API Integration
 * Provides easy access to homebanner CRUD operations with React Query
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  createHomebanner,
  deleteHomebanner,
  getHomebanners,
  updateHomebanner,
} from "@/lib/apiServices";
import type { Homebanner } from "@shared/api";

function normalizeHomebannersResponse(response: any): Homebanner[] {
  const source = response?.data ?? response;
  if (Array.isArray(source)) return source as Homebanner[];
  if (Array.isArray(source?.items)) return source.items as Homebanner[];
  if (Array.isArray(source?.homebanners)) return source.homebanners as Homebanner[];
  return [];
}

export function useHomebanners(restaurantIdOverride?: string) {
  const { user } = useAuth();
  const restaurantId =
    restaurantIdOverride !== undefined ? restaurantIdOverride : user?.branchId || "";

  return useQuery({
    queryKey: ["homebanners", restaurantId],
    queryFn: async () => {
      const raw = await getHomebanners(restaurantId || undefined, 0, 500);
      return {
        raw,
        data: normalizeHomebannersResponse(raw),
      };
    },
    enabled: Boolean(restaurantId),
    staleTime: 60000,
  });
}

export function useCreateHomebanner() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: createHomebanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homebanners"] });
      addToast({
        type: "success",
        title: "Banner Created",
        description: "Home banner has been created successfully",
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Create Banner",
        description: error?.message || "An error occurred",
      });
    },
  });
}

export function useUpdateHomebanner() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Homebanner> & {
        mobile_image?: File | string | null;
        desktop_image?: File | string | null;
      };
    }) => updateHomebanner(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["homebanners"] });
      queryClient.invalidateQueries({ queryKey: ["homebanner", variables.id] });
      addToast({
        type: "success",
        title: "Banner Updated",
        description: "Home banner has been updated successfully",
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Update Banner",
        description: error?.message || "An error occurred",
      });
    },
  });
}

export function useDeleteHomebanner() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: deleteHomebanner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homebanners"] });
      addToast({
        type: "success",
        title: "Banner Deleted",
        description: "Home banner has been deleted successfully",
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Delete Banner",
        description: error?.message || "An error occurred",
      });
    },
  });
}
