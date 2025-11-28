import { useState } from "react";
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

export default function Analytics() {
  const [dateRange, setDateRange] = useState("7d");
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data
  const salesOverview: SalesData[] = [
    {
      period: "Today",
      revenue: 2850.75,
      orders: 127,
      avgOrder: 22.45,
      growth: 12.5,
    },
    {
      period: "Yesterday",
      revenue: 2534.2,
      orders: 113,
      avgOrder: 22.43,
      growth: -5.2,
    },
    {
      period: "This Week",
      revenue: 18450.3,
      orders: 842,
      avgOrder: 21.91,
      growth: 8.7,
    },
    {
      period: "Last Week",
      revenue: 16980.45,
      orders: 789,
      avgOrder: 21.52,
      growth: 15.3,
    },
    {
      period: "This Month",
      revenue: 78920.15,
      orders: 3567,
      avgOrder: 22.12,
      growth: 18.9,
    },
    {
      period: "Last Month",
      revenue: 66434.78,
      orders: 3021,
      avgOrder: 21.99,
      growth: 12.4,
    },
  ];

  const topProducts: ProductPerformance[] = [
    {
      name: "Grilled Chicken",
      sales: 156,
      revenue: 2964.44,
      category: "Main Course",
      trend: "up",
    },
    {
      name: "Caesar Salad",
      sales: 134,
      revenue: 1740.66,
      category: "Appetizers",
      trend: "up",
    },
    {
      name: "Coca Cola",
      sales: 298,
      revenue: 891.02,
      category: "Beverages",
      trend: "stable",
    },
    {
      name: "Fish & Chips",
      sales: 89,
      revenue: 1512.11,
      category: "Main Course",
      trend: "down",
    },
    {
      name: "Chocolate Cake",
      sales: 78,
      revenue: 623.22,
      category: "Desserts",
      trend: "up",
    },
  ];

  const peakHours: TimeSlotData[] = [
    { hour: "12:00", orders: 45, revenue: 1012.5 },
    { hour: "13:00", orders: 52, revenue: 1234.75 },
    { hour: "18:00", orders: 38, revenue: 891.25 },
    { hour: "19:00", orders: 61, revenue: 1456.8 },
    { hour: "20:00", orders: 47, revenue: 1098.4 },
  ];

  const paymentMethods: PaymentMethodData[] = [
    {
      method: "Credit Card",
      percentage: 45,
      amount: 12834.5,
      color: "bg-pos-accent",
    },
    { method: "Cash", percentage: 30, amount: 8556.75, color: "bg-blue-500" },
    { method: "UPI", percentage: 20, amount: 5704.5, color: "bg-purple-500" },
    {
      method: "Wallet",
      percentage: 5,
      amount: 1427.25,
      color: "bg-orange-500",
    },
  ];

  const staffPerformance: StaffPerformance[] = [
    {
      name: "Alex Johnson",
      orders: 67,
      revenue: 1567.89,
      avgOrder: 23.4,
      rating: 4.8,
    },
    {
      name: "Maria Garcia",
      orders: 58,
      revenue: 1323.45,
      avgOrder: 22.82,
      rating: 4.7,
    },
    {
      name: "David Chen",
      orders: 52,
      revenue: 1198.76,
      avgOrder: 23.05,
      rating: 4.6,
    },
    {
      name: "Sarah Wilson",
      orders: 49,
      revenue: 1087.32,
      avgOrder: 22.19,
      rating: 4.5,
    },
  ];

  const handleExport = (format: "csv" | "pdf") => {
    // Export functionality placeholder
    console.log(`Exporting ${activeTab} data as ${format.toUpperCase()}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-pos-text">
            Analytics & Reports
          </h1>
          <p className="text-pos-text-muted mt-1">
            Comprehensive insights and performance metrics
          </p>
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
          <Button
            className="bg-pos-accent hover:bg-pos-accent/90"
            onClick={() => handleExport("pdf")}
          >
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-pos-surface border-pos-secondary mb-6">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-pos-accent data-[state=active]:text-pos-text"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="products"
            className="data-[state=active]:bg-pos-accent data-[state=active]:text-pos-text"
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger
            value="time-analysis"
            className="data-[state=active]:bg-pos-accent data-[state=active]:text-pos-text"
          >
            <Clock className="mr-2 h-4 w-4" />
            Peak Hours
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="data-[state=active]:bg-pos-accent data-[state=active]:text-pos-text"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger
            value="staff"
            className="data-[state=active]:bg-pos-accent data-[state=active]:text-pos-text"
          >
            <Users className="mr-2 h-4 w-4" />
            Staff
          </TabsTrigger>
        </TabsList>

        {/* Sales Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {salesOverview.slice(0, 6).map((data, index) => (
              <Card
                key={data.period}
                className="bg-pos-surface border-pos-secondary"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-pos-text-muted flex items-center justify-between">
                    {data.period}
                    {data.growth > 0 ? (
                      <TrendingUp className="h-4 w-4 text-pos-success" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-pos-error" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-pos-text-muted text-sm">
                        Revenue
                      </span>
                      <span className="text-lg font-bold text-pos-text">
                        ${data.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-pos-text-muted text-sm">
                        Orders
                      </span>
                      <span className="text-pos-text font-medium">
                        {data.orders}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-pos-text-muted text-sm">
                        Avg Order
                      </span>
                      <span className="text-pos-text font-medium">
                        ${data.avgOrder}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-pos-secondary">
                      <span
                        className={`text-xs font-medium ${
                          data.growth > 0
                            ? "text-pos-success"
                            : "text-pos-error"
                        }`}
                      >
                        {data.growth > 0 ? "+" : ""}
                        {data.growth}% vs previous period
                      </span>
                    </div>
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
                    <p className="text-2xl font-bold text-pos-text">$78,920</p>
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
                    <p className="text-2xl font-bold text-pos-text">3,567</p>
                  </div>
                  <ShoppingBag className="h-8 w-8 text-pos-accent" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-pos-surface border-pos-secondary">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-pos-text-muted text-sm">
                      Avg Order Value
                    </p>
                    <p className="text-2xl font-bold text-pos-text">$22.12</p>
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
                    <p className="text-2xl font-bold text-pos-success">
                      +18.9%
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-pos-success" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Product Performance Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-pos-surface border-pos-secondary">
              <CardHeader>
                <CardTitle className="text-pos-text">
                  Top Performing Products
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div
                      key={product.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-pos-primary/50"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-pos-accent rounded-full flex items-center justify-center text-pos-text font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-pos-text">
                            {product.name}
                          </div>
                          <div className="text-sm text-pos-text-muted">
                            {product.category}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-pos-text">
                          ${product.revenue.toLocaleString()}
                        </div>
                        <div className="text-sm text-pos-text-muted">
                          {product.sales} sales
                        </div>
                      </div>
                      <div className="flex items-center">
                        {product.trend === "up" && (
                          <TrendingUp className="h-4 w-4 text-pos-success" />
                        )}
                        {product.trend === "down" && (
                          <TrendingDown className="h-4 w-4 text-pos-error" />
                        )}
                        {product.trend === "stable" && (
                          <Activity className="h-4 w-4 text-pos-text-muted" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-pos-surface border-pos-secondary">
              <CardHeader>
                <CardTitle className="text-pos-text">
                  Category Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { category: "Main Course", revenue: 45680, percentage: 58 },
                    { category: "Beverages", revenue: 15420, percentage: 19 },
                    { category: "Appetizers", revenue: 12340, percentage: 16 },
                    { category: "Desserts", revenue: 5480, percentage: 7 },
                  ].map((cat) => (
                    <div key={cat.category} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-pos-text">{cat.category}</span>
                        <span className="text-pos-text-muted">
                          {cat.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-pos-secondary rounded-full h-2">
                        <div
                          className="bg-pos-accent h-2 rounded-full"
                          style={{ width: `${cat.percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-pos-text font-medium">
                        ${cat.revenue.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Peak Hours Tab */}
        <TabsContent value="time-analysis" className="space-y-6">
          <Card className="bg-pos-surface border-pos-secondary">
            <CardHeader>
              <CardTitle className="text-pos-text">
                Peak Hour Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {peakHours.map((slot) => (
                  <div
                    key={slot.hour}
                    className="text-center p-4 rounded-lg bg-pos-primary/50"
                  >
                    <div className="text-lg font-bold text-pos-text">
                      {slot.hour}
                    </div>
                    <div className="text-sm text-pos-text-muted mt-1">
                      {slot.orders} orders
                    </div>
                    <div className="text-pos-accent font-medium">
                      ${slot.revenue.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-pos-surface border-pos-secondary">
              <CardHeader>
                <CardTitle className="text-pos-text">
                  Table Utilization
                </CardTitle>
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
                    <div
                      key={table.table}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium text-pos-text">
                          {table.table}
                        </div>
                        <div className="text-sm text-pos-text-muted">
                          {table.hours}h active
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-pos-secondary rounded-full h-2">
                          <div
                            className="bg-pos-accent h-2 rounded-full"
                            style={{ width: `${table.utilization}%` }}
                          ></div>
                        </div>
                        <span className="text-pos-text text-sm w-10">
                          {table.utilization}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-pos-surface border-pos-secondary">
              <CardHeader>
                <CardTitle className="text-pos-text">
                  Order Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { type: "Dine-in", count: 234, percentage: 65 },
                    { type: "Takeaway", count: 89, percentage: 25 },
                    { type: "Delivery", count: 36, percentage: 10 },
                  ].map((order) => (
                    <div
                      key={order.type}
                      className="flex items-center justify-between"
                    >
                      <div className="font-medium text-pos-text">
                        {order.type}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-pos-secondary rounded-full h-2">
                          <div
                            className="bg-pos-accent h-2 rounded-full"
                            style={{ width: `${order.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-pos-text text-sm w-16">
                          {order.count} orders
                        </span>
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
                <CardTitle className="text-pos-text">
                  Payment Method Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div key={method.method} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-pos-text font-medium">
                          {method.method}
                        </span>
                        <span className="text-pos-text-muted">
                          {method.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-pos-secondary rounded-full h-3">
                        <div
                          className={`${method.color} h-3 rounded-full`}
                          style={{ width: `${method.percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-pos-text font-medium">
                        ${method.amount.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-pos-surface border-pos-secondary">
              <CardHeader>
                <CardTitle className="text-pos-text">
                  Transaction Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      label: "Total Transactions",
                      value: "3,567",
                      icon: CreditCard,
                    },
                    {
                      label: "Successful Payments",
                      value: "3,542",
                      icon: TrendingUp,
                    },
                    {
                      label: "Failed Payments",
                      value: "25",
                      icon: TrendingDown,
                    },
                    { label: "Refunds Processed", value: "12", icon: Activity },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="flex items-center justify-between p-3 rounded-lg bg-pos-primary/50"
                    >
                      <div className="flex items-center space-x-3">
                        <stat.icon className="h-5 w-5 text-pos-accent" />
                        <span className="text-pos-text">{stat.label}</span>
                      </div>
                      <span className="font-bold text-pos-text">
                        {stat.value}
                      </span>
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
              <CardTitle className="text-pos-text">
                Staff Performance Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {staffPerformance.map((staff, index) => (
                  <div
                    key={staff.name}
                    className="flex items-center justify-between p-4 rounded-lg bg-pos-primary/50 border border-pos-secondary"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-pos-accent rounded-full flex items-center justify-center text-pos-text font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-pos-text">
                          {staff.name}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-pos-text-muted">
                          <span>{staff.orders} orders</span>
                          <span>★ {staff.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-pos-text">
                        ${staff.revenue.toLocaleString()}
                      </div>
                      <div className="text-sm text-pos-text-muted">
                        Avg: ${staff.avgOrder}
                      </div>
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
