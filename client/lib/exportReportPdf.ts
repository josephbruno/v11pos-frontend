import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatISTNow } from "@/lib/istDate";

export type ReportPdfStats = {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  completedOrders: number;
  cancelledOrders: number;
};

export type ReportPdfDailyRow = {
  label: string;
  revenue: number;
  orders: number;
};

export type ReportPdfNamedValue = {
  name: string;
  value: number;
};

export type ReportPdfProductRow = {
  name: string;
  sold: number;
  revenue: number;
};

export type ReportPdfPayload = {
  title?: string;
  restaurantName?: string;
  period: { start: string; end: string };
  stats: ReportPdfStats;
  dailyTrend: ReportPdfDailyRow[];
  topProducts: ReportPdfProductRow[];
  orderTypes: ReportPdfNamedValue[];
  paymentMethods: ReportPdfNamedValue[];
  statusBreakdown?: ReportPdfNamedValue[];
  peakHours?: { hour: string; orders: number; revenue: number }[];
  categories?: { name: string; revenue: number; percentage: number }[];
};

function formatInr(amount: number) {
  return `Rs. ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function addSectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 30);
  doc.text(title, 14, y);
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y + 2, 196, y + 2);
  return y + 8;
}

export function downloadReportPdf(payload: ReportPdfPayload) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const generatedAt = formatISTNow();
  const { period, stats, dailyTrend, topProducts, orderTypes, paymentMethods } = payload;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 20);
  doc.text(payload.title ?? "Reports & Analytics", 14, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  if (payload.restaurantName) {
    doc.text(payload.restaurantName, 14, 28);
  }
  doc.text(`Period: ${period.start} to ${period.end}`, 14, payload.restaurantName ? 34 : 28);
  doc.text(`Generated: ${generatedAt} (IST)`, 14, payload.restaurantName ? 40 : 34);

  let y = payload.restaurantName ? 50 : 44;
  y = addSectionTitle(doc, "Summary", y);

  autoTable(doc, {
    startY: y,
    head: [["Metric", "Value"]],
    body: [
      ["Total Revenue", formatInr(stats.totalRevenue)],
      ["Total Orders", stats.totalOrders.toLocaleString("en-IN")],
      ["Average Order Value", formatInr(stats.avgOrderValue)],
      ["Completed Orders", stats.completedOrders.toLocaleString("en-IN")],
      ["Cancelled Orders", stats.cancelledOrders.toLocaleString("en-IN")],
    ],
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 3 },
    margin: { left: 14, right: 14 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  if (dailyTrend.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    y = addSectionTitle(doc, "Daily Trend", y);
    autoTable(doc, {
      startY: y,
      head: [["Date", "Revenue", "Orders"]],
      body: dailyTrend.map((row) => [
        row.label,
        formatInr(row.revenue),
        row.orders.toLocaleString("en-IN"),
      ]),
      theme: "striped",
      headStyles: { fillColor: [22, 163, 74], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 2.5 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  if (topProducts.length > 0) {
    if (y > 230) {
      doc.addPage();
      y = 20;
    }
    y = addSectionTitle(doc, "Top Products", y);
    autoTable(doc, {
      startY: y,
      head: [["Product", "Qty Sold", "Revenue"]],
      body: topProducts.map((row) => [
        row.name,
        row.sold.toLocaleString("en-IN"),
        formatInr(row.revenue),
      ]),
      theme: "striped",
      headStyles: { fillColor: [124, 58, 237], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 2.5 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  const breakdownRows: string[][] = [];
  for (const row of orderTypes) {
    breakdownRows.push(["Order Type", row.name, row.value.toLocaleString("en-IN")]);
  }
  for (const row of paymentMethods) {
    breakdownRows.push(["Payment Method", row.name, row.value.toLocaleString("en-IN")]);
  }

  if (breakdownRows.length > 0) {
    if (y > 230) {
      doc.addPage();
      y = 20;
    }
    y = addSectionTitle(doc, "Breakdown", y);
    autoTable(doc, {
      startY: y,
      head: [["Category", "Name", "Count"]],
      body: breakdownRows,
      theme: "striped",
      headStyles: { fillColor: [217, 119, 6], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 2.5 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  if (payload.statusBreakdown && payload.statusBreakdown.length > 0) {
    if (y > 230) {
      doc.addPage();
      y = 20;
    }
    y = addSectionTitle(doc, "Order Status", y);
    autoTable(doc, {
      startY: y,
      head: [["Status", "Orders"]],
      body: payload.statusBreakdown.map((row) => [
        row.name,
        row.value.toLocaleString("en-IN"),
      ]),
      theme: "striped",
      headStyles: { fillColor: [220, 38, 38], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 2.5 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  if (payload.peakHours && payload.peakHours.length > 0) {
    if (y > 230) {
      doc.addPage();
      y = 20;
    }
    y = addSectionTitle(doc, "Peak Hours", y);
    autoTable(doc, {
      startY: y,
      head: [["Hour", "Orders", "Revenue"]],
      body: payload.peakHours.map((row) => [
        row.hour,
        row.orders.toLocaleString("en-IN"),
        formatInr(row.revenue),
      ]),
      theme: "striped",
      headStyles: { fillColor: [8, 145, 178], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 2.5 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  if (payload.categories && payload.categories.length > 0) {
    if (y > 230) {
      doc.addPage();
      y = 20;
    }
    y = addSectionTitle(doc, "Categories", y);
    autoTable(doc, {
      startY: y,
      head: [["Category", "Revenue", "Share"]],
      body: payload.categories.map((row) => [
        row.name,
        formatInr(row.revenue),
        `${row.percentage}%`,
      ]),
      theme: "striped",
      headStyles: { fillColor: [124, 58, 237], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 2.5 },
      margin: { left: 14, right: 14 },
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Page ${i} of ${pageCount}`, 196, 287, { align: "right" });
  }

  doc.save(`report-${period.start}-to-${period.end}.pdf`);
}
