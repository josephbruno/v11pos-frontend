/**
 * Custom React Hook for Modifiers API Integration
 * Provides easy access to modifier CRUD operations with React Query
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getModifiers,
  getModifierById,
  createModifier,
  deleteModifier,
  createModifierOption,
  getModifierOptions,
  deleteModifierOption,
  type Modifier,
  type ModifierOption,
  type ModifierFilters,
} from "@/lib/apiServices";
import { useToast } from "@/contexts/ToastContext";

/**
 * Hook to fetch paginated modifiers list
 */
export function useModifiers(filters?: ModifierFilters) {
  return useQuery({
    queryKey: ["modifiers", filters],
    queryFn: () => getModifiers(filters),
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
