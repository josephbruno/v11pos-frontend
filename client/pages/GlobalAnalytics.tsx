import { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Globe,
  Building2,
  Users,
  Database,
  Activity,
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  Zap,
  Shield,
  Clock,
} from "lucide-react";

// Mock global analytics data
const systemMetrics = [
  {
    month: "Jan",
    organizations: 12,
    activeUsers: 450,
    revenue: 125000,
    dataPoints: 2400000,
  },
  {
    month: "Feb",
    organizations: 15,
    activeUsers: 523,
    revenue: 142000,
    dataPoints: 2850000,
  },
  {
    month: "Mar",
    organizations: 18,
    activeUsers: 598,
    revenue: 165000,
    dataPoints: 3200000,
  },
  {
    month: "Apr",
    organizations: 22,
    activeUsers: 674,
    revenue: 189000,
    dataPoints: 3650000,
  },
  {
    month: "May",
    organizations: 26,
    activeUsers: 742,
    revenue: 212000,
    dataPoints: 4100000,
  },
  {
    month: "Jun",
    organizations: 31,
    activeUsers: 825,
    revenue: 238000,
    dataPoints: 4580000,
  },
];

const performanceData = [
  {
    name: "API Response Time",
    value: 125,
    unit: "ms",
    status: "good",
    trend: -5,
  },
  {
    name: "Database Queries/sec",
    value: 1240,
    unit: "qps",
    status: "good",
    trend: 12,
  },
  {
    name: "System Uptime",
    value: 99.8,
    unit: "%",
    status: "excellent",
    trend: 0.2,
  },
  {
    name: "Active Connections",
    value: 3420,
    unit: "",
    status: "good",
    trend: 8,
  },
  {
    name: "Data Processing",
    value: 2.4,
    unit: "TB/day",
    status: "good",
    trend: 15,
  },
  {
    name: "Error Rate",
    value: 0.02,
    unit: "%",
    status: "excellent",
    trend: -0.01,
  },
];

const organizationUsage = [
  { name: "Restaurant Chains", value: 45, color: "#8884d8" },
  { name: "Independent Restaurants", value: 35, color: "#82ca9d" },
  { name: "Food Courts", value: 15, color: "#ffc658" },
  { name: "Cafeterias", value: 5, color: "#ff7300" },
];

const regionalData = [
  { region: "North America", organizations: 18, revenue: 145000, growth: 12 },
  { region: "Europe", organizations: 8, revenue: 89000, growth: 24 },
  { region: "Asia Pacific", organizations: 5, revenue: 67000, growth: 45 },
  { region: "Latin America", organizations: 2, revenue: 23000, growth: 67 },
];

const featureUsage = [
  { feature: "POS System", usage: 98, organizations: 31 },
  { feature: "QR Ordering", usage: 87, organizations: 27 },
  { feature: "Analytics", usage: 76, organizations: 24 },
  { feature: "Inventory", usage: 82, organizations: 25 },
  { feature: "Reports", usage: 91, organizations: 28 },
  { feature: "Customer Management", usage: 68, organizations: 21 },
];

