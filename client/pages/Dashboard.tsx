import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Clock,
  AlertTriangle,
  Plus,
  ArrowUp,
  ArrowDown,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { getOrderStatistics, getFilteredOrders, getDashboardStats, getLowStockAlerts } from "@/lib/apiServices";

interface RecentOrder {
  id: string;
  table: string;
  amount: number;
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
  time: string;
  items: string[];
  customer?: string;
}

function formatTimeAgo(dateStr: string | Date | undefined) {
  if (!dateStr) return "–";
  const date = new Date(dateStr as string);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}

function todayISORange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  return { start: start.toISOString(), end: end.toISOString() };
}

function yesterdayISORange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
  return { start: start.toISOString(), end: end.toISOString() };
}

export default function Dashboard() {
  const { addToast } = useToast();
  const { user } = useAuth();
  const restaurantId = user?.branchId ?? "";

  const todayRange = useMemo(() => todayISORange(), []);
  const yesterdayRange = useMemo(() => yesterdayISORange(), []);

  const { data: todayStats } = useQuery({
    queryKey: ["orderStatistics", restaurantId, "today"],
    queryFn: () => getOrderStatistics(restaurantId, todayRange.start, todayRange.end),
    enabled: !!restaurantId,
    select: (r: any) => r?.data ?? r,
    staleTime: 60_000,
  });

  const { data: yesterdayStats } = useQuery({
    queryKey: ["orderStatistics", restaurantId, "yesterday"],
    queryFn: () => getOrderStatistics(restaurantId, yesterdayRange.start, yesterdayRange.end),
    enabled: !!restaurantId,
    select: (r: any) => r?.data ?? r,
    staleTime: 60_000,
  });

  const { data: recentOrdersRaw } = useQuery({
    queryKey: ["recentOrders", restaurantId],
    queryFn: () => getFilteredOrders(restaurantId, { limit: 6, skip: 0 }),
    enabled: !!restaurantId,
    select: (r: any) => {
      const src = r?.data ?? r;
      if (Array.isArray(src)) return src;
      if (Array.isArray(src?.orders)) return src.orders;
      return [];
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const { data: dashboardRaw } = useQuery({
    queryKey: ["dashboardStats", restaurantId],
    queryFn: () => getDashboardStats(restaurantId, "today"),
    enabled: !!restaurantId,
    select: (r: any) => r?.data ?? r,
    staleTime: 60_000,
  });

  const { data: alertsRaw } = useQuery({
    queryKey: ["lowStockAlerts", restaurantId],
    queryFn: () => getLowStockAlerts(restaurantId),
    enabled: !!restaurantId,
    select: (r: any) => {
      const src = r?.data ?? r;
      if (Array.isArray(src)) return src;
      if (src && typeof src === "object" && Array.isArray((src as any).alerts)) {
        return (src as any).alerts;
      }
      return [];
    },
    staleTime: 120_000,
  });

  const todaySales = (todayStats?.total_revenue ?? 0) / 100;
  const todayOrders = todayStats?.total_orders ?? 0;
  const avgOrderValue = (todayStats?.avg_order_value ?? 0) / 100;

  const yesterdaySales = (yesterdayStats?.total_revenue ?? 0) / 100;
  const yesterdayOrders = yesterdayStats?.total_orders ?? 0;
  const yesterdayAvg = (yesterdayStats?.avg_order_value ?? 0) / 100;

  const salesGrowth =
    yesterdaySales > 0 ? (((todaySales - yesterdaySales) / yesterdaySales) * 100).toFixed(1) : null;
  const orderGrowth =
    yesterdayOrders > 0
      ? (((todayOrders - yesterdayOrders) / yesterdayOrders) * 100).toFixed(1)
      : null;
  const avgGrowth =
    yesterdayAvg > 0
      ? (((avgOrderValue - yesterdayAvg) / yesterdayAvg) * 100).toFixed(1)
      : null;

  const lowStockItems = alertsRaw?.length ?? 0;

  const topProducts = useMemo(() => {
    const items = dashboardRaw?.top_products ?? [];
    return Array.isArray(items) ? items.slice(0, 5) : [];
  }, [dashboardRaw]);

  const recentOrders: RecentOrder[] = useMemo(() => {
    if (!recentOrdersRaw) return [];
    return recentOrdersRaw.slice(0, 5).map((o: any) => ({
      id: o.order_number ? `#${o.order_number}` : `#${o.id?.slice(-4)}`,
      table: o.table_id ? `Table ${o.table_id}` : o.order_type === "takeaway" ? "Takeaway" : o.order_type ?? "–",
      amount: o.total_amount ?? 0,
      status: o.status ?? "pending",
      time: formatTimeAgo(o.created_at),
      items: (o.items ?? []).map((item: any) => item.product_name ?? item.name ?? "Item"),
      customer: o.guest_name ?? o.customer?.name ?? undefined,
    }));
  }, [recentOrdersRaw]);

  const quickActions = [
    {
      name: "New Order",
      icon: Plus,
      color: "bg-gradient-to-br from-green-500 to-green-600",
      href: "/order",
      description: "Create new order",
    },
    {
      name: "Add Product",
      icon: Plus,
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      href: "/products",
      description: "Add menu item",
    },
    {
      name: "View Reports",
      icon: TrendingUp,
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      href: "/analytics",
      description: "Analytics dashboard",
    },
    {
      name: "Manage Staff",
      icon: Users,
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      href: "/users",
      description: "Staff management",
    },
  ];

  const handleQuickAction = (action: (typeof quickActions)[0]) => {
    addToast({
      type: "info",
      title: `${action.name}`,
      description: `Navigating to ${action.description}...`,
    });
  };

  const getStatusColor = (status: RecentOrder["status"]) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "ready":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "preparing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "confirmed":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <Button variant="outline" className="justify-center">
            Export Data
          </Button>
          <Button className="bg-pos-accent hover:bg-pos-accent/90 justify-center">
            <Zap className="mr-2 h-4 w-4" />
            Quick Order
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
      >
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="bg-card border-border hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Today's Sales</p>
                  <p className="text-2xl font-bold text-foreground">
                    ₹{todaySales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  {salesGrowth !== null && (
                    <div className="flex items-center mt-1">
                      {Number(salesGrowth) >= 0 ? (
                        <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                      ) : (
                        <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <span className={`text-xs font-medium ${Number(salesGrowth) >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {Number(salesGrowth) >= 0 ? "+" : ""}{salesGrowth}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="h-12 w-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="bg-card border-border hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Orders Today</p>
                  <p className="text-2xl font-bold text-foreground">{todayOrders}</p>
                  {orderGrowth !== null && (
                    <div className="flex items-center mt-1">
                      {Number(orderGrowth) >= 0 ? (
                        <ArrowUp className="h-3 w-3 text-blue-500 mr-1" />
                      ) : (
                        <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <span className={`text-xs font-medium ${Number(orderGrowth) >= 0 ? "text-blue-500" : "text-red-500"}`}>
                        {Number(orderGrowth) >= 0 ? "+" : ""}{orderGrowth}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="bg-card border-border hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Orders</p>
                  <p className="text-2xl font-bold text-foreground">
                    {(todayStats?.pending_orders ?? 0) + (todayStats?.confirmed_orders ?? 0) + (todayStats?.preparing_orders ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {todayStats?.ready_orders ?? 0} ready
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="bg-card border-border hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                  <p className="text-2xl font-bold text-foreground">
                    ${avgOrderValue.toFixed(2)}
                  </p>
                  {avgGrowth !== null && (
                    <div className="flex items-center mt-1">
                      {Number(avgGrowth) >= 0 ? (
                        <ArrowUp className="h-3 w-3 text-orange-500 mr-1" />
                      ) : (
                        <ArrowDown className="h-3 w-3 text-red-500 mr-1" />
                      )}
                      <span className={`text-xs font-medium ${Number(avgGrowth) >= 0 ? "text-orange-500" : "text-red-500"}`}>
                        {Number(avgGrowth) >= 0 ? "+" : ""}{avgGrowth}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="h-12 w-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.name}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0, transition: { delay: index * 0.1 } }}
            >
              <Card
                className="bg-card border-border hover:shadow-lg cursor-pointer transition-all duration-300 group"
                onClick={() => handleQuickAction(action)}
              >
                <CardContent className="p-6 text-center">
                  <div
                    className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-lg`}
                  >
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-medium text-foreground group-hover:text-pos-accent transition-colors">
                    {action.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">No orders yet today</p>
                ) : (
                  recentOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0, transition: { delay: index * 0.1 } }}
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-pos-accent text-white text-sm">
                            {order.customer
                              ? order.customer.split(" ").map((n) => n[0]).join("")
                              : order.id.slice(-2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-foreground">{order.id}</span>
                            <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                              {order.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.table}
                            {order.customer ? ` • ${order.customer}` : ""}
                          </div>
                          {order.items.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {order.items.slice(0, 3).join(", ")}
                              {order.items.length > 3 ? ` +${order.items.length - 3}` : ""}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-foreground">${order.amount.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">{order.time}</div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats & Alerts */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Quick Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Active Orders</div>
                    <div className="text-sm text-muted-foreground">Pending + Preparing</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-foreground">
                    {(todayStats?.pending_orders ?? 0) + (todayStats?.preparing_orders ?? 0)}
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center justify-between p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Low Stock Alert</div>
                    <div className="text-sm text-muted-foreground">Items need restocking</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-600 dark:text-yellow-400">
                    {lowStockItems} items
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Completed Orders</div>
                    <div className="text-sm text-muted-foreground">Delivered today</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-foreground">
                    {todayStats?.delivered_orders ?? 0}
                  </div>
                  {todayOrders > 0 && (
                    <div className="text-xs text-green-500">
                      {Math.round(((todayStats?.delivered_orders ?? 0) / todayOrders) * 100)}% rate
                    </div>
                  )}
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
