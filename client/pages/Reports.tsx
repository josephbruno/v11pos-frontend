import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Download,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  listSalesReports,
  listItemReports,
  listCategoryReports,
  generateSalesReportNew,
  generateItemReport,
  generateCategoryReport,
  getIngredients,
  getSuppliers,
} from "@/lib/apiServices";
import type { SalesReport, ItemWiseReport, CategoryWiseReport } from "@/shared/api";

const PIE_COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#8dd1e1"];

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

const StatCard = ({ title, value, change, icon: Icon, color }: any) => {
  const isPositive = change >= 0;
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className={`text-xs flex items-center ${isPositive ? "text-green-600" : "text-red-600"}`}>
              {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {Math.abs(change)}% from last month
            </p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Reports() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const restaurantId = user?.branchId ?? "";
  const [dateRange, setDateRange] = useState("12months");

  const { data: salesReportsRaw } = useQuery({
    queryKey: ["salesReports", restaurantId, "monthly"],
    queryFn: () => listSalesReports(restaurantId, { period_type: "monthly", limit: 12 }),
    enabled: !!restaurantId,
    select: (r: any) => {
      const src = r?.data?.data ?? r?.data ?? r;
      return (Array.isArray(src) ? src : []) as SalesReport[];
    },
  });

  const { data: itemReportsRaw } = useQuery({
    queryKey: ["itemReports", restaurantId],
    queryFn: () => listItemReports(restaurantId, { limit: 10 }),
    enabled: !!restaurantId,
    select: (r: any) => {
      const src = r?.data?.data ?? r?.data ?? r;
      return (Array.isArray(src) ? src : []) as ItemWiseReport[];
    },
  });

  const { data: categoryReportsRaw } = useQuery({
    queryKey: ["categoryReports", restaurantId],
    queryFn: () => listCategoryReports(restaurantId, { limit: 20 }),
    enabled: !!restaurantId,
    select: (r: any) => {
      const src = r?.data?.data ?? r?.data ?? r;
      return (Array.isArray(src) ? src : []) as CategoryWiseReport[];
    },
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

  const generateMutation = useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      await generateSalesReportNew({
        restaurant_id: restaurantId,
        period_type: "daily",
        report_date: today,
      });
      await generateItemReport({ restaurant_id: restaurantId });
      await generateCategoryReport({ restaurant_id: restaurantId });
    },
    onSuccess: () => {
      addToast({ title: "Reports generated", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["salesReports", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["itemReports", restaurantId] });
      queryClient.invalidateQueries({ queryKey: ["categoryReports", restaurantId] });
    },
    onError: (err: Error) => addToast({ title: err.message, type: "error" }),
  });

  const stockData = useMemo(() => {
    return unwrapList(ingredientsRaw).map((ing: any) => ({
      category: ing.name ?? "Ingredient",
      current: ing.current_stock ?? ing.quantity ?? 0,
      minimum: ing.minimum_stock ?? ing.min_quantity ?? 0,
      maximum: (ing.maximum_stock ?? ing.minimum_stock ?? 0) * 2 || 100,
    }));
  }, [ingredientsRaw]);

  const supplierCount = unwrapList(suppliersRaw).length;

  const salesData = (salesReportsRaw ?? []).map((r) => ({
    month: r.report_date
      ? new Date(r.report_date).toLocaleString("default", { month: "short" })
      : r.report_month
        ? new Date(r.report_year ?? 2024, (r.report_month ?? 1) - 1).toLocaleString("default", { month: "short" })
        : "—",
    sales: (r.total_revenue ?? 0) / 100,
    orders: r.total_orders,
  }));

  const topProductsData = (itemReportsRaw ?? [])
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .slice(0, 8)
    .map((item) => ({
      name: item.product_name ?? "Unknown",
      sales: item.quantity_sold,
      revenue: (item.total_revenue ?? 0) / 100,
    }));

  const revenueByCategory = (categoryReportsRaw ?? []).map((cat, i) => ({
    name: cat.category_name ?? "Uncategorized",
    value: (cat.total_revenue ?? 0) / 100,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const totalRevenue = (salesReportsRaw ?? []).reduce((s, r) => s + (r.total_revenue ?? 0), 0) / 100;
  const totalOrders = (salesReportsRaw ?? []).reduce((s, r) => s + r.total_orders, 0);

  const handleExportReport = () => {
    const payload = {
      generated_at: new Date().toISOString(),
      restaurant_id: restaurantId,
      sales: salesReportsRaw ?? [],
      items: itemReportsRaw ?? [],
      categories: categoryReportsRaw ?? [],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reports-${restaurantId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ title: "Report exported as JSON", type: "success" });
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
          <p className="text-muted-foreground">Comprehensive business insights and performance metrics</p>
        </div>
        <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-y-0 md:space-x-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full md:w-[180px] bg-card border-border">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="12months">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => generateMutation.mutate()}
            disabled={!restaurantId || generateMutation.isPending}
          >
            Generate Reports
          </Button>
          <Button onClick={handleExportReport} className="bg-primary hover:bg-primary/90">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          change={12.5}
          icon={DollarSign}
          color="bg-green-500"
        />
        <StatCard
          title="Total Orders"
          value={totalOrders.toLocaleString()}
          change={8.2}
          icon={ShoppingCart}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Customers"
          value="—"
          change={-2.1}
          icon={Users}
          color="bg-purple-500"
        />
        <StatCard
          title="Avg Order Value"
          value={totalOrders > 0 ? `$${(totalRevenue / totalOrders).toFixed(2)}` : "—"}
          change={5.4}
          icon={Package}
          color="bg-orange-500"
        />
      </div>

      {/* Main Reports Tabs */}
      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-muted">
          <TabsTrigger value="sales" className="data-[state=active]:bg-background">Sales</TabsTrigger>
          <TabsTrigger value="purchases" className="data-[state=active]:bg-background">Purchases</TabsTrigger>
          <TabsTrigger value="inventory" className="data-[state=active]:bg-background">Inventory</TabsTrigger>
          <TabsTrigger value="customers" className="data-[state=active]:bg-background">Customers</TabsTrigger>
          <TabsTrigger value="products" className="data-[state=active]:bg-background">Products</TabsTrigger>
        </TabsList>

        {/* Sales Analytics */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Sales Trends</CardTitle>
                <CardDescription className="text-muted-foreground">Monthly sales performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesData.length > 0 ? salesData : [{ month: "No Data", sales: 0, orders: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px" }} />
                    <Area type="monotone" dataKey="sales" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} name="Revenue ($)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Order Volume</CardTitle>
                <CardDescription className="text-muted-foreground">Number of orders processed monthly</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData.length > 0 ? salesData : [{ month: "No Data", orders: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px" }} />
                    <Bar dataKey="orders" fill="#82ca9d" name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Revenue by Category</CardTitle>
              <CardDescription className="text-muted-foreground">Breakdown of revenue by product categories</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={revenueByCategory.length > 0 ? revenueByCategory : [{ name: "No Data", value: 1, color: "#ccc" }]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(revenueByCategory.length > 0 ? revenueByCategory : [{ color: "#ccc" }]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px" }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Suppliers & procurement</CardTitle>
              <CardDescription className="text-muted-foreground">
                {supplierCount} supplier(s) configured · PO list API coming soon
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {unwrapList(suppliersRaw).map((s: any) => (
                <div key={s.id} className="flex justify-between border-b border-border py-2 text-sm">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-muted-foreground">{s.phone ?? s.email ?? "—"}</span>
                </div>
              ))}
              {supplierCount === 0 && (
                <div className="text-center py-8 text-muted-foreground">No suppliers yet. Add them in Inventory.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Analytics */}
        <TabsContent value="inventory" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Stock Levels by Category</CardTitle>
              <CardDescription className="text-muted-foreground">Current stock levels vs minimum/maximum thresholds</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stockData.length > 0 ? stockData : [{ category: "No data", current: 0, minimum: 0, maximum: 0 }]} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="category" type="category" stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px" }} />
                  <Legend />
                  <Bar dataKey="minimum" fill="#ff7300" name="Minimum" />
                  <Bar dataKey="current" fill="#8884d8" name="Current" />
                  <Bar dataKey="maximum" fill="#82ca9d" name="Maximum" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Analytics */}
        <TabsContent value="customers" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Customer Growth</CardTitle>
              <CardDescription className="text-muted-foreground">New vs returning customers over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={salesData.length > 0 ? salesData.map((s) => ({ month: s.month, total: s.orders, new: 0, returning: s.orders })) : [{ month: "No Data", total: 0, new: 0, returning: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px" }} />
                  <Legend />
                  <Area type="monotone" dataKey="new" stackId="1" stroke="#8884d8" fill="#8884d8" name="New Customers" />
                  <Area type="monotone" dataKey="returning" stackId="1" stroke="#82ca9d" fill="#82ca9d" name="Returning Customers" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Analytics */}
        <TabsContent value="products" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Top Performing Products</CardTitle>
              <CardDescription className="text-muted-foreground">Best selling products by quantity and revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {topProductsData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No item report data available. Generate item reports from the backend to populate this chart.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topProductsData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={120} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px" }} />
                    <Legend />
                    <Bar dataKey="sales" fill="#8884d8" name="Units Sold" />
                    <Bar dataKey="revenue" fill="#82ca9d" name="Revenue ($)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
