import { useState } from "react";
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
  FileText,
  Download,
  Calendar,
  BarChart3,
} from "lucide-react";

// Sample data - In a real app, this would come from your API
const salesData = [
  { month: "Jan", sales: 45000, orders: 120 },
  { month: "Feb", sales: 52000, orders: 145 },
  { month: "Mar", sales: 48000, orders: 132 },
  { month: "Apr", sales: 61000, orders: 168 },
  { month: "May", sales: 55000, orders: 155 },
  { month: "Jun", sales: 67000, orders: 189 },
  { month: "Jul", sales: 72000, orders: 201 },
  { month: "Aug", sales: 68000, orders: 187 },
  { month: "Sep", sales: 74000, orders: 203 },
  { month: "Oct", sales: 69000, orders: 195 },
  { month: "Nov", sales: 81000, orders: 225 },
  { month: "Dec", sales: 87000, orders: 241 },
];

const purchaseData = [
  { month: "Jan", purchases: 18000, suppliers: 12 },
  { month: "Feb", purchases: 21000, suppliers: 14 },
  { month: "Mar", purchases: 19500, suppliers: 13 },
  { month: "Apr", purchases: 24000, suppliers: 16 },
  { month: "May", purchases: 22500, suppliers: 15 },
  { month: "Jun", purchases: 26000, suppliers: 17 },
  { month: "Jul", purchases: 28000, suppliers: 18 },
  { month: "Aug", purchases: 27200, suppliers: 17 },
  { month: "Sep", purchases: 29500, suppliers: 19 },
  { month: "Oct", purchases: 28800, suppliers: 18 },
  { month: "Nov", purchases: 32000, suppliers: 20 },
  { month: "Dec", purchases: 34500, suppliers: 21 },
];

const stockData = [
  { category: "Beverages", current: 850, minimum: 200, maximum: 1000 },
  { category: "Main Dishes", current: 450, minimum: 100, maximum: 500 },
  { category: "Appetizers", current: 320, minimum: 80, maximum: 400 },
  { category: "Desserts", current: 180, minimum: 50, maximum: 250 },
  { category: "Sides", current: 290, minimum: 75, maximum: 350 },
];

const topProductsData = [
  { name: "Margherita Pizza", sales: 1240, revenue: 18600 },
  { name: "Chicken Caesar Salad", sales: 980, revenue: 14700 },
  { name: "Beef Burger", sales: 890, revenue: 15670 },
  { name: "Pasta Carbonara", sales: 750, revenue: 11250 },
  { name: "Fish & Chips", sales: 680, revenue: 12240 },
];

const revenueByCategory = [
  { name: "Main Dishes", value: 45, color: "#8884d8" },
  { name: "Beverages", value: 25, color: "#82ca9d" },
  { name: "Appetizers", value: 15, color: "#ffc658" },
  { name: "Desserts", value: 10, color: "#ff7300" },
  { name: "Sides", value: 5, color: "#8dd1e1" },
];

const customerAnalytics = [
  { month: "Jan", new: 45, returning: 89, total: 134 },
  { month: "Feb", new: 52, returning: 98, total: 150 },
  { month: "Mar", new: 48, returning: 92, total: 140 },
  { month: "Apr", new: 61, returning: 107, total: 168 },
  { month: "May", new: 55, returning: 100, total: 155 },
  { month: "Jun", new: 67, returning: 122, total: 189 },
];

const StatCard = ({ title, value, change, icon: Icon, color }: any) => {
  const isPositive = change >= 0;
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p
              className={`text-xs flex items-center ${isPositive ? "text-green-600" : "text-red-600"}`}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
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
  const [dateRange, setDateRange] = useState("12months");
  const [reportType, setReportType] = useState("overview");

  const handleExportReport = () => {
    // In a real app, this would generate and download the report
    console.log("Exporting report...");
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
          <h1 className="text-3xl font-bold text-foreground">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Comprehensive business insights and performance metrics
          </p>
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
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleExportReport}
            className="bg-primary hover:bg-primary/90"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value="$742,580"
          change={12.5}
          icon={DollarSign}
          color="bg-green-500"
        />
        <StatCard
          title="Total Orders"
          value="2,361"
          change={8.2}
          icon={ShoppingCart}
          color="bg-blue-500"
        />
        <StatCard
          title="Total Customers"
          value="1,847"
          change={-2.1}
          icon={Users}
          color="bg-purple-500"
        />
        <StatCard
          title="Stock Items"
          value="892"
          change={5.4}
          icon={Package}
          color="bg-orange-500"
        />
      </div>

      {/* Main Reports Tabs */}
      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-muted">
          <TabsTrigger
            value="sales"
            className="data-[state=active]:bg-background"
          >
            Sales
          </TabsTrigger>
          <TabsTrigger
            value="purchases"
            className="data-[state=active]:bg-background"
          >
            Purchases
          </TabsTrigger>
          <TabsTrigger
            value="inventory"
            className="data-[state=active]:bg-background"
          >
            Inventory
          </TabsTrigger>
          <TabsTrigger
            value="customers"
            className="data-[state=active]:bg-background"
          >
            Customers
          </TabsTrigger>
          <TabsTrigger
            value="products"
            className="data-[state=active]:bg-background"
          >
            Products
          </TabsTrigger>
        </TabsList>

        {/* Sales Analytics */}
        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Sales Trends</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Monthly sales performance over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="month"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Order Volume</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Number of orders processed monthly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="month"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Bar dataKey="orders" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">
                Revenue by Category
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Breakdown of revenue by product categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={revenueByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {revenueByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Purchase Analytics */}
        <TabsContent value="purchases" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Purchase Trends
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Monthly purchase expenses over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={purchaseData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="month"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="purchases"
                      stroke="#ff7300"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Supplier Count
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Number of active suppliers by month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={purchaseData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="month"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                    />
                    <Bar dataKey="suppliers" fill="#8dd1e1" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Inventory Analytics */}
        <TabsContent value="inventory" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">
                Stock Levels by Category
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Current stock levels vs minimum/maximum thresholds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={stockData} layout="horizontal">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    dataKey="category"
                    type="category"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
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
              <CardDescription className="text-muted-foreground">
                New vs returning customers over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={customerAnalytics}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="new"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="New Customers"
                  />
                  <Area
                    type="monotone"
                    dataKey="returning"
                    stackId="1"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    name="Returning Customers"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Analytics */}
        <TabsContent value="products" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">
                Top Performing Products
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Best selling products by quantity and revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topProductsData} layout="horizontal">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="hsl(var(--muted-foreground))"
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="sales" fill="#8884d8" name="Units Sold" />
                  <Bar dataKey="revenue" fill="#82ca9d" name="Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
