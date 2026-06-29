import { formatISTDate, formatISTDateShort } from "@/lib/istDate";
import type { ReportPdfPayload } from "@/lib/exportReportPdf";
import type { OrderStatistics } from "@/shared/api";

type BuildAnalyticsExportInput = {
  restaurantName?: string;
  start: string;
  end: string;
  currStats: OrderStatistics | null;
  orders: any[];
  revenueTrend: { label: string; Revenue?: number; Orders?: number }[];
  topProducts: { name: string; Sales?: number; Revenue?: number }[];
  paymentPie: { name: string; value: number }[];
  statusDonut: { name: string; value: number }[];
  peakHours: { hour: string; Orders?: number; Revenue?: number }[];
  categories: { name: string; value: number; pct: number }[];
};

function countByField(orders: any[], getKey: (order: any) => string) {
  const counts: Record<string, number> = {};
  for (const order of orders) {
    const key = getKey(order);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }));
}

function topProductsFromOrders(orders: any[]) {
  const map: Record<string, { name: string; sold: number; revenue: number }> = {};
  for (const order of orders) {
    const items: any[] = order.items ?? order.order_items ?? [];
    for (const item of items) {
      const name = item.product_name ?? item.name ?? "Unknown";
      if (!map[name]) map[name] = { name, sold: 0, revenue: 0 };
      map[name].sold += Number(item.quantity ?? 1);
      map[name].revenue += Number(item.unit_price ?? 0) * Number(item.quantity ?? 1);
    }
  }
  return Object.values(map)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 10)
    .map((row) => ({
      name: row.name,
      sold: row.sold,
      revenue: Math.round(row.revenue),
    }));
}

function dailyTrendFromOrders(orders: any[]) {
  const map: Record<string, { label: string; revenue: number; orders: number }> = {};
  for (const order of orders) {
    if (!order.created_at) continue;
    const key = formatISTDate(new Date(order.created_at));
    const label = formatISTDateShort(key);
    if (!map[key]) map[key] = { label, revenue: 0, orders: 0 };
    map[key].revenue += Number(order.total_amount ?? 0);
    map[key].orders += 1;
  }
  return Object.keys(map)
    .sort()
    .map((key) => ({
      label: map[key].label,
      revenue: Math.round(map[key].revenue),
      orders: map[key].orders,
    }));
}

export function buildAnalyticsExportPayload(input: BuildAnalyticsExportInput): ReportPdfPayload {
  const {
    restaurantName,
    start,
    end,
    currStats,
    orders,
    revenueTrend,
    topProducts,
    paymentPie,
    statusDonut,
    peakHours,
    categories,
  } = input;

  const totalRevenueFromOrders = orders
    .filter((o) => !["cancelled", "refunded"].includes(String(o.status ?? "").toLowerCase()))
    .reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0);

  const stats = {
    totalRevenue: currStats
      ? Math.round(currStats.total_revenue / 100)
      : Math.round(totalRevenueFromOrders),
    totalOrders: currStats?.total_orders ?? orders.length,
    avgOrderValue: currStats
      ? Math.round(currStats.avg_order_value / 100)
      : orders.length > 0
        ? Math.round(totalRevenueFromOrders / orders.length)
        : 0,
    completedOrders: Number(
      currStats?.delivered_orders ?? currStats?.completed_orders ?? 0,
    ),
    cancelledOrders: Number(currStats?.cancelled_orders ?? 0),
  };

  const dailyTrend =
    revenueTrend.length > 3
      ? revenueTrend.map((row) => ({
          label: row.label,
          revenue: row.Revenue ?? 0,
          orders: row.Orders ?? 0,
        }))
      : dailyTrendFromOrders(orders);

  const productRows =
    topProducts.length > 0
      ? topProducts.map((row) => ({
          name: row.name,
          sold: row.Sales ?? 0,
          revenue: row.Revenue ?? 0,
        }))
      : topProductsFromOrders(orders);

  const paymentMethods =
    paymentPie.length > 0
      ? countByField(orders, (o) => {
          const method = (o.payment_method ?? "cash").toLowerCase();
          const labels: Record<string, string> = {
            card: "Card",
            cash: "Cash",
            upi: "UPI",
            digital_wallet: "Wallet",
          };
          return labels[method] ?? method.charAt(0).toUpperCase() + method.slice(1);
        })
      : countByField(orders, (o) => {
          const method = (o.payment_method ?? "cash").toLowerCase();
          return method.charAt(0).toUpperCase() + method.slice(1);
        });

  return {
    title: "Analytics & Reports",
    restaurantName,
    period: { start, end },
    stats,
    dailyTrend,
    topProducts: productRows,
    orderTypes: countByField(orders, (o) => {
      const type = o.order_type ?? "unknown";
      if (type === "dine_in") return "Dine-In";
      if (type === "takeaway") return "Take Away";
      return String(type).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }),
    paymentMethods,
    statusBreakdown: statusDonut.map((row) => ({ name: row.name, value: row.value })),
    peakHours: peakHours.map((row) => ({
      hour: row.hour,
      orders: row.Orders ?? 0,
      revenue: row.Revenue ?? 0,
    })),
    categories: categories.map((row) => ({
      name: row.name,
      revenue: row.value,
      percentage: row.pct,
    })),
  };
}
