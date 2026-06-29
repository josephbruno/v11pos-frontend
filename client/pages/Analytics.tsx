import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  ShoppingBag,
  Clock,
  Users,
  CreditCard,
  Download,
  Calendar,
  BarChart3,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
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
import { useToast } from "@/contexts/ToastContext";
import {
  getOrderStatistics,
  listItemReports,
  listCategoryReports,
  getDashboardStats,
  fetchAllFilteredOrders,
  getStaffMembers,
} from "@/lib/apiServices";
import {
  getISTDateRangeFromDaysAgo,
  getISTHour,
  getISTPreviousRange,
  getISTTodayRange,
  isWithinISTRange,
} from "@/lib/istDate";
import type { OrderStatistics, ItemWiseReport, CategoryWiseReport } from "@/shared/api";
import { downloadReportPdf } from "@/lib/exportReportPdf";
import { downloadReportCsv } from "@/lib/exportReportCsv";
import { buildAnalyticsExportPayload } from "@/lib/buildAnalyticsExport";

// ── colour palette ──────────────────────────────────────────────────────────
const C = {
  green:  "#16a34a",
  blue:   "#2563eb",
  purple: "#7c3aed",
  amber:  "#d97706",
  red:    "#dc2626",
  cyan:   "#0891b2",
  pink:   "#db2777",
  teal:   "#0d9488",
};
const PALETTE = [C.green, C.blue, C.purple, C.amber, C.red, C.cyan, C.pink, C.teal];

const STATUS_COLORS = [
  { key: "Pending",   fill: "#f59e0b" },
  { key: "Confirmed", fill: "#6366f1" },
  { key: "Preparing", fill: "#3b82f6" },
  { key: "Ready",     fill: "#8b5cf6" },
  { key: "Delivered", fill: "#22c55e" },
  { key: "Cancelled", fill: "#ef4444" },
];

// ── tooltip helpers ─────────────────────────────────────────────────────────
/** Recharts defaults to fill="#ccc" for the hover band — override for dark theme */
const CHART_TOOLTIP_CURSOR = { fill: "hsl(var(--muted))", fillOpacity: 0.2 };

const TooltipBox = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-card border border-border rounded-xl px-3 py-2.5 shadow-2xl text-xs min-w-[140px]">
    {children}
  </div>
);

const RevTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <TooltipBox>
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3 mt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.fill ?? p.color }} />
            <span className="text-muted-foreground">{p.name}</span>
          </div>
          <span className="font-bold text-foreground">
            {p.name === "Revenue" || p.name === "Avg Order"
              ? `₹${Number(p.value).toLocaleString("en-IN")}`
              : p.value}
          </span>
        </div>
      ))}
    </TooltipBox>
  );
};

const PieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: { fill } } = payload[0];
  return (
    <TooltipBox>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fill }} />
        <span className="font-semibold" style={{ color: fill }}>{name}</span>
        <span className="font-bold text-foreground ml-auto">{value}</span>
      </div>
    </TooltipBox>
  );
};

const PieRevTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: { fill } } = payload[0];
  return (
    <TooltipBox>
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fill }} />
        <span className="font-semibold" style={{ color: fill }}>{name}</span>
        <span className="font-bold text-foreground ml-auto">₹{Number(value).toLocaleString("en-IN")}</span>
      </div>
    </TooltipBox>
  );
};

// ── helpers ─────────────────────────────────────────────────────────────────
function getDateRange(range: string): { start: string; end: string } {
  switch (range) {
    case "1d":
      return getISTTodayRange();
    case "7d":
      return getISTDateRangeFromDaysAgo(6);
    case "30d":
      return getISTDateRangeFromDaysAgo(29);
    case "90d":
      return getISTDateRangeFromDaysAgo(89);
    default:
      return getISTDateRangeFromDaysAgo(6);
  }
}

function getPrevRange(range: string): { start: string; end: string } {
  const span = range === "1d" ? 1 : range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return getISTPreviousRange(span);
}

