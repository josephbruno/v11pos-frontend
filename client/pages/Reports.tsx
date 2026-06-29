import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  ShoppingCart,
  Package,
  RefreshCw,
  Download,
  UtensilsCrossed,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  getOrderStatistics,
  fetchAllFilteredOrders,
  getIngredients,
  getSuppliers,
} from "@/lib/apiServices";
import {
  formatISTDate,
  formatISTDateShort,
  formatISTDateTimeCompact,
  getISTDateRangeFromDaysAgo,
  getISTDateRangeFromMonthsAgo,
  getISTTodayRange,
  isWithinISTRange,
} from "@/lib/istDate";
import { downloadReportPdf } from "@/lib/exportReportPdf";

const PIE_COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1", "#a4de6c", "#d0ed57"];

function formatInr(rs: number) {
  return `₹${rs.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}


function unwrapList(res: unknown): any[] {
  const r = res as { data?: unknown };
  const src = r?.data ?? res;
  if (Array.isArray(src)) return src;
  if (src && typeof src === "object") {
    const obj = src as Record<string, unknown>;
    for (const key of ["ingredients", "suppliers", "items", "data"]) {
      if (Array.isArray(obj[key])) return obj[key] as any[];
    }
  }
  return [];
}

function getDateRange(range: string): { start: string; end: string } {
  switch (range) {
    case "today":
      return getISTTodayRange();
    case "7days":
      return getISTDateRangeFromDaysAgo(6);
    case "30days":
      return getISTDateRangeFromDaysAgo(29);
    case "3months":
      return getISTDateRangeFromMonthsAgo(3);
    default:
      return getISTDateRangeFromMonthsAgo(12);
  }
}

const StatCard = ({ title, value, sub, icon: Icon, color, trend }: any) => (
  <Card className="bg-card border-border">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {sub != null && (
            <p className={`text-xs flex items-center mt-1 ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
              {trend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {sub}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function Reports() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const restaurantId = user?.branchId ?? "";
  const [dateRange, setDateRange] = useState("30days");

  const { start, end } = useMemo(() => getDateRange(dateRange), [dateRange]);

  // Live order statistics for the selected period
  const { data: statsRaw, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ["reportStats", restaurantId, start, end],
    queryFn: () => getOrderStatistics(restaurantId, start, end),
    enabled: !!restaurantId,
    staleTime: 30_000,
  });

  // Live orders — fetches all pages (100 per page) then filters client-side
  const { data: ordersRaw, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ["reportOrders", restaurantId, start, end],
    queryFn: async () => {
      const all = await fetchAllFilteredOrders(restaurantId, {
        start_date: start,
        end_date: end,
      });
      return all.filter((o: any) => {
        if (!o.created_at) return true;
        return isWithinISTRange(o.created_at, start, end);
      });
    },
    enabled: !!restaurantId,
    staleTime: 30_000,
  });

  const { data: ingredientsRaw } = useQuery({
    queryKey: ["reportIngredients", restaurantId],
    queryFn: () => getIngredients(restaurantId),
    enabled: !!restaurantId,
  });

  const { data: suppliersRaw } = useQuery({
    queryKey: ["reportSuppliers", restaurantId],
    queryFn: () => getSuppliers(restaurantId),
    enabled: !!restaurantId,
  });

  const orders = ordersRaw ?? [];

  // Extract statistics — prefer order-derived revenue so KPI cards match charts
  const stats = useMemo(() => {
    const s = (statsRaw as any)?.data ?? statsRaw ?? {};
    const revenueEligibleOrders = orders.filter(
      (o) => !["cancelled", "refunded"].includes(String(o.status ?? "").toLowerCase()),
    );
    const orderRevenue = revenueEligibleOrders.reduce(
      (sum, o) => sum + Number(o.total_amount ?? 0),
      0,
    );
    const orderCount = revenueEligibleOrders.length;
    const apiRevenue = Number(s.total_revenue ?? 0);
    const totalRevenue = orderCount > 0 ? orderRevenue : apiRevenue;
    const totalOrders = orderCount > 0 ? orderCount : Number(s.total_orders ?? 0);

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue:
        totalOrders > 0
          ? Math.round(totalRevenue / totalOrders)
          : Number(s.average_order_value ?? 0),
      completedOrders: Number(s.completed_orders ?? s.delivered_orders ?? 0),
      cancelledOrders: Number(s.cancelled_orders ?? 0),
    };
  }, [statsRaw, orders]);

  // Aggregate orders by day for trend chart
  const dailyData = useMemo(() => {
    const map: Record<string, { date: string; revenue: number; orders: number }> = {};
    for (const o of orders) {
      if (!o.created_at) continue;
      const d = new Date(o.created_at);
      const key = formatISTDate(d);
      if (!map[key]) map[key] = { date: key, revenue: 0, orders: 0 };
      const amt = Number(o.total_amount ?? 0);
      map[key].revenue += amt;
      map[key].orders += 1;
    }
    return Object.values(map)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        label: formatISTDateShort(d.date),
        revenue: Math.round(d.revenue),
        orders: d.orders,
      }));
  }, [orders]);

  // Order type breakdown
  const orderTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of orders) {
      const type = o.order_type ?? "unknown";
      counts[type] = (counts[type] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, value], i) => ({
      name: name === "dine_in" ? "Dine-In" : name === "takeaway" ? "Take Away" : name,
      value,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [orders]);

  // Payment method breakdown
  const paymentData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of orders) {
      const method = o.payment_method ?? o.payment?.method ?? "unknown";
      counts[method] = (counts[method] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, value], i) => ({
      name: name === "digital_wallet" ? "Wallet" : name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [orders]);

  // Top products from orders
  const topProductsData = useMemo(() => {
    const map: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const o of orders) {
      const items: any[] = o.items ?? o.order_items ?? [];
      for (const item of items) {
        const name = item.product_name ?? item.name ?? "Unknown";
        if (!map[name]) map[name] = { name, qty: 0, revenue: 0 };
        map[name].qty += Number(item.quantity ?? 1);
        map[name].revenue += Number(item.unit_price ?? 0) * Number(item.quantity ?? 1);
      }
    }
    return Object.values(map)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8)
      .map((p) => ({ name: p.name, sold: p.qty, revenue: Math.round(p.revenue) }));
  }, [orders]);

  // Status breakdown
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of orders) {
      const s = o.status ?? "unknown";
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return Object.entries(counts).map(([name, value], i) => ({
      name: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [orders]);

  const stockData = useMemo(() => {
    return unwrapList(ingredientsRaw).map((ing: any) => ({
      category: ing.name ?? "Ingredient",
      current: ing.current_stock ?? ing.quantity ?? 0,
      minimum: ing.minimum_stock ?? ing.min_quantity ?? 0,
    })).slice(0, 10);
  }, [ingredientsRaw]);

  const supplierList = unwrapList(suppliersRaw);
  const isLoading = statsLoading || ordersLoading;

  const handleRefresh = () => {
    refetchStats();
    refetchOrders();
    addToast({ title: "Reports refreshed", type: "success" });
  };

  const handleExport = () => {
    try {
      downloadReportPdf({
        title: "Reports & Analytics",
        restaurantName: (user as { restaurantName?: string; branchName?: string } | undefined)
          ?.restaurantName ?? (user as { branchName?: string } | undefined)?.branchName,
        period: { start, end },
        stats,
        dailyTrend: dailyData,
        topProducts: topProductsData,
        orderTypes: orderTypeData.map(({ name, value }) => ({ name, value })),
        paymentMethods: paymentData.map(({ name, value }) => ({ name, value })),
      });
      addToast({ title: "Report downloaded as PDF", type: "success" });
    } catch {
      addToast({ title: "Failed to export report", type: "error" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Live data · {start} to {end}
            {isLoading && <span className="ml-2 text-xs text-pos-accent animate-pulse">Refreshing…</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px] bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="12months">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={handleExport} className="bg-primary hover:bg-primary/90">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatInr(stats.totalRevenue)}
          icon={IndianRupee}
          color="bg-green-500"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toLocaleString("en-IN")}
          sub={`${stats.completedOrders} completed`}
          trend={1}
          icon={ShoppingCart}
          color="bg-blue-500"
        />
        <StatCard
          title="Avg Order Value"
          value={stats.totalOrders > 0
            ? formatInr(stats.avgOrderValue)
            : "—"}
          icon={Package}
          color="bg-orange-500"
        />
        <StatCard
          title="Cancellations"
          value={stats.cancelledOrders.toLocaleString("en-IN")}
          sub={stats.totalOrders > 0
            ? `${((stats.cancelledOrders / stats.totalOrders) * 100).toFixed(1)}% of orders`
            : undefined}
          trend={stats.cancelledOrders === 0 ? 1 : -1}
          icon={Package}
          color="bg-red-500"
        />
      </div>

      {/* Order summary badges */}
      {orders.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">{orders.length} orders loaded ·</span>
          {orderTypeData.map((t) => (
            <Badge key={t.name} variant="outline" className="gap-1">
              {t.name === "Dine-In" ? <UtensilsCrossed className="h-3 w-3" /> : <ShoppingBag className="h-3 w-3" />}
              {t.name}: {t.value}
            </Badge>
          ))}
        </div>
      )}

      {orders.length === 0 && !isLoading && (
        <Card className="bg-card border-border">
          <CardContent className="py-10 text-center text-muted-foreground">
            No orders found for the selected period. Try a wider date range.
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-muted">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        {/* Sales Tab */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Daily revenue for the selected period (₹)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyData.length > 0 ? dailyData : [{ label: "No data", revenue: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `₹${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px" }}
                      formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} name="Revenue (₹)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Order Volume</CardTitle>
                <CardDescription>Number of orders per day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyData.length > 0 ? dailyData : [{ label: "No data", orders: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px" }} />
                    <Bar dataKey="orders" fill="#82ca9d" name="Orders" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Order Type Split</CardTitle>
                <CardDescription>Dine-In vs Take Away</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={orderTypeData.length > 0 ? orderTypeData : [{ name: "No data", value: 1, color: "#ccc" }]}
                      cx="50%" cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {(orderTypeData.length > 0 ? orderTypeData : [{ color: "#ccc" }]).map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Breakdown by payment type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={paymentData.length > 0 ? paymentData : [{ name: "No data", value: 1, color: "#ccc" }]}
                      cx="50%" cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {(paymentData.length > 0 ? paymentData : [{ color: "#ccc" }]).map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Top Products by Sales</CardTitle>
              <CardDescription>Most ordered items in the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              {topProductsData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No order items found for this period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topProductsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={140} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px" }}
                      formatter={(v: any, name: string) =>
                        name === "Revenue (₹)"
                          ? [`₹${Number(v).toLocaleString("en-IN")}`, name]
                          : [v, name]
                      }
                    />
                    <Legend />
                    <Bar dataKey="sold" fill="#8884d8" name="Units Sold" />
                    <Bar dataKey="revenue" fill="#82ca9d" name="Revenue (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Product table */}
          {topProductsData.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2 pr-4">Product</th>
                        <th className="text-right py-2 pr-4">Units Sold</th>
                        <th className="text-right py-2">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProductsData.map((p) => (
                        <tr key={p.name} className="border-b border-border/50">
                          <td className="py-2 pr-4 font-medium text-foreground">{p.name}</td>
                          <td className="py-2 pr-4 text-right text-muted-foreground">{p.sold}</td>
                          <td className="py-2 text-right font-medium text-pos-accent">{formatInr(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Order Status Breakdown</CardTitle>
                <CardDescription>Distribution of order statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData.length > 0 ? statusData : [{ name: "No data", value: 1, color: "#ccc" }]}
                      cx="50%" cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {(statusData.length > 0 ? statusData : [{ color: "#ccc" }]).map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Revenue vs Orders</CardTitle>
                <CardDescription>Combined trend</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyData.length > 0 ? dailyData : [{ label: "No data", revenue: 0, orders: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" stroke="#8884d8" tickFormatter={(v) => `₹${v}`} />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px" }} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue (₹)" dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#82ca9d" name="Orders" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent orders table */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest {Math.min(orders.length, 20)} orders in the period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 pr-4">Order #</th>
                      <th className="text-left py-2 pr-4">Type</th>
                      <th className="text-left py-2 pr-4">Status</th>
                      <th className="text-left py-2 pr-4">Payment</th>
                      <th className="text-right py-2 pr-4">Amount</th>
                      <th className="text-right py-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 20).map((o: any) => (
                      <tr key={o.id} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-xs text-foreground">
                          #{o.order_number ?? o.id?.slice(-6) ?? "—"}
                        </td>
                        <td className="py-2 pr-4">
                          <Badge variant="outline" className="text-xs">
                            {o.order_type === "dine_in" ? "Dine-In" : o.order_type === "takeaway" ? "Take Away" : o.order_type ?? "—"}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4">
                          <Badge
                            className={`text-xs text-white ${
                              o.status === "completed" || o.status === "delivered" ? "bg-green-500" :
                              o.status === "cancelled" ? "bg-red-500" :
                              o.status === "preparing" ? "bg-yellow-500" :
                              "bg-blue-500"
                            }`}
                          >
                            {o.status?.replace(/_/g, " ") ?? "—"}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4 text-muted-foreground text-xs capitalize">
                          {o.payment_method ?? o.payment?.method ?? "—"}
                        </td>
                        <td className="py-2 pr-4 text-right font-medium text-pos-accent">
                          {formatInr(Number(o.total_amount ?? 0))}
                        </td>
                        <td className="py-2 text-right text-muted-foreground text-xs">
                          {o.created_at ? formatISTDateTimeCompact(o.created_at) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {orders.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">No orders in this period.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Ingredient Stock Levels</CardTitle>
              <CardDescription>Current vs minimum stock</CardDescription>
            </CardHeader>
            <CardContent>
              {stockData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No ingredient data. Add ingredients in Inventory.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={stockData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="category" type="category" stroke="hsl(var(--muted-foreground))" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px" }} />
                    <Legend />
                    <Bar dataKey="minimum" fill="#ff7300" name="Minimum" />
                    <Bar dataKey="current" fill="#8884d8" name="Current Stock" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Suppliers</CardTitle>
              <CardDescription>{supplierList.length} supplier(s) configured</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {supplierList.map((s: any) => (
                <div key={s.id} className="flex justify-between border-b border-border py-3 text-sm">
                  <span className="font-medium text-foreground">{s.name}</span>
                  <span className="text-muted-foreground">{s.phone ?? s.email ?? "—"}</span>
                </div>
              ))}
              {supplierList.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No suppliers yet. Add them in Inventory.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
