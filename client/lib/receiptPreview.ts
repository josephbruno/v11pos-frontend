/**
 * Client-side mirror of the ESC/POS billing receipt layout
 * (app/modules/order/receipt_printer.py's generate_receipt_escpos).
 *
 * Used only to render an on-screen sample so alignment can be checked
 * before printing - keep LINE_WIDTH/AMOUNT_WIDTH/LABEL_WIDTH in sync with
 * the backend if that layout ever changes.
 */

// 42 characters is the standard column count for 78-80mm thermal paper at
// default Font A - matches the backend's LINE_WIDTH exactly.
export const RECEIPT_LINE_WIDTH = 42;
const AMOUNT_WIDTH = 14; // fits "Rs. 999999.99"
const LABEL_WIDTH = RECEIPT_LINE_WIDTH - AMOUNT_WIDTH; // 28
const ITEM_INDENT = "  ";

function padRight(text: string, width: number): string {
  return text.length >= width ? text.slice(0, width) : text + " ".repeat(width - text.length);
}

function padLeft(text: string, width: number): string {
  return text.length >= width ? text.slice(0, width) : " ".repeat(width - text.length) + text;
}

function center(text: string, width: number): string {
  if (text.length >= width) return text.slice(0, width);
  const total = width - text.length;
  const left = Math.floor(total / 2);
  return " ".repeat(left) + text + " ".repeat(total - left);
}

function inr(amount: number): string {
  return `Rs. ${amount.toFixed(2)}`;
}

function kv(label: string, amount: number, negative = false): string {
  const value = (negative ? "-" : "") + inr(amount);
  return padRight(label, LABEL_WIDTH) + padLeft(value, AMOUNT_WIDTH);
}

export interface SampleReceiptInfo {
  name: string;
  address?: string;
  phone?: string;
  gstin?: string;
}

/** Build a sample receipt string using the real restaurant header + dummy items, for on-screen preview only. */
export function buildSampleReceipt(info: SampleReceiptInfo): string {
  const lines: string[] = [];

  lines.push(center((info.name || "Your Restaurant").toUpperCase(), RECEIPT_LINE_WIDTH));
  if (info.address) lines.push(center(info.address, RECEIPT_LINE_WIDTH));
  if (info.phone) lines.push(center(`Ph: ${info.phone}`, RECEIPT_LINE_WIDTH));
  if (info.gstin) lines.push(center(`GSTIN: ${info.gstin}`, RECEIPT_LINE_WIDTH));
  lines.push("=".repeat(RECEIPT_LINE_WIDTH));

  lines.push("Order #: SAMPLE-0001");
  lines.push(
    `Date: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`,
  );
  lines.push("-".repeat(RECEIPT_LINE_WIDTH));

  const items = [
    { qty: 1, name: "Sample Item A", amount: 100 },
    { qty: 2, name: "Sample Item B", amount: 150 },
  ];
  const nameWidth = LABEL_WIDTH - ITEM_INDENT.length;
  for (const item of items) {
    // Truncate the item name only, so the " xN" quantity suffix is never cut off.
    const qtySuffix = ` x${item.qty}`;
    const name = item.name.slice(0, nameWidth - qtySuffix.length) + qtySuffix;
    lines.push(ITEM_INDENT + padRight(name, nameWidth) + padLeft(inr(item.amount), AMOUNT_WIDTH));
  }
  lines.push("-".repeat(RECEIPT_LINE_WIDTH));

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const tax = Math.round(subtotal * 0.05 * 100) / 100; // sample 5% GST
  lines.push(kv("Subtotal", subtotal));
  lines.push(kv("Tax", tax));
  lines.push(kv("TOTAL", subtotal + tax));

  lines.push("");
  lines.push(center("Thank you for visiting!", RECEIPT_LINE_WIDTH));

  return lines.join("\n");
}