const StatCard = ({ title, value, unit, icon: Icon, trend, status }: any) => {
  const isPositive = trend >= 0;
  const statusColor =
    status === "excellent"
      ? "text-green-600"
      : status === "good"
        ? "text-blue-600"
        : "text-yellow-600";

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">
              {value}
              {unit && (
                <span className="text-sm text-muted-foreground ml-1">
                  {unit}
                </span>
              )}
            </p>
            {trend !== undefined && (
              <p
                className={`text-xs flex items-center ${isPositive ? "text-green-600" : "text-red-600"}`}
              >
                {isPositive ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(trend)}
                {unit} from last month
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full bg-slate-100 dark:bg-slate-800`}>
            <Icon className={`h-6 w-6 ${statusColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function GlobalAnalytics() {
  const [timeRange, setTimeRange] = useState("6months");
  const [selectedMetric, setSelectedMetric] = useState("revenue");

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
            Global Analytics
          </h1>
          <p className="text-muted-foreground">
            Cross-system insights and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Organizations"
          value={31}
          icon={Building2}
          trend={5}
          status="good"
        />
        <StatCard
          title="Active Users"
          value={825}
          icon={Users}
          trend={83}
          status="excellent"
        />
        <StatCard
          title="Monthly Revenue"
          value={238}
          unit="K"
          icon={DollarSign}
          trend={26}
          status="excellent"
        />
        <StatCard
          title="Data Processed"
          value={4.58}
          unit="M"
          icon={Database}
          trend={0.48}
          status="good"
        />
      </div>

      {/* System Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            System Performance Metrics
          </CardTitle>
          <CardDescription>
            Real-time system health and performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {performanceData.map((metric) => (
              <div key={metric.name} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{metric.name}</span>
                  <Badge
                    variant={
                      metric.status === "excellent"
                        ? "default"
                        : metric.status === "good"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {metric.status}
                  </Badge>
                </div>
                <div className="text-2xl font-bold">
                  {metric.value}
                  {metric.unit}
                </div>
                <div
                  className={`text-xs flex items-center ${
                    metric.trend >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {metric.trend >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {Math.abs(metric.trend)}
                  {metric.unit} vs last period
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="growth" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="growth">Growth Analytics</TabsTrigger>
          <TabsTrigger value="usage">Feature Usage</TabsTrigger>
          <TabsTrigger value="regional">Regional Insights</TabsTrigger>
          <TabsTrigger value="technical">Technical Metrics</TabsTrigger>
        </TabsList>

        {/* Growth Analytics */}
        <TabsContent value="growth" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Growth Trends</CardTitle>
                <CardDescription>
                  Organizations and user growth over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={systemMetrics}>
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
                      dataKey="organizations"
                      stackId="1"
                      stroke="#8884d8"
                      fill="#8884d8"
                      name="Organizations"
                    />
                    <Area
                      type="monotone"
                      dataKey="activeUsers"
                      stackId="2"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      name="Active Users"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Organization Types</CardTitle>
                <CardDescription>
                  Distribution by business category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={organizationUsage}
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
                      {organizationUsage.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Growth</CardTitle>
              <CardDescription>
                Monthly recurring revenue across all organizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={systemMetrics}>
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
                    dataKey="revenue"
                    stroke="#8884d8"
                    strokeWidth={3}
                    dot={{ fill: "#8884d8", r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feature Usage */}
        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Adoption</CardTitle>
              <CardDescription>
                Usage rates across different system features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={featureUsage} layout="horizontal">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    dataKey="feature"
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
                  <Bar dataKey="usage" fill="#8884d8" name="Usage %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regional Insights */}
        <TabsContent value="regional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Regional Performance</CardTitle>
              <CardDescription>
                Geographic distribution and growth metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {regionalData.map((region) => (
                  <div
                    key={region.region}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <Globe className="h-8 w-8 text-blue-600" />
                      <div>
                        <h3 className="font-semibold">{region.region}</h3>
                        <p className="text-sm text-muted-foreground">
                          {region.organizations} organizations
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        ${region.revenue.toLocaleString()}
                      </div>
                      <div className="text-sm text-green-600 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />+{region.growth}%
                        growth
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technical Metrics */}
        <TabsContent value="technical" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Processing Volume</CardTitle>
                <CardDescription>
                  System data throughput over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={systemMetrics}>
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
                      dataKey="dataPoints"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>
                  Current system status and alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-green-600" />
                      Security Status
                    </span>
                    <Badge variant="default">Secure</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Zap className="h-4 w-4 mr-2 text-blue-600" />
                      Performance
                    </span>
                    <Badge variant="default">Optimal</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-green-600" />
                      Uptime
                    </span>
                    <Badge variant="default">99.8%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Database className="h-4 w-4 mr-2 text-blue-600" />
                      Storage Health
                    </span>
                    <Badge variant="default">Good</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
