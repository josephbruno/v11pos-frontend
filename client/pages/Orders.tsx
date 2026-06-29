import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Pencil, RefreshCw, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { getISTDateRangeFromDaysAgo, formatISTDateTimeCompact } from "@/lib/istDate";
import {
  getFilteredOrders,
  getOrderById,
  updateOrder,
  updateOrderItem,
  updateOrderPayment,
} from "@/lib/apiServices";
import { formatOrderSourceLabel, isPosOrder } from "@/lib/orderLabels";

function formatInr(amount: number) {
  return `₹${Number(amount ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function unwrapOrders(res: unknown): any[] {
  const src = (res as any)?.data ?? res;
  if (Array.isArray(src)) return src;
  if (Array.isArray(src?.orders)) return src.orders;
  if (Array.isArray(src?.items)) return src.items;
  return [];
}

function unwrapOrder(res: unknown): any | null {
  const src = (res as any)?.data ?? res;
  if (src && typeof src === "object" && !Array.isArray(src)) return src;
  return null;
}

function statusBadgeClass(status: string | undefined) {
  switch (status) {
    case "completed":
    case "delivered":
      return "bg-green-500 text-white";
    case "cancelled":
    case "refunded":
      return "bg-red-500 text-white";
    case "preparing":
    case "ready":
      return "bg-yellow-500 text-white";
    case "on_hold":
      return "bg-orange-500 text-white";
    default:
      return "bg-blue-500 text-white";
  }
}

function formatOrderType(orderType: string | undefined) {
  if (orderType === "dine_in") return "Dine-In";
  if (orderType === "takeaway") return "Take Away";
  return orderType?.replace(/_/g, " ") ?? "—";
}

type EditableItem = {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

type EditFormState = {
  status: string;
  payment_status: string;
  payment_method: string;
  guest_name: string;
  guest_phone: string;
  special_instructions: string;
  staff_notes: string;
  items: EditableItem[];
};

const EMPTY_FORM: EditFormState = {
  status: "pending",
  payment_status: "pending",
  payment_method: "cash",
  guest_name: "",
  guest_phone: "",
  special_instructions: "",
  staff_notes: "",
  items: [],
};

export default function Orders() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const restaurantId = user?.branchId ?? "";

  const [statusFilter, setStatusFilter] = useState("all");
  const [orderTypeFilter, setOrderTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [editOpen, setEditOpen] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(EMPTY_FORM);
  const [originalPayment, setOriginalPayment] = useState({
    payment_status: "pending",
    payment_method: "cash",
  });
  const [originalItemQuantities, setOriginalItemQuantities] = useState<Record<string, number>>({});
  const formInitializedFor = useRef<string | null>(null);

  const dateRange = useMemo(() => {
    const range = getISTDateRangeFromDaysAgo(29);
    return {
      start_date: range.start,
      end_date: range.end,
    };
  }, []);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [
      "adminOrders",
      restaurantId,
      statusFilter,
      orderTypeFilter,
      searchQuery,
      page,
      dateRange,
    ],
    queryFn: () =>
      getFilteredOrders(restaurantId, {
        skip: (page - 1) * pageSize,
        limit: pageSize,
        status: statusFilter === "all" ? undefined : statusFilter,
        order_type: orderTypeFilter === "all" ? undefined : orderTypeFilter,
        search: searchQuery.trim() || undefined,
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
      }),
    enabled: !!restaurantId,
  });

  const { data: orderDetailRaw, isLoading: orderDetailLoading } = useQuery({
    queryKey: ["adminOrderDetail", editingOrderId],
    queryFn: () => getOrderById(editingOrderId!),
    enabled: editOpen && !!editingOrderId,
  });

  const orders = unwrapOrders(data);
  const totalItems =
    (data as any)?.data?.total ??
    (data as any)?.total ??
    (orders.length < pageSize && page === 1 ? orders.length : page * pageSize);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const orderDetail = unwrapOrder(orderDetailRaw);

  useEffect(() => {
    if (!editOpen || !orderDetail || orderDetail.id !== editingOrderId) return;
    if (formInitializedFor.current === editingOrderId) return;

    formInitializedFor.current = editingOrderId;
    const paymentStatus = orderDetail.payment_status ?? "pending";
    const paymentMethod = orderDetail.payment_method ?? "cash";
    const items = (orderDetail.items ?? []).map((item: any) => ({
      id: item.id,
      product_name: item.product_name ?? item.name ?? "Item",
      quantity: item.quantity ?? 1,
      unit_price: Number(item.unit_price ?? 0),
      total_price: Number(item.total_price ?? 0),
    }));

    setOriginalPayment({ payment_status: paymentStatus, payment_method: paymentMethod });
    setOriginalItemQuantities(
      Object.fromEntries(items.map((item) => [item.id, item.quantity])),
    );
    setEditForm({
      status: orderDetail.status ?? "pending",
      payment_status: paymentStatus,
      payment_method: paymentMethod,
      guest_name: orderDetail.guest_name ?? "",
      guest_phone: orderDetail.guest_phone ?? "",
      special_instructions: orderDetail.special_instructions ?? "",
      staff_notes: orderDetail.staff_notes ?? "",
      items,
    });
  }, [editOpen, editingOrderId, orderDetail]);

  const openEditDialog = (order: any) => {
    if (order.status !== "pending") return;
    formInitializedFor.current = null;
    setEditForm(EMPTY_FORM);
    setOriginalItemQuantities({});
    setEditingOrderId(order.id);
    setEditOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!editingOrderId) throw new Error("No order selected");

      const detail = unwrapOrder(orderDetailRaw);
      if (!detail) throw new Error("Order details not loaded");

      for (const item of editForm.items) {
        const originalQty = originalItemQuantities[item.id];
        if (originalQty !== undefined && originalQty !== item.quantity) {
          await updateOrderItem(item.id, { quantity: item.quantity });
        }
      }

      await updateOrder(editingOrderId, {
        status: editForm.status,
        guest_name: editForm.guest_name || null,
        guest_phone: editForm.guest_phone || null,
        special_instructions: editForm.special_instructions || null,
        staff_notes: editForm.staff_notes || null,
      });

      if (
        editForm.payment_status !== originalPayment.payment_status ||
        editForm.payment_method !== originalPayment.payment_method
      ) {
        await updateOrderPayment(editingOrderId, {
          payment_status: editForm.payment_status,
          payment_method: editForm.payment_method,
        });
      }
    },
    onSuccess: () => {
      addToast({ title: "Order updated successfully", type: "success" });
      formInitializedFor.current = null;
      setEditOpen(false);
      setEditingOrderId(null);
      setEditForm(EMPTY_FORM);
      queryClient.invalidateQueries({ queryKey: ["adminOrders", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["orderStatistics", restaurantId] });
    },
    onError: (err: Error) => {
      addToast({ title: err.message || "Failed to update order", type: "error" });
    },
  });

  const updateItemQuantity = (itemId: string, quantity: number) => {
    setEditForm((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity: Math.max(1, quantity),
              total_price: Math.max(1, quantity) * item.unit_price,
            }
          : item,
      ),
    }));
  };

  const editTotal = editForm.items.reduce((sum, item) => sum + item.total_price, 0);

  if (!restaurantId) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Select a restaurant branch to view orders.
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="h-6 sm:h-7 w-6 sm:w-7 text-pos-accent" />
            Orders
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            View and track all restaurant orders from the last 30 days.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          size="sm"
          className="self-start"
        >
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle>Order list</CardTitle>
          <CardDescription>Filter by status, type, or search by order number.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <div className="relative sm:col-span-2 md:col-span-1 lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10 text-sm"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On hold</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={orderTypeFilter}
              onValueChange={(value) => {
                setOrderTypeFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Order type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="dine_in">Dine-In</SelectItem>
                <SelectItem value="takeaway">Take Away</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-none sm:rounded-lg">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground bg-muted/50">
                  <th className="text-left py-2 px-2 sm:px-4 font-semibold">Order #</th>
                  <th className="text-left py-2 px-2 sm:px-4 font-semibold hidden sm:table-cell">Source</th>
                  <th className="text-left py-2 px-2 sm:px-4 font-semibold hidden md:table-cell">Type</th>
                  <th className="text-left py-2 px-2 sm:px-4 font-semibold">Status</th>
                  <th className="text-left py-2 px-2 sm:px-4 font-semibold hidden lg:table-cell">Payment</th>
                  <th className="text-right py-2 px-2 sm:px-4 font-semibold">Amount</th>
                  <th className="text-right py-2 px-2 sm:px-4 font-semibold hidden md:table-cell">Date</th>
                  <th className="text-right py-2 px-2 sm:px-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-muted-foreground">
                      Loading orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-muted-foreground">
                      No orders found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  orders.map((order: any) => (
                    <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-2 sm:px-4 font-mono text-xs text-foreground">
                        #{order.order_number ?? order.id?.slice(-6) ?? "—"}
                      </td>
                      <td className="py-3 px-2 sm:px-4 hidden sm:table-cell">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            isPosOrder(order)
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : order.source === "qr_table"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : ""
                          }`}
                        >
                          {formatOrderSourceLabel(order)}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 sm:px-4 hidden md:table-cell">
                        <Badge variant="outline" className="text-xs">
                          {formatOrderType(order.order_type)}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 sm:px-4">
                        <Badge className={`text-xs ${statusBadgeClass(order.status)}`}>
                          {order.status?.replace(/_/g, " ") ?? "—"}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-muted-foreground text-xs capitalize hidden lg:table-cell">
                        {order.payment_status ?? order.payment?.status ?? "—"}
                        {order.payment_method || order.payment?.method
                          ? ` · ${order.payment_method ?? order.payment?.method}`
                          : ""}
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-right font-medium text-pos-accent text-xs sm:text-sm">
                        {formatInr(Number(order.total_amount ?? 0))}
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-right text-muted-foreground text-xs hidden md:table-cell">
                        {order.created_at ? formatISTDateTimeCompact(order.created_at) : "—"}
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-right">
                        {order.status === "pending" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(order)}
                            className="text-xs h-7"
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 pt-4">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || isLoading}
                className="text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages || isLoading || orders.length < pageSize}
                className="text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            formInitializedFor.current = null;
            setEditingOrderId(null);
            setEditForm(EMPTY_FORM);
            setOriginalItemQuantities({});
          }
        }}
      >
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-lg sm:text-xl">Edit order</DialogTitle>
          </DialogHeader>

          {orderDetailLoading && editForm.items.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground text-sm">Loading order...</p>
          ) : (
            <div className="grid gap-3 sm:gap-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(value) =>
                      setEditForm((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On hold</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment status</Label>
                  <Select
                    value={editForm.payment_status}
                    onValueChange={(value) =>
                      setEditForm((prev) => ({ ...prev, payment_status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Payment method</Label>
                  <Select
                    value={editForm.payment_method}
                    onValueChange={(value) =>
                      setEditForm((prev) => ({ ...prev, payment_method: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="digital_wallet">Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Guest name</Label>
                  <Input
                    value={editForm.guest_name}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, guest_name: e.target.value }))
                    }
                    placeholder="Guest name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Guest phone</Label>
                <Input
                  value={editForm.guest_phone}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, guest_phone: e.target.value }))
                  }
                  placeholder="Phone number"
                />
              </div>

              <div className="space-y-2">
                <Label>Special instructions</Label>
                <Textarea
                  value={editForm.special_instructions}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      special_instructions: e.target.value,
                    }))
                  }
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Staff notes</Label>
                <Textarea
                  value={editForm.staff_notes}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, staff_notes: e.target.value }))
                  }
                  rows={2}
                />
              </div>

              <div className="space-y-3">
                <Label>Items</Label>
                {editForm.items.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items on this order.</p>
                ) : (
                  <div className="space-y-2">
                    {editForm.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatInr(item.unit_price)} each
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={item.quantity}
                            onChange={(e) =>
                              updateItemQuantity(item.id, Number(e.target.value) || 1)
                            }
                            className="w-20 h-8"
                          />
                          <span className="text-sm font-medium text-pos-accent w-24 text-right">
                            {formatInr(item.total_price)}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-border pt-3 text-sm font-semibold">
                      <span>Estimated total</span>
                      <span className="text-pos-accent">{formatInr(editTotal)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || orderDetailLoading}
            >
              {saveMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
