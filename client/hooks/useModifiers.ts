/**
 * Custom React Hook for Modifiers API Integration
 * Provides easy access to modifier CRUD operations with React Query
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getModifiers,
  getModifierById,
  createModifier,
  updateModifier,
  deleteModifier,
  createModifierOption,
  getModifierOptions,
  deleteModifierOption,
  updateModifierOption,
  listModifierOptions,
} from "@/lib/apiServices";
import {
  ModifierFilters
} from "@shared/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

/**
 * Hook to fetch paginated modifiers list
 */
export function useModifiers(filters?: ModifierFilters, restaurantIdOverride?: string) {
  const { user } = useAuth();
  const restaurantId =
    restaurantIdOverride !== undefined ? restaurantIdOverride : (user?.branchId || "");

  return useQuery({
    queryKey: ["modifiers", restaurantId, filters],
    queryFn: () => getModifiers(restaurantId, filters),
    enabled: !!restaurantId,
    staleTime: 60000, // Cache for 1 minute
  });
}

/**
 * Hook to fetch a single modifier by ID
 */
export function useModifier(modifierId: string | undefined) {
  return useQuery({
    queryKey: ["modifier", modifierId],
    queryFn: () => getModifierById(modifierId!),
    enabled: !!modifierId,
  });
}

/**
 * Hook to create a new modifier
 */
export function useCreateModifier() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: createModifier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modifiers"] });
      addToast({
        type: "success",
        title: "Modifier Created",
        description: "Modifier has been created successfully",
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Create Modifier",
        description: error.message || "An error occurred",
      });
    },
  });
}

/**
 * Hook to delete a modifier
 */
export function useDeleteModifier() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: deleteModifier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modifiers"] });
      addToast({
        type: "success",
        title: "Modifier Deleted",
        description: "Modifier has been deleted successfully",
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Delete Modifier",
        description: error.message || "An error occurred",
      });
    },
  });
}

/**
 * Hook to update a modifier
 */
export function useUpdateModifier() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateModifier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modifiers"] });
      addToast({
        type: "success",
        title: "Modifier Updated",
        description: "Modifier has been updated successfully",
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Update Modifier",
        description: error.message || "An error occurred",
      });
    },
  });
}

/**
 * Hook to fetch modifier options
 */
export function useModifierOptions(
  modifierId: string | undefined,
  filters?: { page?: number; page_size?: number }
) {
  return useQuery({
    queryKey: ["modifierOptions", modifierId, filters],
    queryFn: () => getModifierOptions(modifierId!, filters),
    enabled: !!modifierId,
    staleTime: 60000,
  });
}

/**
 * Hook to fetch modifier options list for a restaurant (optional modifier filter)
 */
export function useModifierOptionsList(filters?: {
  restaurant_id?: string;
  modifier_id?: string;
  page?: number;
  page_size?: number;
  available?: boolean;
  hidden?: boolean;
}) {
  return useQuery({
    queryKey: ["modifierOptionsList", filters],
    queryFn: () => listModifierOptions(filters),
    enabled: !!filters?.restaurant_id,
    staleTime: 60000,
  });
}

/**
 * Hook to create a new modifier option
 */
export function useCreateModifierOption() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ modifierId, data }: { modifierId: string; data: any }) =>
      createModifierOption(modifierId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["modifier", variables.modifierId] });
      queryClient.invalidateQueries({ queryKey: ["modifierOptions", variables.modifierId] });
      queryClient.invalidateQueries({ queryKey: ["modifiers"] });
      addToast({
        type: "success",
        title: "Option Created",
        description: "Modifier option has been created successfully",
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Create Option",
        description: error.message || "An error occurred",
      });
    },
  });
}

/**
 * Hook to delete a modifier option
 */
export function useDeleteModifierOption() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: deleteModifierOption,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modifiers"] });
      queryClient.invalidateQueries({ queryKey: ["modifierOptions"] });
      addToast({
        type: "success",
        title: "Option Deleted",
        description: "Modifier option has been deleted successfully",
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Delete Option",
        description: error.message || "An error occurred",
      });
    },
  });
}

/**
 * Hook to update a modifier option
 */
export function useUpdateModifierOption() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  return useMutation({
    mutationFn: ({ optionId, data }: { optionId: string; data: any }) =>
      updateModifierOption(optionId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["modifierOptions"] });
      queryClient.invalidateQueries({ queryKey: ["modifiers"] });
      queryClient.invalidateQueries({ queryKey: ["modifierOption", variables.optionId] });
      addToast({
        type: "success",
        title: "Option Updated",
        description: "Modifier option has been updated successfully",
      });
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Update Option",
        description: error.message || "An error occurred",
      });
    },
  });
}
