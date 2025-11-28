import { useState, useEffect } from "react";
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
  Pause,
  CheckSquare,
  RefreshCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Filter,
  QrCode,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import type { OrderQueueItem, KOTGroup } from "@/shared/api";

// Mock data for live orders
const mockOrderQueue: OrderQueueItem[] = [
  {
    orderId: "ord-001",
    orderNumber: "101",
    customerName: "John Smith",
    tableNumber: "T-05",
    status: "preparing",
    orderType: "dine_in",
    totalItems: 3,
    estimatedTime: 15,
    elapsedTime: 8, // 8 minutes ago
    priority: "high",
    kotGroups: [
      {
        department: "kitchen",
        status: "preparing",
        itemCount: 2,
      },
      {
        department: "bar",
        status: "ready",
        itemCount: 1,
      },
    ],
  },
  {
    orderId: "ord-002",
    orderNumber: "102",
    customerName: "Sarah Johnson",
    tableNumber: undefined,
    status: "confirmed",
    orderType: "takeaway",
    totalItems: 5,
    estimatedTime: 20,
    elapsedTime: 3,
    priority: "normal",
    kotGroups: [
      {
        department: "kitchen",
        status: "pending",
        itemCount: 3,
      },
      {
        department: "dessert",
        status: "pending",
        itemCount: 2,
      },
    ],
  },
  {
    orderId: "ord-003",
    orderNumber: "103",
    customerName: "Mike Wilson",
    tableNumber: "T-12",
    status: "ready",
    orderType: "dine_in",
    totalItems: 2,
    estimatedTime: 10,
    elapsedTime: 12, // Overdue!
    priority: "urgent",
    kotGroups: [
      {
        department: "kitchen",
        status: "ready",
        itemCount: 1,
      },
      {
        department: "bar",
        status: "ready",
        itemCount: 1,
      },
    ],
  },
  {
    orderId: "ord-004",
    orderNumber: "104",
    customerName: "Emma Davis",
    tableNumber: undefined,
    status: "preparing",
    orderType: "delivery",
    totalItems: 4,
    estimatedTime: 25,
    elapsedTime: 15,
    priority: "normal",
    kotGroups: [
      {
        department: "kitchen",
        status: "preparing",
        itemCount: 3,
      },
      {
        department: "dessert",
        status: "ready",
        itemCount: 1,
      },
    ],
  },
  {
    orderId: "ord-005",
    orderNumber: "105",
    customerName: "Alex Chen",
    tableNumber: "T-08",
    status: "confirmed",
    orderType: "dine_in",
    totalItems: 6,
    estimatedTime: 30,
    elapsedTime: 1,
    priority: "low",
    kotGroups: [
      {
        department: "kitchen",
        status: "pending",
        itemCount: 4,
      },
      {
        department: "bar",
        status: "pending",
        itemCount: 2,
      },
    ],
  },
];

interface OrderCardProps {
  order: OrderQueueItem;
  onStatusChange: (orderId: string, status: OrderQueueItem["status"]) => void;
  onKotStatusChange: (
    orderId: string,
    department: string,
    status: KOTGroup["status"],
  ) => void;
  fullScreen?: boolean;
}

