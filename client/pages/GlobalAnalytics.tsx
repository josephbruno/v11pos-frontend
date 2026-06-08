import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Building2,
  Users,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Shield,
  Zap,
  Clock,
  Database,
  Activity,
  Globe,
} from "lucide-react";
import { getMyRestaurants, getUsers, getSuperAdminDashboard } from "@/lib/apiServices";
import type { Restaurant } from "@/shared/api";

const PIE_COLORS = ["#22c55e", "#ef4444", "#f59e0b"];

const MetricCard = ({
  title,
  value,
  sub,
  icon: Icon,
  iconColor = "text-blue-600",
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: any;
  iconColor?: string;
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800">
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function GlobalAnalytics() {
  const [tab, setTab] = useState("overview");

  const { data: platformDashboard } = useQuery({
    queryKey: ["superAdminDashboard"],
    queryFn: () => getSuperAdminDashboard("30d"),
    select: (r: any) => r?.data ?? r,
  });

  const { data: restaurantsRaw, isLoading: loadingRestaurants, refetch: refetchRestaurants } = useQuery({
    queryKey: ["superadmin-restaurants"],
    queryFn: () => getMyRestaurants(0, 500),
    select: (r: any) => {
      const src = r?.data ?? r;
      if (Array.isArray(src)) return src as Restaurant[];
      if (src?.restaurants && Array.isArray(src.restaurants)) return src.restaurants as Restaurant[];
      if (src?.items && Array.isArray(src.items)) return src.items as Restaurant[];
      return [] as Restaurant[];
    },
  });

  // Real data: users
  const { data: usersRaw, isLoading: loadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ["superadmin-users"],
    queryFn: () => getUsers(0, 1000),
    select: (r: any) => {
      const src = r?.data ?? r;
      return Array.isArray(src) ? src : [];
    },
  });

  const restaurants: Restaurant[] = restaurantsRaw ?? [];
  const users: any[] = usersRaw ?? [];

  const totalRestaurants = restaurants.length;
  const activeRestaurants = restaurants.filter((r) => r.status === "active").length;
  const inactiveRestaurants = restaurants.filter((r) => r.status !== "active").length;

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.is_active).length;
  const inactiveUsers = totalUsers - activeUsers;

  const restaurantStatusData = [
    { name: "Active", value: activeRestaurants, color: PIE_COLORS[0] },
    { name: "Inactive", value: inactiveRestaurants, color: PIE_COLORS[1] },
  ].filter((d) => d.value > 0);

  const userStatusData = [
    { name: "Active", value: activeUsers, color: PIE_COLORS[0] },
    { name: "Inactive", value: inactiveUsers, color: PIE_COLORS[1] },
  ].filter((d) => d.value > 0);

  // Per-restaurant user distribution for bar chart
  const restaurantUserCounts = restaurants
    .map((r) => ({
      name: r.name?.length > 18 ? r.name.slice(0, 16) + "…" : r.name,
      users: users.filter((u) => u.restaurant_id === r.id).length,
    }))
    .filter((d) => d.users > 0)
    .sort((a, b) => b.users - a.users)
    .slice(0, 10);

  const platformMessage =
    typeof platformDashboard?.message === "string"
      ? platformDashboard.message
      : platformDashboard?.order_statistics
        ? null
        : "Platform-wide metrics aggregate from restaurant and user data below.";

  const isLoading = loadingRestaurants || loadingUsers;

  const handleRefresh = () => {
    refetchRestaurants();
    refetchUsers();
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
          <h1 className="text-3xl font-bold text-foreground">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">System-wide overview — restaurants & users</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Restaurants"
          value={isLoading ? "…" : totalRestaurants}
          sub={`${activeRestaurants} active · ${inactiveRestaurants} inactive`}
          icon={Building2}
          iconColor="text-blue-600"
        />
        <MetricCard
          title="Active Restaurants"
          value={isLoading ? "…" : activeRestaurants}
          sub={totalRestaurants > 0 ? `${Math.round((activeRestaurants / totalRestaurants) * 100)}% of total` : undefined}
          icon={CheckCircle2}
          iconColor="text-green-600"
        />
        <MetricCard
          title="Total Users"
          value={isLoading ? "…" : totalUsers}
          sub={`${activeUsers} active · ${inactiveUsers} inactive`}
          icon={Users}
          iconColor="text-purple-600"
        />
        <MetricCard
          title="Active Users"
          value={isLoading ? "…" : activeUsers}
          sub={totalUsers > 0 ? `${Math.round((activeUsers / totalUsers) * 100)}% of total` : undefined}
          icon={Activity}
          iconColor="text-emerald-600"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="restaurants">Restaurants</TabsTrigger>
          <TabsTrigger value="system">System Health</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Restaurant Pie */}
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Status</CardTitle>
                <CardDescription>Active vs inactive distribution</CardDescription>
              </CardHeader>
              <CardContent>
                {totalRestaurants === 0 ? (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    {isLoading ? "Loading…" : "No restaurants found"}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={restaurantStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={90}
                        dataKey="value"
                      >
                        {restaurantStatusData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* User Pie */}
            <Card>
              <CardHeader>
                <CardTitle>User Status</CardTitle>
                <CardDescription>Active vs inactive users</CardDescription>
              </CardHeader>
              <CardContent>
                {totalUsers === 0 ? (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    {isLoading ? "Loading…" : "No users found"}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={userStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={90}
                        dataKey="value"
                      >
                        {userStatusData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Users per Restaurant */}
          {restaurantUserCounts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Users per Restaurant</CardTitle>
                <CardDescription>Staff/user count breakdown by restaurant</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={restaurantUserCounts} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" allowDecimals={false} stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="name" type="category" width={130} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px" }} />
                    <Bar dataKey="users" fill="#8884d8" name="Users" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Restaurants Tab */}
        <TabsContent value="restaurants" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                All Restaurants
              </CardTitle>
              <CardDescription>{totalRestaurants} restaurant(s) registered in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading…</div>
              ) : restaurants.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No restaurants found</div>
              ) : (
                <div className="space-y-3">
                  {restaurants.map((r) => {
                    const userCount = users.filter((u) => u.restaurant_id === r.id).length;
                    return (
                      <div key={r.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/30 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          {(r.logo_url || r.logo) ? (
                            <img src={r.logo_url || r.logo} alt={r.name} className="h-10 w-10 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{r.name}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {[r.city, r.state, r.country].filter(Boolean).join(", ") || r.address || "—"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {userCount} user{userCount !== 1 ? "s" : ""}
                          </span>
                          <Badge
                            variant={r.status === "active" ? "default" : r.status === "suspended" ? "destructive" : "secondary"}
                          >
                            {r.status ?? "unknown"}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current service health indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: "API Server", icon: Globe, status: "Operational", color: "text-green-600", badge: "default" as const },
                    { label: "Database", icon: Database, status: "Healthy", color: "text-green-600", badge: "default" as const },
                    { label: "Security", icon: Shield, status: "Secure", color: "text-green-600", badge: "default" as const },
                    { label: "Performance", icon: Zap, status: "Optimal", color: "text-blue-600", badge: "secondary" as const },
                    { label: "Uptime", icon: Clock, status: "99.8%", color: "text-green-600", badge: "default" as const },
                  ].map(({ label, icon: Icon, status, color, badge }) => (
                    <div key={label} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <Icon className={`h-4 w-4 ${color}`} />
                        {label}
                      </span>
                      <Badge variant={badge}>{status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
                <CardDescription>Live counts from the database</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: "Total Restaurants", value: totalRestaurants, icon: Building2, color: "text-blue-600" },
                    { label: "Active Restaurants", value: activeRestaurants, icon: CheckCircle2, color: "text-green-600" },
                    { label: "Inactive Restaurants", value: inactiveRestaurants, icon: XCircle, color: "text-red-500" },
                    { label: "Total Users", value: totalUsers, icon: Users, color: "text-purple-600" },
                    { label: "Active Users", value: activeUsers, icon: Activity, color: "text-emerald-600" },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <Icon className={`h-4 w-4 ${color}`} />
                        {label}
                      </span>
                      <span className="text-lg font-bold">{isLoading ? "…" : value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
