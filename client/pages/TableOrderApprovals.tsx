import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Check, Clock, Loader2, MapPin, User, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  approveQrTableOrder,
  getMyRestaurants,
  getPendingQrTableOrders,
  getTables,
  rejectQrTableOrder,
  type QrTableOrderApproval,
} from "@/lib/apiServices";
import { formatISTDateTimeCompact } from "@/lib/istDate";

function formatMoney(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return formatISTDateTimeCompact(iso);
}

export default function TableOrderApprovals() {
  const queryClient = useQueryClient();
  const [selectedRestaurantId, setSelectedRestaurantId] = useState("");
  const [pendingAction, setPendingAction] = useState<{
    order: QrTableOrderApproval;
    action: "approve" | "reject";
  } | null>(null);

  const { data: restaurantsRes } = useQuery({
    queryKey: ["my-restaurants"],
    queryFn: () => getMyRestaurants(),
  });

  const restaurants = restaurantsRes?.data ?? [];
  const restaurantId = selectedRestaurantId || restaurants[0]?.id || "";

  const { data: tablesRes } = useQuery({
    queryKey: ["tables-for-qr-approvals", restaurantId],
    queryFn: () => getTables(restaurantId),
    enabled: Boolean(restaurantId),
  });

  const tableLabelById = useMemo(() => {
    const map = new Map<string, string>();
    const payload = tablesRes as { data?: unknown } | undefined;
    const source =
      (payload?.data as { data?: unknown; items?: unknown; tables?: unknown })?.data ??
      (payload?.data as { items?: unknown })?.items ??
      (payload?.data as { tables?: unknown })?.tables ??
      payload?.data ??
      payload;
    const tables = (Array.isArray(source) ? source : []) as Array<{
      id?: string;
      table_id?: string;
      table_number?: string;
      table_name?: string;
    }>;
    for (const t of tables) {
      const id = String(t.id ?? t.table_id ?? "");
      if (!id) continue;
      const label =
        t.table_name?.trim() ||
        (t.table_number ? `Table ${t.table_number}` : id);
      map.set(id, label);
    }
    return map;
  }, [tablesRes]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["pending-qr-table-orders", restaurantId],
    queryFn: () => getPendingQrTableOrders(restaurantId),
    enabled: Boolean(restaurantId),
    refetchInterval: 8_000,
  });

  const approveMutation = useMutation({
    mutationFn: approveQrTableOrder,
    onSuccess: () => {
      toast.success("Order approved — kitchen can proceed");
      setPendingAction(null);
      void queryClient.invalidateQueries({ queryKey: ["pending-qr-table-orders"] });
    },
    onError: (err: Error) => toast.error(err.message || "Approval failed"),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectQrTableOrder,
    onSuccess: () => {
      toast.message("Order rejected");
      setPendingAction(null);
      void queryClient.invalidateQueries({ queryKey: ["pending-qr-table-orders"] });
    },
    onError: (err: Error) => toast.error(err.message || "Rejection failed"),
  });

  const orders: QrTableOrderApproval[] = data?.data?.orders ?? [];
  const isActing = approveMutation.isPending || rejectMutation.isPending;

  const confirmAction = () => {
    if (!pendingAction) return;
    if (pendingAction.action === "approve") {
      approveMutation.mutate(pendingAction.order.id);
    } else {
      rejectMutation.mutate(pendingAction.order.id);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-primary" />
            QR table order approvals
            {orders.length > 0 && (
              <Badge variant="destructive" className="ml-1">
                {orders.length}
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            Verify the customer is at the table before approving their first QR order.
            Additional items added later do not need re-approval.
          </p>
        </div>
        {restaurants.length > 1 && (
          <select
            className="border rounded-md px-3 py-2 text-sm bg-background min-w-[200px]"
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

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <ClipboardCheck className="h-10 w-10 mx-auto mb-3 opacity-40" />
            No QR table orders awaiting approval.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => {
            const tableLabel =
              (order.table_id && tableLabelById.get(order.table_id)) ||
              order.table_id ||
              "Unknown table";

            return (
              <Card key={order.id} className="border-amber-200/60 bg-amber-50/30 dark:bg-amber-950/10">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-end gap-0.5">
                        <Badge variant="outline" className="gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(order.created_at)}
                        </Badge>
                        {order.created_at ? (
                          <span className="text-[10px] text-muted-foreground">
                            {formatISTDateTimeCompact(order.created_at)}
                          </span>
                        ) : null}
                      </div>
                      <Badge className="bg-amber-500 hover:bg-amber-500">pending approval</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>
                        <span className="text-muted-foreground">Table: </span>
                        <strong>{tableLabel}</strong>
                      </span>
                    </div>
                    {order.customer_id && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground truncate">
                          Customer {order.customer_id.slice(0, 8)}…
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border bg-background/80 p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Items
                    </p>
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>
                          {item.quantity}× {item.name ?? item.product_name}
                        </span>
                        <span className="font-medium">{formatMoney(item.total_price)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{formatMoney(order.total_amount)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <Button
                      className="flex-1"
                      onClick={() => setPendingAction({ order, action: "approve" })}
                      disabled={isActing}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve & send to kitchen
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setPendingAction({ order, action: "reject" })}
                      disabled={isActing}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Button variant="ghost" size="sm" onClick={() => void refetch()} disabled={isFetching}>
          {isFetching ? "Refreshing…" : "Refresh"}
        </Button>
        <span>Auto-refreshes every 8 seconds</span>
      </div>

      <AlertDialog open={Boolean(pendingAction)} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.action === "approve" ? "Approve QR order?" : "Reject QR order?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.action === "approve" ? (
                <>
                  Confirm the customer is present at{" "}
                  <strong>
                    {(pendingAction.order.table_id &&
                      tableLabelById.get(pendingAction.order.table_id)) ||
                      "the table"}
                  </strong>
                  . The order will be sent to the kitchen after approval.
                </>
              ) : (
                <>
                  Reject order #{pendingAction?.order.order_number}? The customer will need to
                  place a new order.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction} disabled={isActing}>
              {isActing ? "Processing…" : pendingAction?.action === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
