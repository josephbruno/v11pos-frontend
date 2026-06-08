import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  ChefHat,
  Coffee,
  IceCream,
  Users,
  Hash,
  Timer,
  Play,
  CheckSquare,
  RefreshCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import type { OrderQueueItem, KOTGroup } from "@/shared/api";
import { useAuth } from "@/contexts/AuthContext";
import { getFilteredOrders, updateOrderStatus } from "@/lib/apiServices";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8000/api/v1";

function getWsUrl(restaurantId: string) {
  const wsBase = API_BASE_URL.replace(/^http/, "ws");
  return `${wsBase}/orders/ws/${restaurantId}`;
}

function elapsedMinutes(createdAt: string | Date | undefined): number {
  if (!createdAt) return 0;
  return Math.floor((Date.now() - new Date(createdAt as string).getTime()) / 60000);
}

function mapOrderToQueueItem(order: any): OrderQueueItem {
  const elapsed = elapsedMinutes(order.created_at);
  const itemCount = order.items?.length ?? order.total_items ?? 0;
  const priority: OrderQueueItem["priority"] =
    elapsed > 20 ? "urgent" : elapsed > 12 ? "high" : elapsed > 6 ? "normal" : "low";
  const kotGroups: KOTGroup[] =
    order.kotGroups ??
    order.kot_groups ??
    (itemCount > 0
      ? [{ department: "kitchen", status: "preparing" as KOTGroup["status"], itemCount }]
      : []);

  return {
    orderId: order.id,
    id: order.id,
    orderNumber: order.order_number ?? order.id?.slice(-4) ?? "–",
    customerName: order.guest_name ?? order.customer?.name ?? undefined,
    tableNumber: order.table_id ? `T-${order.table_id.slice(-3)}` : undefined,
    status: (order.status === "delivered" || order.status === "completed"
      ? "completed"
      : order.status) as OrderQueueItem["status"],
    orderType: (order.order_type ?? "dine_in") as OrderQueueItem["orderType"],
    totalItems: itemCount,
    estimatedTime: 15,
    elapsedTime: elapsed,
    priority,
    kotGroups,
  };
}

interface OrderCardProps {
  order: OrderQueueItem;
  onStatusChange: (orderId: string, status: OrderQueueItem["status"]) => void;
  onKotStatusChange: (orderId: string, department: string, status: KOTGroup["status"]) => void;
  fullScreen?: boolean;
}

