import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Clock,
  Users,
  CreditCard,
  Download,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import {
  getOrderStatistics,
  listItemReports,
  listCategoryReports,
  getDashboardStats,
  getFilteredOrders,
  getStaffMembers,
} from "@/lib/apiServices";
import type { OrderStatistics, ItemWiseReport, CategoryWiseReport } from "@/shared/api";

interface SalesData {
  period: string;
  revenue: number;
  orders: number;
  avgOrder: number;
  growth: number;
}

interface ProductPerformance {
  name: string;
  sales: number;
  revenue: number;
  category: string;
  trend: "up" | "down" | "stable";
}

interface TimeSlotData {
  hour: string;
  orders: number;
  revenue: number;
}

interface PaymentMethodData {
  method: string;
  percentage: number;
  amount: number;
  color: string;
}

interface StaffPerformance {
  name: string;
  orders: number;
  revenue: number;
  avgOrder: number;
  rating: number;
}

function getDateRange(range: string): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().split("T")[0];
  let start: string;
  const d = new Date(now);
  switch (range) {
    case "1d":
      d.setDate(d.getDate() - 1);
      break;
    case "7d":
      d.setDate(d.getDate() - 7);
      break;
    case "30d":
      d.setDate(d.getDate() - 30);
      break;
    case "90d":
      d.setDate(d.getDate() - 90);
      break;
    default:
      d.setDate(d.getDate() - 7);
  }
  start = d.toISOString().split("T")[0];
  return { start, end };
}

function getPrevRange(range: string): { start: string; end: string } {
  const days = range === "1d" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const now = new Date();
  const endD = new Date(now);
  endD.setDate(endD.getDate() - days);
  const startD = new Date(endD);
  startD.setDate(startD.getDate() - days);
  return { start: startD.toISOString().split("T")[0], end: endD.toISOString().split("T")[0] };
}

const PAYMENT_COLORS: Record<string, string> = {
  card: "bg-pos-accent",
  cash: "bg-blue-500",
  upi: "bg-purple-500",
  digital_wallet: "bg-orange-500",
};

