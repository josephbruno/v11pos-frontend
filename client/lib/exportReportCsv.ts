import type { ReportPdfPayload } from "@/lib/exportReportPdf";
import { formatISTNow } from "@/lib/istDate";

function escapeCsv(value: string | number) {
  const text = String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function section(title: string, rows: (string | number)[][]) {
  const lines = [`\n${title}`];
  for (const row of rows) {
    lines.push(row.map(escapeCsv).join(","));
  }
  return lines.join("\n");
}

export function downloadReportCsv(payload: ReportPdfPayload) {
  const generatedAt = formatISTNow();
  const parts: string[] = [
    section("Report", [
      ["Title", payload.title ?? "Reports & Analytics"],
      ["Restaurant", payload.restaurantName ?? ""],
      ["Period Start", payload.period.start],
      ["Period End", payload.period.end],
      ["Generated", `${generatedAt} (IST)`],
    ]),
    section("Summary", [
      ["Metric", "Value"],
      ["Total Revenue", payload.stats.totalRevenue],
      ["Total Orders", payload.stats.totalOrders],
      ["Average Order Value", payload.stats.avgOrderValue],
      ["Completed Orders", payload.stats.completedOrders],
      ["Cancelled Orders", payload.stats.cancelledOrders],
    ]),
  ];

  if (payload.dailyTrend.length > 0) {
    parts.push(
      section("Daily Trend", [
        ["Date", "Revenue", "Orders"],
        ...payload.dailyTrend.map((row) => [row.label, row.revenue, row.orders]),
      ]),
    );
  }

  if (payload.topProducts.length > 0) {
    parts.push(
      section("Top Products", [
        ["Product", "Qty Sold", "Revenue"],
        ...payload.topProducts.map((row) => [row.name, row.sold, row.revenue]),
      ]),
    );
  }

  const breakdownRows: (string | number)[][] = [["Category", "Name", "Count"]];
  for (const row of payload.orderTypes) {
    breakdownRows.push(["Order Type", row.name, row.value]);
  }
  for (const row of payload.paymentMethods) {
    breakdownRows.push(["Payment Method", row.name, row.value]);
  }
  if (breakdownRows.length > 1) {
    parts.push(section("Breakdown", breakdownRows));
  }

  if (payload.statusBreakdown && payload.statusBreakdown.length > 0) {
    parts.push(
      section("Order Status", [
        ["Status", "Orders"],
        ...payload.statusBreakdown.map((row) => [row.name, row.value]),
      ]),
    );
  }

  if (payload.peakHours && payload.peakHours.length > 0) {
    parts.push(
      section("Peak Hours", [
        ["Hour", "Orders", "Revenue"],
        ...payload.peakHours.map((row) => [row.hour, row.orders, row.revenue]),
      ]),
    );
  }

  if (payload.categories && payload.categories.length > 0) {
    parts.push(
      section("Categories", [
        ["Category", "Revenue", "Share %"],
        ...payload.categories.map((row) => [row.name, row.revenue, row.percentage]),
      ]),
    );
  }

  const blob = new Blob([parts.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `analytics-${payload.period.start}-to-${payload.period.end}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