function OrderCard({ order, onStatusChange, onKotStatusChange, fullScreen = false }: OrderCardProps) {
  const isOverdue = order.elapsedTime > (order.estimatedTime || 0);
  const isUrgent = order.priority === "urgent" || isOverdue;

  const getPriorityColor = () => {
    if (isUrgent || order.priority === "urgent") return "border-red-500 bg-red-500/10";
    if (order.priority === "high") return "border-yellow-500 bg-yellow-500/10";
    return "border-border bg-card";
  };

  const getStatusColor = () => {
    switch (order.status) {
      case "confirmed": return "bg-blue-500";
      case "preparing": return "bg-yellow-500";
      case "ready": return "bg-green-500";
      case "completed": return "bg-green-600";
      case "cancelled": return "bg-red-500";
      default: return "bg-muted";
    }
  };

  const getKotStatusColor = (status: KOTGroup["status"]) => {
    switch (status) {
      case "pending": return "bg-muted text-muted-foreground";
      case "acknowledged": return "bg-blue-500 text-white";
      case "preparing": return "bg-yellow-500 text-white";
      case "ready": return "bg-green-500 text-white";
      case "served": return "bg-green-600 text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getDepartmentIcon = (department: string) => {
    switch (department) {
      case "kitchen": return <ChefHat className="h-4 w-4" />;
      case "bar": return <Coffee className="h-4 w-4" />;
      case "dessert": return <IceCream className="h-4 w-4" />;
      default: return <Hash className="h-4 w-4" />;
    }
  };

  const formatElapsedTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`${getPriorityColor()} transition-all duration-200 ${
          isUrgent ? "shadow-lg animate-pulse" : ""
        }`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Hash className="h-5 w-5 text-pos-accent" />
                <CardTitle
                  className={`text-xl font-bold ${fullScreen ? "text-2xl" : ""} ${
                    isUrgent ? "text-red-500" : "text-foreground"
                  }`}
                >
                  {order.orderNumber}
                </CardTitle>
              </div>
              <Badge className={`${getStatusColor()} text-white font-medium`}>
                {order.status.replace("_", " ").toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              {isOverdue && (
                <AlertTriangle className="h-5 w-5 text-pos-error animate-bounce" />
              )}
              <div className={`text-right ${isOverdue ? "text-pos-error" : "text-pos-text"}`}>
                <div className="text-sm text-pos-text-muted">Elapsed</div>
                <div className="font-bold text-lg">{formatElapsedTime(order.elapsedTime)}</div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-foreground font-medium">
                {order.customerName || "Guest"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge
                variant="outline"
                className={`text-xs ${
                  order.orderType === "qr_order"
                    ? "bg-blue-100 text-blue-800 border-blue-200"
                    : "text-gray-600 border-gray-200"
                }`}
              >
                {order.orderType === "qr_order"
                  ? "QR Order"
                  : order.orderType.replace("_", " ").toUpperCase()}
              </Badge>
              {order.tableNumber && (
                <Badge variant="outline" className="text-xs">
                  {order.tableNumber}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Timer className="h-4 w-4 text-pos-text-muted" />
              <span className="text-pos-text-muted">Est: {order.estimatedTime}m</span>
            </div>
            <div className="text-pos-text">
              {order.totalItems} item{order.totalItems !== 1 ? "s" : ""}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-pos-text">Department Status:</div>
            <div className="grid grid-cols-1 gap-2">
              {order.kotGroups.map((kot, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-pos-secondary rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    {getDepartmentIcon(kot.department)}
                    <span className="text-pos-text text-sm capitalize">{kot.department}</span>
                    <span className="text-pos-text-muted text-xs">({kot.itemCount} items)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getKotStatusColor(kot.status)} text-xs`}>
                      {kot.status.replace("_", " ").toUpperCase()}
                    </Badge>
                    {kot.status !== "ready" && kot.status !== "served" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const nextStatus =
                            kot.status === "pending"
                              ? "acknowledged"
                              : kot.status === "acknowledged"
                              ? "preparing"
                              : "ready";
                          onKotStatusChange(order.orderId, kot.department, nextStatus);
                        }}
                        className="h-6 w-6 p-0 border-pos-secondary"
                      >
                        {kot.status === "pending" ? (
                          <Play className="h-3 w-3" />
                        ) : kot.status === "acknowledged" ? (
                          <ChefHat className="h-3 w-3" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            {order.status === "confirmed" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(order.orderId, "preparing")}
                className="flex-1 border-pos-secondary text-pos-warning hover:bg-pos-warning hover:text-pos-text"
              >
                <Play className="mr-2 h-4 w-4" />
                Start
              </Button>
            )}
            {order.status === "preparing" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(order.orderId, "ready")}
                className="flex-1 border-pos-secondary text-pos-success hover:bg-pos-success hover:text-pos-text"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Ready
              </Button>
            )}
            {order.status === "ready" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStatusChange(order.orderId, "completed")}
                className="flex-1 border-pos-secondary text-pos-accent hover:bg-pos-accent hover:text-pos-text"
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                Complete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function OrderQueue() {
  const { user } = useAuth();
  const restaurantId = user?.branchId ?? "";
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<"all" | "pending" | "preparing" | "ready">("all");
  const [departmentFilter, setDepartmentFilter] = useState<"all" | "kitchen" | "bar" | "dessert">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    return {
      start_date: start.toISOString().split("T")[0],
      end_date: end.toISOString().split("T")[0],
    };
  }, []);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [localOrders, setLocalOrders] = useState<OrderQueueItem[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const { data: ordersRaw, refetch } = useQuery({
    queryKey: ["activeOrders", restaurantId, filter, searchQuery, dateRange],
    queryFn: () =>
      getFilteredOrders(restaurantId, {
        skip: 0,
        limit: 100,
        status: filter === "all" ? undefined : filter,
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
        search: searchQuery.trim() || undefined,
      }),
    enabled: !!restaurantId,
    select: (r: any) => {
      const src = r?.data ?? r;
      const arr = Array.isArray(src) ? src : Array.isArray(src?.orders) ? src.orders : [];
      return arr
        .filter((o: any) =>
          ["pending", "confirmed", "preparing", "ready", "pending_approval"].includes(
            o.status,
          ),
        )
        .map(mapOrderToQueueItem);
    },
    staleTime: 15_000,
    refetchInterval: autoRefresh ? 30_000 : false,
  });

  useEffect(() => {
    if (ordersRaw) setLocalOrders(ordersRaw);
  }, [ordersRaw]);

  // WebSocket for real-time updates
  useEffect(() => {
    if (!restaurantId) return;
    let ws: WebSocket;
    try {
      ws = new WebSocket(getWsUrl(restaurantId));
      wsRef.current = ws;
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const order = data?.order ?? data?.data?.order ?? data?.data ?? data;
          if (!order?.id) return;
          const mapped = mapOrderToQueueItem(order);
          setLocalOrders((prev) => {
            const exists = prev.find((o) => o.orderId === mapped.orderId);
            if (exists) {
              if (mapped.status === "completed" || mapped.status === "cancelled") {
                return prev.filter((o) => o.orderId !== mapped.orderId);
              }
              return prev.map((o) => (o.orderId === mapped.orderId ? mapped : o));
            }
            return [mapped, ...prev];
          });
          if (soundEnabled && data?.event_type === "new_order") {
            const audio = new AudioContext();
            const osc = audio.createOscillator();
            osc.connect(audio.destination);
            osc.frequency.value = 880;
            osc.start();
            setTimeout(() => osc.stop(), 200);
          }
        } catch {}
      };
    } catch {}
    return () => {
      wsRef.current?.close();
    };
  }, [restaurantId, soundEnabled]);

  // Tick elapsed time every minute
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setLocalOrders((prev) => prev.map((o) => ({ ...o, elapsedTime: o.elapsedTime + 1 })));
    }, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      updateOrderStatus(orderId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["activeOrders", restaurantId] }),
  });

  const handleStatusChange = useCallback(
    (orderId: string, status: OrderQueueItem["status"]) => {
      const apiStatus = status === "completed" ? "delivered" : status;
      setLocalOrders((prev) => {
        if (status === "completed" || status === "cancelled") {
          return prev.filter((o) => o.orderId !== orderId);
        }
        return prev.map((o) => (o.orderId === orderId ? { ...o, status } : o));
      });
      statusMutation.mutate({ orderId, status: apiStatus });
      if (soundEnabled) {
        try {
          const audio = new AudioContext();
          const osc = audio.createOscillator();
          osc.connect(audio.destination);
          osc.frequency.value = 660;
          osc.start();
          setTimeout(() => osc.stop(), 150);
        } catch {}
      }
    },
    [statusMutation, soundEnabled],
  );

  const handleKotStatusChange = useCallback(
    (orderId: string, department: string, status: KOTGroup["status"]) => {
      setLocalOrders((prev) =>
        prev.map((order) =>
          order.orderId === orderId
            ? {
                ...order,
                kotGroups: order.kotGroups.map((kot) =>
                  kot.department === department ? { ...kot, status } : kot,
                ),
              }
            : order,
        ),
      );
    },
    [],
  );

  const filteredOrders = localOrders.filter((order) => {
    const statusMatch = filter === "all" || order.status === filter;
    const departmentMatch =
      departmentFilter === "all" ||
      order.kotGroups.some((kot) => kot.department === departmentFilter);
    return statusMatch && departmentMatch;
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.elapsedTime - a.elapsedTime;
  });

  const counts = {
    total: localOrders.length,
    pending: localOrders.filter((o) => o.status === "confirmed" || o.status === "pending").length,
    preparing: localOrders.filter((o) => o.status === "preparing").length,
    ready: localOrders.filter((o) => o.status === "ready").length,
    overdue: localOrders.filter((o) => o.elapsedTime > (o.estimatedTime || 0)).length,
  };

  return (
    <div className={`space-y-6 ${isFullScreen ? "min-h-screen p-4" : ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`font-bold text-foreground ${isFullScreen ? "text-4xl" : "text-3xl"}`}>
            Live Order Queue
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time kitchen and bar order management
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`border-pos-secondary ${
              soundEnabled ? "text-pos-accent hover:text-pos-accent" : "text-pos-text-muted"
            }`}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setAutoRefresh(!autoRefresh); refetch(); }}
            className={`border-pos-secondary ${
              autoRefresh ? "text-pos-success hover:text-pos-success" : "text-pos-text-muted"
            }`}
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="border-pos-secondary text-pos-text-muted hover:text-pos-text"
          >
            {isFullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{counts.total}</div>
              <div className="text-sm text-muted-foreground">Total Orders</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-pos-surface border-pos-secondary">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">{counts.pending}</div>
              <div className="text-sm text-pos-text-muted">Pending</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-pos-surface border-pos-secondary">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-pos-warning">{counts.preparing}</div>
              <div className="text-sm text-pos-text-muted">Preparing</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-pos-surface border-pos-secondary">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-pos-success">{counts.ready}</div>
              <div className="text-sm text-pos-text-muted">Ready</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-pos-surface border-pos-secondary">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-pos-error">{counts.overdue}</div>
              <div className="text-sm text-pos-text-muted">Overdue</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-pos-surface border-pos-secondary">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-pos-text-muted" />
              <span className="text-sm text-pos-text-muted">Filters:</span>
            </div>
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-40 bg-pos-surface border-pos-secondary text-pos-text">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-pos-surface border-pos-secondary">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="preparing">Preparing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={departmentFilter}
              onValueChange={(value: any) => setDepartmentFilter(value)}
            >
              <SelectTrigger className="w-40 bg-pos-surface border-pos-secondary text-pos-text">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-pos-surface border-pos-secondary">
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="kitchen">Kitchen</SelectItem>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="dessert">Dessert</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Search order #, guest..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-xs bg-pos-surface border-pos-secondary text-pos-text"
            />
          </div>
        </CardContent>
      </Card>

      <div
        className={`grid gap-6 ${
          isFullScreen
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        <AnimatePresence>
          {sortedOrders.map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              onStatusChange={handleStatusChange}
              onKotStatusChange={handleKotStatusChange}
              fullScreen={isFullScreen}
            />
          ))}
        </AnimatePresence>
      </div>

      {sortedOrders.length === 0 && (
        <Card className="bg-pos-surface border-pos-secondary">
          <CardContent className="text-center py-12">
            <ChefHat className="mx-auto h-12 w-12 text-pos-text-muted mb-4" />
            <h3 className="text-lg font-semibold text-pos-text mb-2">No orders found</h3>
            <p className="text-pos-text-muted">
              {filter !== "all" || departmentFilter !== "all"
                ? "Try adjusting your filters"
                : "No active orders in the queue"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
