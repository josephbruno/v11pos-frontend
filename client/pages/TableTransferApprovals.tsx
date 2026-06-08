import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, Check, Loader2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  approveTableTransfer,
  getPendingTableTransfers,
  getMyRestaurants,
  rejectTableTransfer,
  type TableTransferRequest,
} from "@/lib/apiServices";

export default function TableTransferApprovals() {
  const queryClient = useQueryClient();
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");

  const { data: restaurantsRes } = useQuery({
    queryKey: ["my-restaurants"],
    queryFn: getMyRestaurants,
  });

  const restaurants = restaurantsRes?.data ?? [];
  const restaurantId = selectedRestaurantId || restaurants[0]?.id || "";

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["pending-table-transfers", restaurantId],
    queryFn: () => getPendingTableTransfers(restaurantId),
    enabled: Boolean(restaurantId),
    refetchInterval: 10_000,
  });

  const approveMutation = useMutation({
    mutationFn: approveTableTransfer,
    onSuccess: () => {
      toast.success("Transfer approved");
      void queryClient.invalidateQueries({ queryKey: ["pending-table-transfers"] });
    },
    onError: (err: Error) => toast.error(err.message || "Approval failed"),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectTableTransfer,
    onSuccess: () => {
      toast.message("Transfer rejected");
      void queryClient.invalidateQueries({ queryKey: ["pending-table-transfers"] });
    },
    onError: (err: Error) => toast.error(err.message || "Rejection failed"),
  });

  const transfers: TableTransferRequest[] = data?.data?.transfers ?? [];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowRightLeft className="h-6 w-6" />
            Table transfer approvals
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Verify customer presence before approving a move to another table.
          </p>
        </div>
        {restaurants.length > 1 && (
          <select
            className="border rounded-md px-3 py-2 text-sm bg-background"
            value={restaurantId}
            onChange={(e) => setSelectedRestaurantId(e.target.value)}
          >
            {restaurants.map((r: { id: string; name?: string }) => (
              <option key={r.id} value={r.id}>
                {r.name ?? r.id}
              </option>
            ))}
          </select>
        )}
      </div>

      {isLoading || isFetching ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : transfers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No pending table transfer requests.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {transfers.map((transfer) => (
            <Card key={transfer.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">Transfer request</CardTitle>
                  <Badge variant="secondary">{transfer.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-muted-foreground">From table:</span>{" "}
                    <code className="text-xs">{transfer.old_table_uuid}</code>
                  </p>
                  <p>
                    <span className="text-muted-foreground">To table:</span>{" "}
                    <code className="text-xs">{transfer.new_table_uuid}</code>
                  </p>
                  {transfer.order_uuid && (
                    <p>
                      <span className="text-muted-foreground">Active order:</span>{" "}
                      <code className="text-xs">{transfer.order_uuid}</code>
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => approveMutation.mutate(transfer.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectMutation.mutate(transfer.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button variant="ghost" size="sm" onClick={() => void refetch()}>
        Refresh
      </Button>
    </div>
  );
}
