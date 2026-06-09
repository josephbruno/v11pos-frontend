import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  IndianRupee,
  ShoppingBag,
  ArrowUp,
  ArrowDown,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import {
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
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import {
  getOrderStatistics,
  getFilteredOrders,
  fetchAllFilteredOrders,
  getDashboardStats,
} from "@/lib/apiServices";
import {
  formatISTDateTime,
  getISTHour,
  getISTTodayRange,
  getISTYesterdayRange,
} from "@/lib/istDate";

interface RecentOrder {
  id: string;
  table: string;
  amount: number;
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
  time: string;
  items: string[];
  customer?: string;
}

const CHART_COLORS = ["#16a34a", "#2563eb", "#7c3aed", "#d97706", "#dc2626", "#0891b2", "#db2777"];

const STATUS_META: Record<string, { color: string; bg: string; text: string }> = {
  pending:   { color: "#f59e0b", bg: "bg-amber-100 dark:bg-amber-900/20",   text: "text-amber-800 dark:text-amber-400" },
  confirmed: { color: "#6366f1", bg: "bg-indigo-100 dark:bg-indigo-900/20", text: "text-indigo-800 dark:text-indigo-400" },
  preparing: { color: "#3b82f6", bg: "bg-blue-100 dark:bg-blue-900/20",     text: "text-blue-800 dark:text-blue-400" },
  ready:     { color: "#8b5cf6", bg: "bg-violet-100 dark:bg-violet-900/20", text: "text-violet-800 dark:text-violet-400" },
  delivered: { color: "#22c55e", bg: "bg-green-100 dark:bg-green-900/20",   text: "text-green-800 dark:text-green-400" },
  cancelled: { color: "#ef4444", bg: "bg-red-100 dark:bg-red-900/20",       text: "text-red-800 dark:text-red-400" },
};

function formatTimeAgo(dateStr: string | Date | undefined) {
  if (!dateStr) return "–";
  const date = new Date(dateStr as string);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return formatISTDateTime(date);
}


const CurrencyTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2.5 shadow-2xl text-xs min-w-[120px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground">{p.name}</span>
          </div>
          <span className="font-bold text-foreground">
            {p.name === "Revenue" ? `₹${Number(p.value).toLocaleString("en-IN")}` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const DonutTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: { fill } } = payload[0];
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-2xl text-xs">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fill }} />
        <span className="font-semibold text-foreground">{name}:</span>
        <span className="font-bold" style={{ color: fill }}>{value}</span>
      </div>
    </div>
  );
};

const ProductTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2.5 shadow-2xl text-xs">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill ?? p.color }} />
            <span className="text-muted-foreground">{p.name}</span>
          </div>
          <span className="font-bold text-foreground">
            {p.name === "Revenue" ? `₹${Number(p.value).toLocaleString("en-IN")}` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const fade = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };
const container = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };

export default function Dashboard() {
  const { user } = useAuth();
  const restaurantId = user?.branchId ?? "";

  const todayRange     = useMemo(() => getISTTodayRange(), []);
  const yesterdayRange = useMemo(() => getISTYesterdayRange(), []);

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
    queryKey: ["dashboardStats", restaurantId, "today"],
    queryFn: () => getDashboardStats(restaurantId, "today"),
    enabled: !!restaurantId,
    select: (r: any) => r?.data ?? r,
    staleTime: 60_000,
  });

  const { data: todayOrdersRaw } = useQuery({
    queryKey: ["todayOrdersTrend", restaurantId, todayRange.start],
    queryFn: async () => {
      const arr = await fetchAllFilteredOrders(restaurantId, {
        start_date: todayRange.start,
        end_date: todayRange.end,
      });
      const todayStart = new Date(todayRange.start);
      return arr.filter((o: any) => {
        if (!o.created_at) return false;
        return new Date(o.created_at) >= todayStart;
      });
    },
    enabled: !!restaurantId,
    staleTime: 60_000,
  });

  // ── Derived values ──────────────────────────────────────────────────────────
  const todaySales     = (todayStats?.total_revenue ?? 0) / 100;
  const todayOrders    = todayStats?.total_orders ?? 0;
  const avgOrderValue  = (todayStats?.avg_order_value ?? 0) / 100;

  const yesterdaySales  = (yesterdayStats?.total_revenue ?? 0) / 100;
  const yesterdayOrders = yesterdayStats?.total_orders ?? 0;
  const yesterdayAvg    = (yesterdayStats?.avg_order_value ?? 0) / 100;

  const salesGrowth  = yesterdaySales  > 0 ? (((todaySales - yesterdaySales) / yesterdaySales) * 100).toFixed(1) : null;
  const orderGrowth  = yesterdayOrders > 0 ? (((todayOrders - yesterdayOrders) / yesterdayOrders) * 100).toFixed(1) : null;
  const avgGrowth    = yesterdayAvg    > 0 ? (((avgOrderValue - yesterdayAvg) / yesterdayAvg) * 100).toFixed(1) : null;

  // Revenue trend — full hourly timeline from 00:00 to current hour
  const revenueTrendData = useMemo(() => {
    const currentHour = getISTHour(new Date());
    // Pre-fill all hours with 0 so the chart always has a full day shape
    const slots: { label: string; revenue: number; orders: number }[] = [];
    for (let h = 0; h <= currentHour; h++) {
      slots.push({ label: `${String(h).padStart(2, "0")}:00`, revenue: 0, orders: 0 });
    }
    for (const o of (todayOrdersRaw ?? [])) {
      const d = o.created_at ? new Date(o.created_at) : null;
      if (!d || Number.isNaN(d.getTime())) continue;
      const h = getISTHour(d);
      if (h >= 0 && h <= currentHour) {
        slots[h].revenue += (o.total_amount ?? 0) / 100;
        slots[h].orders  += 1;
      }
    }
    return slots.map(s => ({ ...s, revenue: Math.round(s.revenue) }));
  }, [todayOrdersRaw]);

  // Order status donut
  const orderStatusData = useMemo(() => [
    { name: "Pending",   value: todayStats?.pending_orders   ?? 0, fill: "#f59e0b" },
    { name: "Confirmed", value: todayStats?.confirmed_orders ?? 0, fill: "#6366f1" },
    { name: "Preparing", value: todayStats?.preparing_orders ?? 0, fill: "#3b82f6" },
    { name: "Ready",     value: todayStats?.ready_orders     ?? 0, fill: "#8b5cf6" },
    { name: "Delivered", value: todayStats?.delivered_orders ?? 0, fill: "#22c55e" },
    { name: "Cancelled", value: todayStats?.cancelled_orders ?? 0, fill: "#ef4444" },
  ].filter(d => d.value > 0), [todayStats]);

  const totalOrdersForDonut = orderStatusData.reduce((s, d) => s + d.value, 0);

  // Top products bar chart
  const topProductsData = useMemo(() => {
    const items = dashboardRaw?.top_products ?? [];
    if (!Array.isArray(items)) return [];
    return items.slice(0, 6).map((p: any) => {
      const rawRev = p.revenue ?? p.total_revenue ?? 0;
      return {
        name:    (p.name ?? p.product_name ?? "Item").slice(0, 14),
        Revenue: rawRev > 10000 ? Math.round(rawRev / 100) : Math.round(rawRev),
        Sales:   p.quantity_sold ?? p.sales ?? p.count ?? 0,
      };
    });
  }, [dashboardRaw]);

  // Recent orders
  const recentOrders: RecentOrder[] = useMemo(() => {
    if (!recentOrdersRaw) return [];
    return recentOrdersRaw.slice(0, 5).map((o: any) => ({
      id:       o.order_number ? `#${o.order_number}` : `#${(o.id ?? "").slice(-4)}`,
      table:    o.table_id ? `Table ${o.table_id}` : o.order_type === "takeaway" ? "Takeaway" : (o.order_type ?? "–"),
      amount:   o.total_amount ?? 0,
      status:   o.status ?? "pending",
      time:     formatTimeAgo(o.created_at),
      items:    (o.items ?? []).map((item: any) => item.product_name ?? item.name ?? "Item"),
      customer: o.guest_name ?? o.customer?.name ?? undefined,
    }));
  }, [recentOrdersRaw]);

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="space-y-6 pb-6">

      {/* ── Header ───────────────────────────────────────────────── */}
      <motion.div variants={fade} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Welcome back! Here's what's happening today.</p>
        </div>
      </motion.div>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <motion.div variants={fade} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Today's Sales",
            value: `₹${todaySales.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
            growth: salesGrowth,
            icon: <IndianRupee className="h-5 w-5" />,
            from: "from-green-500", to: "to-emerald-600",
            muted: "text-green-100",
          },
          {
            label: "Orders Today",
            value: String(todayOrders),
            growth: orderGrowth,
            icon: <ShoppingBag className="h-5 w-5" />,
            from: "from-blue-500", to: "to-blue-600",
            muted: "text-blue-100",
          },
          {
            label: "Active Orders",
            value: String((todayStats?.pending_orders ?? 0) + (todayStats?.confirmed_orders ?? 0) + (todayStats?.preparing_orders ?? 0)),
            sub: `${todayStats?.ready_orders ?? 0} ready to serve`,
            icon: <Activity className="h-5 w-5" />,
            from: "from-purple-500", to: "to-violet-600",
            muted: "text-purple-100",
          },
          {
            label: "Avg Order Value",
            value: `₹${avgOrderValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`,
            growth: avgGrowth,
            icon: <TrendingUp className="h-5 w-5" />,
            from: "from-orange-500", to: "to-amber-600",
            muted: "text-orange-100",
          },
        ].map((card) => (
          <motion.div key={card.label} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="h-full">
            <Card className={`bg-gradient-to-br ${card.from} ${card.to} border-0 text-white overflow-hidden h-full`}>
              <CardContent className="p-5 h-full flex flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <p className={`${card.muted} text-xs font-medium`}>{card.label}</p>
                  <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                    {card.icon}
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-black tracking-tight">{card.value}</p>
                  {/* Always render this row so all cards stay the same height */}
                  <div className="mt-1.5 h-5 flex items-center">
                    {card.growth != null ? (
                      <div className="flex items-center gap-0.5">
                        {Number(card.growth) >= 0
                          ? <ArrowUp className="h-3 w-3 shrink-0" />
                          : <ArrowDown className="h-3 w-3 shrink-0" />
                        }
                        <span className="text-xs font-semibold">
                          {Number(card.growth) >= 0 ? "+" : ""}{card.growth}% vs yesterday
                        </span>
                      </div>
                    ) : card.sub ? (
                      <p className={`${card.muted} text-xs`}>{card.sub}</p>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Revenue Trend AreaChart ───────────────────────────────── */}
      <motion.div variants={fade}>
        <Card className="bg-card border-border">
          <CardHeader className="pb-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-foreground text-base">Revenue Trend — Today</CardTitle>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-[#16a34a] inline-block rounded" />Revenue (₹)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-[#2563eb] inline-block rounded" />Orders
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueTrendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#16a34a" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="dashOrdGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false} tickLine={false}
                  interval={Math.max(0, Math.ceil(revenueTrendData.length / 8) - 1)}
                />
                <YAxis
                  yAxisId="rev"
                  orientation="left"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => v === 0 ? "₹0" : `₹${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                  width={52}
                />
                <YAxis
                  yAxisId="ord"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false} tickLine={false}
                  allowDecimals={false}
                  width={28}
                />
                <Tooltip content={<CurrencyTooltip />} />
                <Area
                  yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue"
                  stroke="#16a34a" strokeWidth={2.5} fill="url(#dashRevGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#16a34a", strokeWidth: 2, stroke: "#fff" }}
                />
                <Area
                  yAxisId="ord" type="monotone" dataKey="orders" name="Orders"
                  stroke="#2563eb" strokeWidth={2} fill="url(#dashOrdGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#2563eb", strokeWidth: 2, stroke: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Order Status Donut + Top Products Bar ─────────────────── */}
      <motion.div variants={fade} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Order Status Donut */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-0">
            <CardTitle className="text-foreground text-base">Order Status — Today</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {orderStatusData.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <ShoppingBag className="h-8 w-8 opacity-30" />
                <span className="text-sm">No orders yet today</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative flex-shrink-0">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie
                        data={orderStatusData}
                        cx="50%" cy="50%"
                        innerRadius={52} outerRadius={78}
                        paddingAngle={3} dataKey="value"
                        strokeWidth={0}
                      >
                        {orderStatusData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<DonutTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-foreground">{totalOrdersForDonut}</span>
                    <span className="text-xs text-muted-foreground">Total</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2 min-w-0">
                  {orderStatusData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                        <span className="text-sm text-muted-foreground truncate">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-foreground">{d.value}</span>
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {totalOrdersForDonut > 0 ? `${Math.round((d.value / totalOrdersForDonut) * 100)}%` : ""}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products Horizontal Bar */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-0">
            <CardTitle className="text-foreground text-base">Top Products — Today</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {topProductsData.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <ShoppingBag className="h-8 w-8 opacity-30" />
                <span className="text-sm">No product data yet</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={topProductsData}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false} tickLine={false}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <YAxis
                    type="category" dataKey="name"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false} tickLine={false}
                    width={72}
                  />
                  <Tooltip content={<ProductTooltip />} />
                  <Bar dataKey="Revenue" radius={[0, 5, 5, 0]}>
                    {topProductsData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Recent Orders + Quick Insights ────────────────────────── */}
      <motion.div variants={fade} className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Recent Orders */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-base">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {recentOrders.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-muted-foreground gap-2">
                  <ShoppingBag className="h-7 w-7 opacity-30" />
                  <span className="text-sm">No orders yet today</span>
                </div>
              ) : recentOrders.map((order, i) => {
                const meta = STATUS_META[order.status] ?? STATUS_META.pending;
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: i * 0.05 } }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border hover:shadow-sm hover:bg-muted/60 transition-all"
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-pos-accent text-white text-xs font-bold">
                        {order.customer
                          ? order.customer.split(" ").map((n) => n[0]).join("").slice(0, 2)
                          : order.id.slice(-2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">{order.id}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${meta.bg} ${meta.text}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {order.table}{order.customer ? ` · ${order.customer}` : ""}
                      </div>
                      {order.items.length > 0 && (
                        <div className="text-xs text-muted-foreground/60 truncate max-w-[200px]">
                          {order.items.slice(0, 2).join(", ")}{order.items.length > 2 ? ` +${order.items.length - 2}` : ""}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-foreground text-sm">
                        ₹{Number(order.amount ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-xs text-muted-foreground">{order.time}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Insights */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground text-base">Quick Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                label: "Active Orders",
                sub: "Pending + Preparing",
                value: (todayStats?.pending_orders ?? 0) + (todayStats?.preparing_orders ?? 0),
                icon: <Clock className="h-5 w-5 text-blue-500" />,
                bg: "bg-blue-50 dark:bg-blue-900/20",
                border: "border-blue-200 dark:border-blue-800",
                valColor: "text-blue-600 dark:text-blue-400",
                iconBg: "bg-blue-500/15",
              },
              {
                label: "Completed Orders",
                sub: `${todayOrders > 0 ? Math.round(((todayStats?.delivered_orders ?? 0) / todayOrders) * 100) : 0}% completion rate`,
                value: todayStats?.delivered_orders ?? 0,
                icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
                bg: "bg-green-50 dark:bg-green-900/20",
                border: "border-green-200 dark:border-green-800",
                valColor: "text-green-600 dark:text-green-400",
                iconBg: "bg-green-500/15",
              },
              {
                label: "Cancelled Orders",
                sub: "Cancelled today",
                value: todayStats?.cancelled_orders ?? 0,
                icon: <XCircle className="h-5 w-5 text-red-500" />,
                bg: "bg-red-50 dark:bg-red-900/20",
                border: "border-red-200 dark:border-red-800",
                valColor: "text-red-600 dark:text-red-400",
                iconBg: "bg-red-500/15",
              },
            ].map((ins) => (
              <motion.div
                key={ins.label}
                whileHover={{ scale: 1.01 }}
                className={`flex items-center justify-between p-4 rounded-xl ${ins.bg} border ${ins.border} transition-all`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 ${ins.iconBg} rounded-xl flex items-center justify-center`}>
                    {ins.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground text-sm">{ins.label}</div>
                    <div className="text-xs text-muted-foreground">{ins.sub}</div>
                  </div>
                </div>
                <div className={`text-2xl font-black ${ins.valColor}`}>{ins.value}</div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