export default function Analytics() {
  const { user } = useAuth();
  const restaurantId = user?.branchId ?? "";
  const [dateRange, setDateRange] = useState("7d");
  const [activeTab, setActiveTab] = useState("overview");

  const { start, end } = getDateRange(dateRange);
  const prev = getPrevRange(dateRange);

  const { data: currStatsRaw } = useQuery({
    queryKey: ["orderStats", restaurantId, start, end],
    queryFn: () => getOrderStatistics(restaurantId, start, end),
    enabled: !!restaurantId,
    select: (r: any) => (r?.data ?? r) as OrderStatistics,
  });

  const { data: prevStatsRaw } = useQuery({
    queryKey: ["orderStats", restaurantId, prev.start, prev.end],
    queryFn: () => getOrderStatistics(restaurantId, prev.start, prev.end),
    enabled: !!restaurantId,
    select: (r: any) => (r?.data ?? r) as OrderStatistics,
  });

  const { data: itemReportsRaw } = useQuery({
    queryKey: ["itemReports", restaurantId],
    queryFn: () => listItemReports(restaurantId, { limit: 10 }),
    enabled: !!restaurantId && activeTab === "products",
    select: (r: any) => {
      const src = r?.data?.data ?? r?.data ?? r;
      return (Array.isArray(src) ? src : []) as ItemWiseReport[];
    },
  });

  const { data: categoryReportsRaw } = useQuery({
    queryKey: ["categoryReports", restaurantId],
    queryFn: () => listCategoryReports(restaurantId, { limit: 20 }),
    enabled: !!restaurantId && activeTab === "products",
    select: (r: any) => {
      const src = r?.data?.data ?? r?.data ?? r;
      return (Array.isArray(src) ? src : []) as CategoryWiseReport[];
    },
  });

  const periodKey = dateRange === "1d" ? "today" : dateRange === "7d" ? "7d" : dateRange === "30d" ? "30d" : "90d";

  const { data: dashboardRaw } = useQuery({
    queryKey: ["dashboardStats", restaurantId, periodKey],
    queryFn: () => getDashboardStats(restaurantId, periodKey),
    enabled: !!restaurantId,
    select: (r: any) => r?.data ?? r,
  });

  const { data: ordersForAnalyticsRaw } = useQuery({
    queryKey: ["analyticsOrders", restaurantId, start, end],
    queryFn: () => getFilteredOrders(restaurantId, { limit: 500 }),
    enabled: !!restaurantId,
    select: (r: any) => {
      const src = r?.data ?? r;
      if (Array.isArray(src)) return src;
      if (Array.isArray(src?.orders)) return src.orders;
      return [];
    },
  });

  const { data: staffRaw } = useQuery({
    queryKey: ["staffMembers", restaurantId],
    queryFn: () => getStaffMembers(restaurantId),
    enabled: !!restaurantId && activeTab === "staff",
    select: (r: any) => {
      const src = r?.data ?? r;
      return Array.isArray(src) ? src : [];
    },
  });

  const peakHours: TimeSlotData[] = useMemo(() => {
    const orders = ordersForAnalyticsRaw ?? [];
    const buckets: Record<string, { orders: number; revenue: number }> = {};
    for (const o of orders) {
      const created = o.created_at ? new Date(o.created_at) : null;
      if (!created || Number.isNaN(created.getTime())) continue;
      const hour = `${String(created.getHours()).padStart(2, "0")}:00`;
      if (!buckets[hour]) buckets[hour] = { orders: 0, revenue: 0 };
      buckets[hour].orders += 1;
      buckets[hour].revenue += (o.total_amount ?? 0) / 100;
    }
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([hour, v]) => ({ hour, orders: v.orders, revenue: Math.round(v.revenue * 100) / 100 }));
  }, [ordersForAnalyticsRaw]);

  const paymentMethods: PaymentMethodData[] = useMemo(() => {
    const orders = ordersForAnalyticsRaw ?? [];
    const totals: Record<string, number> = {};
    for (const o of orders) {
      const method = (o.payment_method ?? "cash").toLowerCase();
      totals[method] = (totals[method] ?? 0) + (o.paid_amount ?? o.total_amount ?? 0);
    }
    const grand = Object.values(totals).reduce((s, v) => s + v, 0) || 1;
    const labels: Record<string, string> = {
      card: "Card",
      cash: "Cash",
      upi: "UPI",
      digital_wallet: "Wallet",
    };
    return Object.entries(totals).map(([method, amount]) => ({
      method: labels[method] ?? method,
      percentage: Math.round((amount / grand) * 1000) / 10,
      amount: amount / 100,
      color: PAYMENT_COLORS[method] ?? "bg-slate-500",
    }));
  }, [ordersForAnalyticsRaw]);

  const staffPerformance: StaffPerformance[] = useMemo(() => {
    const staff = staffRaw ?? [];
    return staff.slice(0, 8).map((s: any) => ({
      name: `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || s.employee_code,
      orders: 0,
      revenue: 0,
      avgOrder: 0,
      rating: s.is_active !== false ? 4.5 : 3,
    }));
  }, [staffRaw]);

  const revenueTrend = dashboardRaw?.revenue_trend ?? [];

  const currStats: OrderStatistics | null = currStatsRaw ?? null;
  const prevStats: OrderStatistics | null = prevStatsRaw ?? null;

  const periodLabel = dateRange === "1d" ? "Last 24h" : dateRange === "7d" ? "Last 7 Days" : dateRange === "30d" ? "Last 30 Days" : "Last 3 Months";
  const prevLabel = dateRange === "1d" ? "Prev 24h" : dateRange === "7d" ? "Prev 7 Days" : dateRange === "30d" ? "Prev 30 Days" : "Prev 3 Months";

  const computeGrowth = (curr: number, prev: number) =>
    prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : 0;

  const salesOverview: SalesData[] = useMemo(() => {
    if (!currStats) return [];
    const items: SalesData[] = [
      {
        period: periodLabel,
        revenue: currStats.total_revenue / 100,
        orders: currStats.total_orders,
        avgOrder: Math.round((currStats.avg_order_value / 100) * 100) / 100,
        growth: prevStats ? computeGrowth(currStats.total_revenue, prevStats.total_revenue) : 0,
      },
    ];
    if (prevStats) {
      items.push({
        period: prevLabel,
        revenue: prevStats.total_revenue / 100,
        orders: prevStats.total_orders,
        avgOrder: Math.round((prevStats.avg_order_value / 100) * 100) / 100,
        growth: 0,
      });
    }
    return items;
  }, [currStats, prevStats, periodLabel, prevLabel]);

  const topProducts: ProductPerformance[] = useMemo(() => {
    if (!itemReportsRaw?.length) return [];
    return itemReportsRaw
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 5)
      .map((item) => ({
        name: item.product_name || "Unknown",
        sales: item.quantity_sold,
        revenue: (item.total_revenue ?? 0) / 100,
        category: item.category_name || "Uncategorized",
        trend: "stable" as const,
      }));
  }, [itemReportsRaw]);

  const categoryData = useMemo(() => {
    if (!categoryReportsRaw?.length) return [];
    const totalRevenue = categoryReportsRaw.reduce((sum, c) => sum + (c.total_revenue ?? 0), 0) / 100;
    return categoryReportsRaw
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 6)
      .map((cat) => ({
        category: cat.category_name || "Uncategorized",
        revenue: (cat.total_revenue ?? 0) / 100,
        percentage:
          totalRevenue > 0
            ? Math.round(((cat.total_revenue ?? 0) / 100 / totalRevenue) * 100)
            : 0,
      }));
  }, [categoryReportsRaw]);

  const handleExport = (format: "csv" | "pdf") => {
    console.log(`Exporting ${activeTab} data as ${format.toUpperCase()}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-pos-text">Analytics & Reports</h1>
          <p className="text-pos-text-muted mt-1">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40 bg-pos-surface border-pos-secondary text-pos-text">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-pos-surface border-pos-secondary">
              <SelectItem value="1d">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 3 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="border-pos-secondary text-pos-text-muted hover:text-pos-text"
            onClick={() => handleExport("csv")}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button className="bg-pos-accent hover:bg-pos-accent/90" onClick={() => handleExport("pdf")}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-pos-surface border-pos-secondary mb-6">
          <TabsTrigger value="overview" className="data-[state=active]:bg-pos-accent data-[state=active]:text-pos-text">
            <BarChart3 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:bg-pos-accent data-[state=active]:text-pos-text">
            <ShoppingBag className="mr-2 h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="time-analysis" className="data-[state=active]:bg-pos-accent data-[state=active]:text-pos-text">
            <Clock className="mr-2 h-4 w-4" />
            Peak Hours
          </TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-pos-accent data-[state=active]:text-pos-text">
            <CreditCard className="mr-2 h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="staff" className="data-[state=active]:bg-pos-accent data-[state=active]:text-pos-text">
            <Users className="mr-2 h-4 w-4" />
            Staff
          </TabsTrigger>
        </TabsList>

        {/* Sales Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {salesOverview.map((data) => (
              <Card key={data.period} className="bg-pos-surface border-pos-secondary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-pos-text-muted flex items-center justify-between">
                    {data.period}
                    {data.growth > 0 ? (
                      <TrendingUp className="h-4 w-4 text-pos-success" />
                    ) : data.growth < 0 ? (
                      <TrendingDown className="h-4 w-4 text-pos-error" />
                    ) : (
                      <Activity className="h-4 w-4 text-pos-text-muted" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-pos-text-muted text-sm">Revenue</span>
                      <span className="text-lg font-bold text-pos-text">
                        ₹{data.revenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-pos-text-muted text-sm">Orders</span>
                      <span className="text-pos-text font-medium">{data.orders}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-pos-text-muted text-sm">Avg Order</span>
                      <span className="text-pos-text font-medium">₹{data.avgOrder}</span>
                    </div>
                    {data.growth !== 0 && (
                      <div className="pt-2 border-t border-pos-secondary">
                        <span className={`text-xs font-medium ${data.growth > 0 ? "text-pos-success" : "text-pos-error"}`}>
                          {data.growth > 0 ? "+" : ""}{data.growth}% vs previous period
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-pos-surface border-pos-secondary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-pos-text-muted text-sm">Total Revenue</p>
                    <p className="text-2xl font-bold text-pos-text">
                      ₹{currStats ? (currStats.total_revenue / 100).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-pos-accent" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-pos-surface border-pos-secondary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-pos-text-muted text-sm">Total Orders</p>
                    <p className="text-2xl font-bold text-pos-text">
                      {currStats?.total_orders?.toLocaleString() ?? "—"}
                    </p>
                  </div>
                  <ShoppingBag className="h-8 w-8 text-pos-accent" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-pos-surface border-pos-secondary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-pos-text-muted text-sm">Avg Order Value</p>
                    <p className="text-2xl font-bold text-pos-text">
                      ₹{currStats ? (currStats.avg_order_value / 100).toFixed(2) : "—"}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-pos-accent" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-pos-surface border-pos-secondary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-pos-text-muted text-sm">Growth Rate</p>
                    <p className={`text-2xl font-bold ${salesOverview[0]?.growth >= 0 ? "text-pos-success" : "text-pos-error"}`}>
                      {salesOverview[0] ? `${salesOverview[0].growth > 0 ? "+" : ""}${salesOverview[0].growth}%` : "—"}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-pos-success" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Status Breakdown */}
          {currStats && (
            <Card className="bg-pos-surface border-pos-secondary">
              <CardHeader>
                <CardTitle className="text-pos-text">Order Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Pending", value: currStats.pending_orders, color: "text-pos-warning" },
                    { label: "Confirmed", value: currStats.confirmed_orders, color: "text-pos-accent" },
                    { label: "Preparing", value: currStats.preparing_orders, color: "text-blue-400" },
                    { label: "Ready", value: currStats.ready_orders, color: "text-pos-success" },
                    { label: "Delivered", value: currStats.delivered_orders, color: "text-pos-success" },
                    { label: "Cancelled", value: currStats.cancelled_orders, color: "text-pos-error" },
                  ].map((s) => (
                    <div key={s.label} className="text-center p-3 rounded-lg bg-pos-primary/50">
                      <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-sm text-pos-text-muted">{s.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Product Performance Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-pos-surface border-pos-secondary">
              <CardHeader>
                <CardTitle className="text-pos-text">Top Performing Products</CardTitle>
              </CardHeader>
              <CardContent>
                {topProducts.length === 0 ? (
                  <div className="text-center py-8 text-pos-text-muted">No product data available. Run item reports first.</div>
                ) : (
                  <div className="space-y-4">
                    {topProducts.map((product, index) => (
                      <div key={product.name} className="flex items-center justify-between p-3 rounded-lg bg-pos-primary/50">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-pos-accent rounded-full flex items-center justify-center text-pos-text font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-pos-text">{product.name}</div>
                            <div className="text-sm text-pos-text-muted">{product.category}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-pos-text">₹{product.revenue.toLocaleString()}</div>
                          <div className="text-sm text-pos-text-muted">{product.sales} sales</div>
                        </div>
                        <div className="flex items-center">
                          <Activity className="h-4 w-4 text-pos-text-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-pos-surface border-pos-secondary">
              <CardHeader>
                <CardTitle className="text-pos-text">Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryData.length === 0 ? (
                  <div className="text-center py-8 text-pos-text-muted">No category data available. Run category reports first.</div>
                ) : (
                  <div className="space-y-4">
                    {categoryData.map((cat) => (
                      <div key={cat.category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-pos-text">{cat.category}</span>
                          <span className="text-pos-text-muted">{cat.percentage}%</span>
                        </div>
                        <div className="w-full bg-pos-secondary rounded-full h-2">
                          <div className="bg-pos-accent h-2 rounded-full" style={{ width: `${cat.percentage}%` }}></div>
                        </div>
                        <div className="text-right text-pos-text font-medium">₹{cat.revenue.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Peak Hours Tab */}
        <TabsContent value="time-analysis" className="space-y-6">
          <Card className="bg-pos-surface border-pos-secondary">
            <CardHeader>
              <CardTitle className="text-pos-text">Peak Hour Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {peakHours.length === 0 && (
                  <p className="text-center text-pos-text-muted col-span-full py-4">No order data for peak hours in this period.</p>
                )}
                {peakHours.map((slot) => (
                  <div key={slot.hour} className="text-center p-4 rounded-lg bg-pos-primary/50">
                    <div className="text-lg font-bold text-pos-text">{slot.hour}</div>
                    <div className="text-sm text-pos-text-muted mt-1">{slot.orders} orders</div>
                    <div className="text-pos-accent font-medium">₹{slot.revenue.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-pos-surface border-pos-secondary">
              <CardHeader>
                <CardTitle className="text-pos-text">Table Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { table: "Table 1", utilization: 85, hours: 6.8 },
                    { table: "Table 2", utilization: 92, hours: 7.4 },
                    { table: "Table 3", utilization: 78, hours: 6.2 },
                    { table: "Table 4", utilization: 95, hours: 7.6 },
                    { table: "Table 5", utilization: 72, hours: 5.8 },
                  ].map((table) => (
                    <div key={table.table} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-pos-text">{table.table}</div>
                        <div className="text-sm text-pos-text-muted">{table.hours}h active</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-pos-secondary rounded-full h-2">
                          <div className="bg-pos-accent h-2 rounded-full" style={{ width: `${table.utilization}%` }}></div>
                        </div>
                        <span className="text-pos-text text-sm w-10">{table.utilization}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-pos-surface border-pos-secondary">
              <CardHeader>
                <CardTitle className="text-pos-text">Order Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: "Dine-in", count: 234, percentage: 65 },
                    { type: "Takeaway", count: 89, percentage: 25 },
                    { type: "Delivery", count: 36, percentage: 10 },
                  ].map((order) => (
                    <div key={order.type} className="flex items-center justify-between">
                      <div className="font-medium text-pos-text">{order.type}</div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-pos-secondary rounded-full h-2">
                          <div className="bg-pos-accent h-2 rounded-full" style={{ width: `${order.percentage}%` }}></div>
                        </div>
                        <span className="text-pos-text text-sm w-16">{order.count} orders</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-pos-surface border-pos-secondary">
              <CardHeader>
                <CardTitle className="text-pos-text">Payment Method Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentMethods.length === 0 && (
                    <p className="text-pos-text-muted text-sm">No payment data in this period.</p>
                  )}
                  {paymentMethods.map((method) => (
                    <div key={method.method} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-pos-text font-medium">{method.method}</span>
                        <span className="text-pos-text-muted">{method.percentage}%</span>
                      </div>
                      <div className="w-full bg-pos-secondary rounded-full h-3">
                        <div className={`${method.color} h-3 rounded-full`} style={{ width: `${method.percentage}%` }}></div>
                      </div>
                      <div className="text-right text-pos-text font-medium">₹{method.amount.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-pos-surface border-pos-secondary">
              <CardHeader>
                <CardTitle className="text-pos-text">Transaction Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: "Total Transactions", value: currStats?.total_orders?.toLocaleString() ?? "—", icon: CreditCard },
                    { label: "Delivered Orders", value: currStats?.delivered_orders?.toLocaleString() ?? "—", icon: TrendingUp },
                    { label: "Cancelled Orders", value: currStats?.cancelled_orders?.toLocaleString() ?? "—", icon: TrendingDown },
                    { label: "Pending Orders", value: currStats?.pending_orders?.toLocaleString() ?? "—", icon: Activity },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between p-3 rounded-lg bg-pos-primary/50">
                      <div className="flex items-center space-x-3">
                        <stat.icon className="h-5 w-5 text-pos-accent" />
                        <span className="text-pos-text">{stat.label}</span>
                      </div>
                      <span className="font-bold text-pos-text">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Staff Performance Tab */}
        <TabsContent value="staff" className="space-y-6">
          <Card className="bg-pos-surface border-pos-secondary">
            <CardHeader>
              <CardTitle className="text-pos-text">Staff Performance Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staffPerformance.map((staff, index) => (
                  <div key={staff.name} className="flex items-center justify-between p-4 rounded-lg bg-pos-primary/50 border border-pos-secondary">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-pos-accent rounded-full flex items-center justify-center text-pos-text font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-pos-text">{staff.name}</div>
                        <div className="flex items-center space-x-4 text-sm text-pos-text-muted">
                          <span>{staff.orders} orders</span>
                          <span>★ {staff.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-pos-text">₹{staff.revenue.toLocaleString()}</div>
                      <div className="text-sm text-pos-text-muted">Avg: ₹{staff.avgOrder}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