// ── component ────────────────────────────────────────────────────────────────
export default function Analytics() {
  const { user } = useAuth();
  const { addToast } = useToast();
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

  const { data: ordersRaw } = useQuery({
    queryKey: ["analyticsOrders", restaurantId, start, end],
    queryFn: async () => {
      const arr = await fetchAllFilteredOrders(restaurantId, {
        start_date: start,
        end_date: end,
      });
      return arr.filter((o: any) => {
        if (!o.created_at) return true;
        return isWithinISTRange(o.created_at, start, end);
      });
    },
    enabled: !!restaurantId,
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

  const currStats: OrderStatistics | null = currStatsRaw ?? null;
  const prevStats: OrderStatistics | null = prevStatsRaw ?? null;

  const periodLabel = dateRange === "1d" ? "Last 24h" : dateRange === "7d" ? "Last 7 Days" : dateRange === "30d" ? "Last 30 Days" : "Last 3 Months";
  const prevLabel   = dateRange === "1d" ? "Prev 24h"  : dateRange === "7d" ? "Prev 7 Days" : dateRange === "30d" ? "Prev 30 Days" : "Prev 3 Months";

  const computeGrowth = (curr: number, prev: number) =>
    prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : 0;

  // ── Revenue trend chart (bar — curr vs prev) ────────────────────────────
  const revenueTrendChart = useMemo(() => {
    const apiTrend = dashboardRaw?.revenue_trend;
    if (Array.isArray(apiTrend) && apiTrend.length > 0) {
      // Only use api trend entries that have a valid label (skip null/empty entries)
      const valid = apiTrend.filter((t: any) => t.label || t.date || t.hour);
      if (valid.length > 0) {
        return valid.map((t: any) => ({
          label:   String(t.label ?? t.date ?? t.hour),
          Revenue: typeof t.revenue === "number" ? (t.revenue > 100000 ? Math.round(t.revenue / 100) : Math.round(t.revenue)) : 0,
          Orders:  t.orders ?? t.order_count ?? 0,
        }));
      }
    }
    // Fallback: current vs previous period comparison
    if (!currStats) return [];
    const rows: any[] = [
      {
        label:       periodLabel,
        Revenue:     Math.round(currStats.total_revenue / 100),
        Orders:      currStats.total_orders,
        "Avg Order": Math.round(currStats.avg_order_value / 100),
      },
    ];
    if (prevStats) {
      rows.push({
        label:       prevLabel,
        Revenue:     Math.round(prevStats.total_revenue / 100),
        Orders:      prevStats.total_orders,
        "Avg Order": Math.round(prevStats.avg_order_value / 100),
      });
    }
    return rows;
  }, [dashboardRaw, currStats, prevStats, periodLabel, prevLabel]);

  // ── Order status donut ───────────────────────────────────────────────────
  const statusDonut = useMemo(() => {
    if (!currStats) return [];
    return STATUS_COLORS.map((s) => ({
      name:  s.key,
      value: currStats[(s.key.toLowerCase() + "_orders") as keyof OrderStatistics] as number ?? 0,
      fill:  s.fill,
    })).filter(d => d.value > 0);
  }, [currStats]);

  const totalStatusOrders = statusDonut.reduce((s, d) => s + d.value, 0);

  // ── Top products horizontal bar ─────────────────────────────────────────
  const topProductsChart = useMemo(() => {
    if (!itemReportsRaw?.length) return [];
    return itemReportsRaw
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 8)
      .map((item) => ({
        name:    (item.product_name || "Unknown").slice(0, 16),
        Revenue: Math.round((item.total_revenue ?? 0) / 100),
        Sales:   item.quantity_sold,
      }));
  }, [itemReportsRaw]);

  // ── Category pie chart ───────────────────────────────────────────────────
  const categoryPie = useMemo(() => {
    if (!categoryReportsRaw?.length) return [];
    return categoryReportsRaw
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 7)
      .map((cat, i) => ({
        name:    cat.category_name || "Uncategorized",
        value:   Math.round((cat.total_revenue ?? 0) / 100),
        fill:    PALETTE[i % PALETTE.length],
        pct:     0,
      }))
      .map((cat, _, arr) => {
        const total = arr.reduce((s, c) => s + c.value, 0);
        return { ...cat, pct: total > 0 ? Math.round((cat.value / total) * 100) : 0 };
      });
  }, [categoryReportsRaw]);

  // ── Peak hours bar chart ─────────────────────────────────────────────────
  const peakHoursChart = useMemo(() => {
    const orders = ordersRaw ?? [];
    const buckets: Record<string, { orders: number; revenue: number }> = {};
    for (const o of orders) {
      const created = o.created_at ? new Date(o.created_at) : null;
      if (!created || Number.isNaN(created.getTime())) continue;
      const hour = `${String(getISTHour(created)).padStart(2, "0")}:00`;
      if (!buckets[hour]) buckets[hour] = { orders: 0, revenue: 0 };
      buckets[hour].orders += 1;
      buckets[hour].revenue += (o.total_amount ?? 0) / 100;
    }
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, v]) => ({
        hour,
        Orders:  v.orders,
        Revenue: Math.round(v.revenue),
      }));
  }, [ordersRaw]);

  // ── Payment methods donut ────────────────────────────────────────────────
  const paymentPie = useMemo(() => {
    const orders = ordersRaw ?? [];
    const totals: Record<string, number> = {};
    for (const o of orders) {
      const method = (o.payment_method ?? "cash").toLowerCase();
      totals[method] = (totals[method] ?? 0) + (o.paid_amount ?? o.total_amount ?? 0);
    }
    const labels: Record<string, string> = { card: "Card", cash: "Cash", upi: "UPI", digital_wallet: "Wallet" };
    const grand = Object.values(totals).reduce((s, v) => s + v, 0) || 1;
    return Object.entries(totals).map(([method, amount], i) => ({
      name:       labels[method] ?? method,
      value:      Math.round(amount / 100),
      percentage: Math.round((amount / grand) * 1000) / 10,
      fill:       PALETTE[i % PALETTE.length],
    }));
  }, [ordersRaw]);

  // ── Staff performance ────────────────────────────────────────────────────
  const staffChart = useMemo(() => {
    const staff = staffRaw ?? [];
    return staff.slice(0, 8).map((s: any) => ({
      name:   (`${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || s.employee_code).slice(0, 14),
      Orders:  0,
      Revenue: 0,
      Rating:  s.is_active !== false ? 4.5 : 3,
    }));
  }, [staffRaw]);

  const growth = currStats && prevStats ? computeGrowth(currStats.total_revenue, prevStats.total_revenue) : 0;

  const handleExport = (format: "csv" | "pdf") => {
    try {
      const restaurantName =
        (user as { restaurantName?: string; branchName?: string } | undefined)?.restaurantName ??
        (user as { branchName?: string } | undefined)?.branchName;

      const payload = buildAnalyticsExportPayload({
        restaurantName,
        start,
        end,
        currStats,
        orders: ordersRaw ?? [],
        revenueTrend: revenueTrendChart,
        topProducts: topProductsChart,
        paymentPie,
        statusDonut,
        peakHours: peakHoursChart,
        categories: categoryPie,
      });

      if (format === "pdf") {
        downloadReportPdf(payload);
        addToast({ title: "Analytics report downloaded as PDF", type: "success" });
      } else {
        downloadReportCsv(payload);
        addToast({ title: "Analytics report downloaded as CSV", type: "success" });
      }
    } catch {
      addToast({ title: "Failed to export analytics report", type: "error" });
    }
  };

  // ── KPI stat card helper ─────────────────────────────────────────────────
  const StatCard = ({
    title, value, icon: Icon, subValue, subLabel, grow, color = "text-pos-accent",
  }: {
    title: string; value: string; icon: any;
    subValue?: string; subLabel?: string; grow?: number;
    color?: string;
  }) => (
    <Card className="bg-pos-surface border-pos-secondary">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-pos-text-muted text-xs font-medium truncate">{title}</p>
            <p className={`text-2xl font-black mt-1 ${color} text-pos-text`}>{value}</p>
            {grow !== undefined ? (
              <div className="flex items-center gap-1 mt-1">
                {grow >= 0
                  ? <TrendingUp className="h-3 w-3 text-pos-success" />
                  : <TrendingDown className="h-3 w-3 text-pos-error" />
                }
                <span className={`text-xs font-medium ${grow >= 0 ? "text-pos-success" : "text-pos-error"}`}>
                  {grow >= 0 ? "+" : ""}{grow}%
                </span>
              </div>
            ) : subValue ? (
              <p className="text-xs text-pos-text-muted mt-1">{subValue} <span className="text-pos-text-muted/70">{subLabel}</span></p>
            ) : null}
          </div>
          <div className="w-10 h-10 rounded-xl bg-pos-accent/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-pos-accent" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // ── Empty state ──────────────────────────────────────────────────────────
  const EmptyChart = ({ label }: { label: string }) => (
    <div className="h-52 flex flex-col items-center justify-center text-pos-text-muted gap-2">
      <BarChart3 className="h-8 w-8 opacity-25" />
      <span className="text-sm">{label}</span>
    </div>
  );

  return (
    <div className="space-y-6 pb-6">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-pos-text">Analytics & Reports</h1>
          <p className="text-pos-text-muted text-sm mt-0.5">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          <Button variant="outline" size="sm" className="border-pos-secondary text-pos-text-muted hover:text-pos-text gap-2" onClick={() => handleExport("csv")}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button size="sm" className="bg-pos-accent hover:bg-pos-accent/90 gap-2" onClick={() => handleExport("pdf")}>
            <Download className="h-4 w-4" /> PDF
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-pos-surface border border-pos-secondary">
          <TabsTrigger value="overview"      className="data-[state=active]:bg-pos-accent data-[state=active]:text-white gap-2"><BarChart3 className="h-4 w-4" />Overview</TabsTrigger>
          <TabsTrigger value="products"      className="data-[state=active]:bg-pos-accent data-[state=active]:text-white gap-2"><ShoppingBag className="h-4 w-4" />Products</TabsTrigger>
          <TabsTrigger value="time-analysis" className="data-[state=active]:bg-pos-accent data-[state=active]:text-white gap-2"><Clock className="h-4 w-4" />Peak Hours</TabsTrigger>
          <TabsTrigger value="payments"      className="data-[state=active]:bg-pos-accent data-[state=active]:text-white gap-2"><CreditCard className="h-4 w-4" />Payments</TabsTrigger>
          <TabsTrigger value="staff"         className="data-[state=active]:bg-pos-accent data-[state=active]:text-white gap-2"><Users className="h-4 w-4" />Staff</TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════ OVERVIEW ══════════════════ */}
        <TabsContent value="overview" className="space-y-6 mt-6">

          {/* KPI row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Revenue" icon={IndianRupee}
              value={currStats ? `₹${(currStats.total_revenue / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—"}
              grow={prevStats ? computeGrowth(currStats?.total_revenue ?? 0, prevStats.total_revenue) : undefined}
            />
            <StatCard
              title="Total Orders" icon={ShoppingBag}
              value={currStats?.total_orders?.toLocaleString() ?? "—"}
              grow={prevStats ? computeGrowth(currStats?.total_orders ?? 0, prevStats.total_orders) : undefined}
            />
            <StatCard
              title="Avg Order Value" icon={TrendingUp}
              value={currStats ? `₹${(currStats.avg_order_value / 100).toFixed(0)}` : "—"}
              grow={prevStats ? computeGrowth(currStats?.avg_order_value ?? 0, prevStats.avg_order_value) : undefined}
            />
            <StatCard
              title="Growth Rate" icon={Activity}
              value={currStats ? `${growth >= 0 ? "+" : ""}${growth}%` : "—"}
              color={growth >= 0 ? "text-pos-success" : "text-pos-error"}
            />
          </div>

          {/* Revenue / Orders bar chart */}
          <Card className="bg-pos-surface border-pos-secondary">
            <CardHeader className="pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-pos-text text-base">Revenue & Orders — {periodLabel}</CardTitle>
                <div className="flex items-center gap-4 text-xs text-pos-text-muted">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#16a34a] inline-block rounded" />Revenue</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#2563eb] inline-block rounded" />Orders</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {revenueTrendChart.length === 0 ? (
                <EmptyChart label="No revenue data for this period" />
              ) : revenueTrendChart.length <= 3 ? (
                /* Grouped bar for period comparison */
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={revenueTrendChart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="rev" orientation="left"  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} width={52} />
                    <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip content={<RevTooltip />} cursor={CHART_TOOLTIP_CURSOR} />
                    <Bar yAxisId="rev" dataKey="Revenue" name="Revenue" fill={C.green}  radius={[4, 4, 0, 0]} maxBarSize={60} />
                    <Bar yAxisId="ord" dataKey="Orders"  name="Orders"  fill={C.blue}   radius={[4, 4, 0, 0]} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                /* Area chart for trend */
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={revenueTrendChart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="aRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.green} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={C.green} stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="aOrdGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.blue} stopOpacity={0.2} />
                        <stop offset="95%" stopColor={C.blue} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="rev" orientation="left"  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} width={52} />
                    <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip content={<RevTooltip />} cursor={CHART_TOOLTIP_CURSOR} />
                    <Area yAxisId="rev" type="monotone" dataKey="Revenue" name="Revenue" stroke={C.green} strokeWidth={2.5} fill="url(#aRevGrad)" dot={false} activeDot={{ r: 4 }} />
                    <Area yAxisId="ord" type="monotone" dataKey="Orders"  name="Orders"  stroke={C.blue}  strokeWidth={2}   fill="url(#aOrdGrad)" dot={false} activeDot={{ r: 4 }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Order Status Donut + Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut */}
            <Card className="bg-pos-surface border-pos-secondary">
              <CardHeader className="pb-0">
                <CardTitle className="text-pos-text text-base">Order Status Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {statusDonut.length === 0 ? (
                  <EmptyChart label="No order data for this period" />
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <ResponsiveContainer width={180} height={180}>
                        <PieChart>
                          <Pie data={statusDonut} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value" strokeWidth={0}>
                            {statusDonut.map((e) => <Cell key={e.name} fill={e.fill} />)}
                          </Pie>
                          <Tooltip content={<PieTooltip />} cursor={false} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-black text-pos-text">{totalStatusOrders}</span>
                        <span className="text-xs text-pos-text-muted">Orders</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2 min-w-0">
                      {statusDonut.map((d) => (
                        <div key={d.name} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                            <span className="text-sm text-pos-text-muted truncate">{d.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-bold text-pos-text">{d.value}</span>
                            <span className="text-xs text-pos-text-muted w-8 text-right">
                              {totalStatusOrders > 0 ? `${Math.round((d.value / totalStatusOrders) * 100)}%` : ""}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status grid cards */}
            <Card className="bg-pos-surface border-pos-secondary">
              <CardHeader className="pb-0">
                <CardTitle className="text-pos-text text-base">Status Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-3">
                  {currStats ? [
                    { label: "Pending",   value: currStats.pending_orders,   color: "text-amber-500",  bg: "bg-amber-500/10" },
                    { label: "Confirmed", value: currStats.confirmed_orders, color: "text-indigo-500", bg: "bg-indigo-500/10" },
                    { label: "Preparing", value: currStats.preparing_orders, color: "text-blue-500",   bg: "bg-blue-500/10" },
                    { label: "Ready",     value: currStats.ready_orders,     color: "text-violet-500", bg: "bg-violet-500/10" },
                    { label: "Delivered", value: currStats.delivered_orders, color: "text-green-500",  bg: "bg-green-500/10" },
                    { label: "Cancelled", value: currStats.cancelled_orders, color: "text-red-500",    bg: "bg-red-500/10" },
                  ].map((s) => (
                    <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
                      <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                      <div className="text-xs text-pos-text-muted mt-0.5">{s.label}</div>
                    </div>
                  )) : (
                    <p className="col-span-2 text-center text-pos-text-muted py-4 text-sm">No data</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ════════════════════════════════ PRODUCTS ══════════════════ */}
        <TabsContent value="products" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Top products horizontal bar */}
            <Card className="bg-pos-surface border-pos-secondary">
              <CardHeader className="pb-0">
                <CardTitle className="text-pos-text text-base">Top Performing Products</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {topProductsChart.length === 0 ? (
                  <EmptyChart label="No product data. Run item reports first." />
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={topProductsChart} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip content={<RevTooltip />} cursor={CHART_TOOLTIP_CURSOR} />
                      <Bar dataKey="Revenue" radius={[0, 5, 5, 0]} maxBarSize={20}>
                        {topProductsChart.map((_, i) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Category pie */}
            <Card className="bg-pos-surface border-pos-secondary">
              <CardHeader className="pb-0">
                <CardTitle className="text-pos-text text-base">Revenue by Category</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {categoryPie.length === 0 ? (
                  <EmptyChart label="No category data. Run category reports first." />
                ) : (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={categoryPie} cx="50%" cy="50%" outerRadius={80} paddingAngle={2} dataKey="value" strokeWidth={0}>
                          {categoryPie.map((e) => <Cell key={e.name} fill={e.fill} />)}
                        </Pie>
                        <Tooltip content={<PieRevTooltip />} cursor={false} />
                        <Legend
                          formatter={(value) => <span style={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}>{value}</span>}
                          iconSize={8}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {categoryPie.map((cat) => (
                        <div key={cat.name}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-pos-text font-medium">{cat.name}</span>
                            <div className="flex gap-3">
                              <span className="text-pos-text-muted">{cat.pct}%</span>
                              <span className="text-pos-text font-bold">₹{cat.value.toLocaleString("en-IN")}</span>
                            </div>
                          </div>
                          <div className="w-full bg-pos-secondary rounded-full h-1.5">
                            <div className="h-1.5 rounded-full" style={{ width: `${cat.pct}%`, backgroundColor: cat.fill }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Products detail list */}
          {topProductsChart.length > 0 && (
            <Card className="bg-pos-surface border-pos-secondary">
              <CardHeader className="pb-0">
                <CardTitle className="text-pos-text text-base">Product Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {topProductsChart.map((product, i) => (
                    <div key={product.name} className="flex items-center gap-4 p-3 rounded-xl bg-pos-primary/40">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-pos-text text-sm truncate">{product.name}</div>
                        <div className="w-full bg-pos-secondary rounded-full h-1.5 mt-1.5">
                          <div className="h-1.5 rounded-full transition-all" style={{ width: `${topProductsChart[0].Revenue > 0 ? Math.round((product.Revenue / topProductsChart[0].Revenue) * 100) : 0}%`, backgroundColor: PALETTE[i % PALETTE.length] }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-pos-text text-sm">₹{product.Revenue.toLocaleString("en-IN")}</div>
                        <div className="text-xs text-pos-text-muted">{product.Sales} sold</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ════════════════════════════════ PEAK HOURS ════════════════ */}
        <TabsContent value="time-analysis" className="space-y-6 mt-6">

          {/* Peak hours bar chart */}
          <Card className="bg-pos-surface border-pos-secondary">
            <CardHeader className="pb-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-pos-text text-base">Orders & Revenue by Hour</CardTitle>
                <div className="flex items-center gap-4 text-xs text-pos-text-muted">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#16a34a] inline-block rounded" />Revenue (₹)</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#2563eb] inline-block rounded" />Orders</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {peakHoursChart.length === 0 ? (
                <EmptyChart label="No order data for this period" />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={peakHoursChart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="peakRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.green} stopOpacity={0.9} />
                        <stop offset="95%" stopColor={C.green} stopOpacity={0.6} />
                      </linearGradient>
                      <linearGradient id="peakOrdGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.blue} stopOpacity={0.9} />
                        <stop offset="95%" stopColor={C.blue} stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="rev" orientation="left"  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} width={52} />
                    <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip content={<RevTooltip />} cursor={CHART_TOOLTIP_CURSOR} />
                    <Bar yAxisId="rev" dataKey="Revenue" name="Revenue" fill="url(#peakRevGrad)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar yAxisId="ord" dataKey="Orders"  name="Orders"  fill="url(#peakOrdGrad)" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Table Utilization + Order Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-pos-surface border-pos-secondary">
              <CardHeader className="pb-0"><CardTitle className="text-pos-text text-base">Table Utilization</CardTitle></CardHeader>
              <CardContent className="pt-4 space-y-3">
                {[
                  { table: "Table 1", utilization: 85, hours: 6.8 },
                  { table: "Table 2", utilization: 92, hours: 7.4 },
                  { table: "Table 3", utilization: 78, hours: 6.2 },
                  { table: "Table 4", utilization: 95, hours: 7.6 },
                  { table: "Table 5", utilization: 72, hours: 5.8 },
                ].map((t, i) => (
                  <div key={t.table} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-pos-text">{t.table}</span>
                        <span className="text-pos-text-muted">{t.hours}h · {t.utilization}%</span>
                      </div>
                      <div className="w-full bg-pos-secondary rounded-full h-2">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${t.utilization}%`, backgroundColor: PALETTE[i % PALETTE.length] }} />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-pos-surface border-pos-secondary">
              <CardHeader className="pb-0"><CardTitle className="text-pos-text text-base">Order Type Distribution</CardTitle></CardHeader>
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Dine-in",  value: 65, fill: C.green  },
                        { name: "Takeaway", value: 25, fill: C.blue   },
                        { name: "Delivery", value: 10, fill: C.purple },
                      ]}
                      cx="50%" cy="50%"
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                      label={({ name, value }) => `${name} ${value}%`}
                      labelLine={false}
                    >
                      {[C.green, C.blue, C.purple].map((fill, i) => <Cell key={i} fill={fill} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => `${v}%`} cursor={CHART_TOOLTIP_CURSOR} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ════════════════════════════════ PAYMENTS ══════════════════ */}
        <TabsContent value="payments" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Payment Donut */}
            <Card className="bg-pos-surface border-pos-secondary">
              <CardHeader className="pb-0"><CardTitle className="text-pos-text text-base">Payment Method Breakdown</CardTitle></CardHeader>
              <CardContent className="pt-4">
                {paymentPie.length === 0 ? (
                  <EmptyChart label="No payment data in this period" />
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                      <ResponsiveContainer width={180} height={180}>
                        <PieChart>
                          <Pie data={paymentPie} cx="50%" cy="50%" innerRadius={48} outerRadius={76} paddingAngle={3} dataKey="value" strokeWidth={0}>
                            {paymentPie.map((e) => <Cell key={e.name} fill={e.fill} />)}
                          </Pie>
                          <Tooltip content={<PieRevTooltip />} cursor={false} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-lg font-black text-pos-text">
                          ₹{paymentPie.reduce((s, d) => s + d.value, 0).toLocaleString("en-IN", { notation: "compact" })}
                        </span>
                        <span className="text-xs text-pos-text-muted">Total</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-3 min-w-0">
                      {paymentPie.map((d) => (
                        <div key={d.name}>
                          <div className="flex justify-between text-xs mb-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                              <span className="font-medium text-pos-text">{d.name}</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-pos-text-muted">{d.percentage}%</span>
                              <span className="font-bold text-pos-text">₹{d.value.toLocaleString("en-IN")}</span>
                            </div>
                          </div>
                          <div className="w-full bg-pos-secondary rounded-full h-1.5">
                            <div className="h-1.5 rounded-full" style={{ width: `${d.percentage}%`, backgroundColor: d.fill }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment bar chart */}
            <Card className="bg-pos-surface border-pos-secondary">
              <CardHeader className="pb-0"><CardTitle className="text-pos-text text-base">Payment Amount by Method</CardTitle></CardHeader>
              <CardContent className="pt-4">
                {paymentPie.length === 0 ? (
                  <EmptyChart label="No payment data in this period" />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={paymentPie} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} width={48} />
                      <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Amount"]} cursor={CHART_TOOLTIP_CURSOR} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="value" name="Amount" radius={[5, 5, 0, 0]} maxBarSize={56}>
                        {paymentPie.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transaction Summary */}
          <Card className="bg-pos-surface border-pos-secondary">
            <CardHeader className="pb-0"><CardTitle className="text-pos-text text-base">Transaction Summary</CardTitle></CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Transactions", value: currStats?.total_orders?.toLocaleString() ?? "—",    icon: CreditCard,    color: "text-pos-accent",   bg: "bg-pos-accent/10" },
                  { label: "Delivered Orders",   value: currStats?.delivered_orders?.toLocaleString() ?? "—", icon: TrendingUp,    color: "text-green-500",    bg: "bg-green-500/10" },
                  { label: "Cancelled Orders",   value: currStats?.cancelled_orders?.toLocaleString() ?? "—", icon: TrendingDown,  color: "text-red-500",      bg: "bg-red-500/10" },
                  { label: "Pending Orders",     value: currStats?.pending_orders?.toLocaleString() ?? "—",   icon: Activity,      color: "text-amber-500",    bg: "bg-amber-500/10" },
                ].map((s) => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
                    <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
                    <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-pos-text-muted mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════ STAFF ═════════════════════ */}
        <TabsContent value="staff" className="space-y-6 mt-6">

          {staffChart.length > 0 && (
            <Card className="bg-pos-surface border-pos-secondary">
              <CardHeader className="pb-0"><CardTitle className="text-pos-text text-base">Staff Revenue Performance</CardTitle></CardHeader>
              <CardContent className="pt-4">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={staffChart} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip content={<RevTooltip />} cursor={CHART_TOOLTIP_CURSOR} />
                    <Bar dataKey="Revenue" radius={[0, 5, 5, 0]} maxBarSize={20}>
                      {staffChart.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card className="bg-pos-surface border-pos-secondary">
            <CardHeader className="pb-0"><CardTitle className="text-pos-text text-base">Staff Performance Rankings</CardTitle></CardHeader>
            <CardContent className="pt-4">
              {staffChart.length === 0 ? (
                <EmptyChart label="No staff data available" />
              ) : (
                <div className="space-y-3">
                  {staffChart.map((staff, i) => (
                    <div key={staff.name} className="flex items-center gap-4 p-4 rounded-xl bg-pos-primary/40 border border-pos-secondary">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-pos-text text-sm">{staff.name}</div>
                        <div className="text-xs text-pos-text-muted">
                          {staff.Orders} orders · ★ {staff.Rating}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-pos-text text-sm">₹{staff.Revenue.toLocaleString("en-IN")}</div>
                        <div className="text-xs text-pos-text-muted">Avg: ₹{staff.Revenue > 0 && staff.Orders > 0 ? Math.round(staff.Revenue / staff.Orders) : 0}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