function OrderCard({
  order,
  onStatusChange,
  onKotStatusChange,
  fullScreen = false,
}: OrderCardProps) {
  const isOverdue = order.elapsedTime > (order.estimatedTime || 0);
  const isUrgent = order.priority === "urgent" || isOverdue;

  const getPriorityColor = () => {
    if (isUrgent || order.priority === "urgent")
      return "border-red-500 bg-red-500/10";
    if (order.priority === "high") return "border-yellow-500 bg-yellow-500/10";
    return "border-border bg-card";
  };

  const getStatusColor = () => {
    switch (order.status) {
      case "confirmed":
        return "bg-blue-500";
      case "preparing":
        return "bg-yellow-500";
      case "ready":
        return "bg-green-500";
      case "completed":
        return "bg-green-600";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-muted";
    }
  };

  const getKotStatusColor = (status: KOTGroup["status"]) => {
    switch (status) {
      case "pending":
        return "bg-muted text-muted-foreground";
      case "acknowledged":
        return "bg-blue-500 text-white";
      case "preparing":
        return "bg-yellow-500 text-white";
      case "ready":
        return "bg-green-500 text-white";
      case "served":
        return "bg-green-600 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getDepartmentIcon = (department: string) => {
    switch (department) {
      case "kitchen":
        return <ChefHat className="h-4 w-4" />;
      case "bar":
        return <Coffee className="h-4 w-4" />;
      case "dessert":
        return <IceCream className="h-4 w-4" />;
      default:
        return <Hash className="h-4 w-4" />;
    }
  };

  const formatElapsedTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
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
                  className={`text-xl font-bold ${
                    fullScreen ? "text-2xl" : ""
                  } ${isUrgent ? "text-red-500" : "text-foreground"}`}
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
              <div
                className={`text-right ${
                  isOverdue ? "text-pos-error" : "text-pos-text"
                }`}
              >
                <div className="text-sm text-pos-text-muted">Elapsed</div>
                <div className="font-bold text-lg">
                  {formatElapsedTime(order.elapsedTime)}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Customer Info */}
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

          {/* Timing Info */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Timer className="h-4 w-4 text-pos-text-muted" />
              <span className="text-pos-text-muted">
                Est: {order.estimatedTime}m
              </span>
            </div>
            <div className="text-pos-text">
              {order.totalItems} item{order.totalItems !== 1 ? "s" : ""}
            </div>
          </div>

          {/* KOT Groups */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-pos-text">
              Department Status:
            </div>
            <div className="grid grid-cols-1 gap-2">
              {order.kotGroups.map((kot, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-pos-secondary rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    {getDepartmentIcon(kot.department)}
                    <span className="text-pos-text text-sm capitalize">
                      {kot.department}
                    </span>
                    <span className="text-pos-text-muted text-xs">
                      ({kot.itemCount} items)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      className={`${getKotStatusColor(kot.status)} text-xs`}
                    >
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
                          onKotStatusChange(
                            order.orderId,
                            kot.department,
                            nextStatus,
                          );
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

          {/* Action Buttons */}
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
  const [orders, setOrders] = useState<OrderQueueItem[]>(mockOrderQueue);
  const [filter, setFilter] = useState<
    "all" | "pending" | "preparing" | "ready"
  >("all");
  const [departmentFilter, setDepartmentFilter] = useState<
    "all" | "kitchen" | "bar" | "dessert"
  >("all");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Simulate real-time updates
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setOrders((prevOrders) =>
        prevOrders.map((order) => ({
          ...order,
          elapsedTime: order.elapsedTime + 1,
        })),
      );
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleStatusChange = (
    orderId: string,
    status: OrderQueueItem["status"],
  ) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, status } : order,
      ),
    );

    if (soundEnabled) {
      // Play notification sound
      const audio = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAcBDuMzMLDdSsCJ33J8N2QQwoUXrTp66hVFAlFnt/xwV8dBDuMzMLDdSsCJ33J8N2QQwoUXrTp66hVFAlFnt/xwV8dBDyMzMLDdSsBJn3J8N2QQwoUXrTp66hVFAlFnt/xwV8dBDyMzMLDdSsBJn3J8N2QQwoUXrTp66hVFAlFnt/xwV8dBDwLzMLDdSsBJn3J8N2QQwoUXrTp66hVFAlFnt/xwV8dBDwLzMLDdSsBJn3J8N2QQwoUXrTp66hVFAlFnt/xwV8dBDwLzMLDdSsBJn3J8N2QQwoUXrTp66hVFAlFnt/xwV8dBDwLzMLDdSsBJn3J8N2QQwoUXrTp66hVFAlFnt/xwV8dBDwL",
      );
      audio.volume = 0.3;
      audio.play().catch(() => {});
    }
  };

  const handleKotStatusChange = (
    orderId: string,
    department: string,
    status: KOTGroup["status"],
  ) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
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
  };

  const filteredOrders = orders.filter((order) => {
    const statusMatch = filter === "all" || order.status === filter;
    const departmentMatch =
      departmentFilter === "all" ||
      order.kotGroups.some((kot) => kot.department === departmentFilter);
    return statusMatch && departmentMatch;
  });

  const sortedOrders = filteredOrders.sort((a, b) => {
    // Sort by priority (urgent first), then by elapsed time
    const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.elapsedTime - a.elapsedTime;
  });

  const getOrderCounts = () => {
    return {
      total: orders.length,
      pending: orders.filter((o) => o.status === "confirmed").length,
      preparing: orders.filter((o) => o.status === "preparing").length,
      ready: orders.filter((o) => o.status === "ready").length,
      overdue: orders.filter((o) => o.elapsedTime > (o.estimatedTime || 0))
        .length,
    };
  };

  const counts = getOrderCounts();

  return (
    <div className={`space-y-6 ${isFullScreen ? "min-h-screen p-4" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className={`font-bold text-foreground ${
              isFullScreen ? "text-4xl" : "text-3xl"
            }`}
          >
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
              soundEnabled
                ? "text-pos-accent hover:text-pos-accent"
                : "text-pos-text-muted"
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`border-pos-secondary ${
              autoRefresh
                ? "text-pos-success hover:text-pos-success"
                : "text-pos-text-muted"
            }`}
          >
            <RefreshCw
              className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="border-pos-secondary text-pos-text-muted hover:text-pos-text"
          >
            {isFullScreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {counts.total}
              </div>
              <div className="text-sm text-muted-foreground">Total Orders</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-pos-surface border-pos-secondary">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {counts.pending}
              </div>
              <div className="text-sm text-pos-text-muted">Pending</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-pos-surface border-pos-secondary">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-pos-warning">
                {counts.preparing}
              </div>
              <div className="text-sm text-pos-text-muted">Preparing</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-pos-surface border-pos-secondary">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-pos-success">
                {counts.ready}
              </div>
              <div className="text-sm text-pos-text-muted">Ready</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-pos-surface border-pos-secondary">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-pos-error">
                {counts.overdue}
              </div>
              <div className="text-sm text-pos-text-muted">Overdue</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-pos-surface border-pos-secondary">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-pos-text-muted" />
              <span className="text-sm text-pos-text-muted">Filters:</span>
            </div>
            <Select
              value={filter}
              onValueChange={(value: any) => setFilter(value)}
            >
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
          </div>
        </CardContent>
      </Card>

      {/* Orders Grid */}
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
            <h3 className="text-lg font-semibold text-pos-text mb-2">
              No orders found
            </h3>
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
