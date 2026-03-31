/**
 * Custom React Hook for Combos API Integration
 */

import { useQuery } from "@tanstack/react-query";
import { getCombos } from "@/lib/apiServices";
import { useAuth } from "@/contexts/AuthContext";

export function useCombos(filters?: any, restaurantIdOverride?: string) {
  const { user } = useAuth();
  const restaurantId =
    restaurantIdOverride !== undefined ? restaurantIdOverride : (user?.branchId || "");

  return useQuery({
    queryKey: ["combos", restaurantId, filters],
    queryFn: () => getCombos(restaurantId, filters),
    enabled: !!restaurantId,
    staleTime: 30000,
  });
}

