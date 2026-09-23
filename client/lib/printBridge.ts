/**
 * Local print-bridge client
 *
 * The print-bridge (e.g. a printer-service running on the till machine) is a
 * separate local service, not part of this app's API. The browser talks to
 * it directly with a plain fetch - never through apiClient's apiPost/apiGet,
 * since those attach this app's own Authorization bearer token and treat a
 * 401 as "session expired" (which would misfire against the bridge's own
 * x-print-token auth and could even redirect the user to login).
 */
import {
  getActivePrinter,
  printReceipt,
  type ReceiptPrinterActiveConfig,
} from "./apiServices";

/** Minimum shape needed to talk to a local print-bridge */
export interface BridgeTarget {
  printer_url: string;
  printer_token: string;
  printer_name: string;
  printer_type: string;
}

function joinBridgeUrl(base: string, path: string): string {
  const trimmed = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${trimmed}/${path}`;
}

/** POST a print job straight to the local bridge. Throws on any non-2xx or network failure. */
export async function printToBridge(printer: BridgeTarget, data: string): Promise<void> {
  const response = await fetch(joinBridgeUrl(printer.printer_url, "print"), {
    method: "POST",
    headers: {
      "x-print-token": printer.printer_token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      printerName: printer.printer_name,
      printerType: printer.printer_type,
      data,
    }),
  });

  if (!response.ok) {
    throw new Error(`Print bridge returned ${response.status}`);
  }
}

/** Ask the local bridge which OS printers it can see (GET /printers). */
export async function fetchBridgePrinters(
  printerUrl: string,
  printerToken: string,
): Promise<string[]> {
  const response = await fetch(joinBridgeUrl(printerUrl, "printers"), {
    method: "GET",
    headers: { "x-print-token": printerToken },
  });

  if (!response.ok) {
    throw new Error(`Print bridge returned ${response.status}`);
  }

  const body = await response.json();
  const list = body?.printers ?? [];
  return list.map((p: any) => (typeof p === "string" ? p : p?.name ?? p?.Name ?? String(p)));
}

/** Build a minimal ESC/POS test ticket, base64-encoded for the bridge's JSON "data" field. */
function buildTestEscPos(): string {
  const ESC = "\x1b";
  const GS = "\x1d";
  const INIT = `${ESC}@`;
  const ALIGN_CENTER = `${ESC}a\x01`;
  const CUT = `${GS}V\x42\x00`;

  const raw =
    INIT +
    ALIGN_CENTER +
    "TEST PRINT\n" +
    "POS Receipt Printer\n" +
    new Date().toLocaleString() +
    "\n\n\n" +
    CUT;

  return btoa(raw);
}

/** Send a sample ticket to a printer config, without touching any order data. */
export async function sendTestPrint(printer: BridgeTarget): Promise<void> {
  await printToBridge(printer, buildTestEscPos());
}

/** Open an HTML receipt in a new window and trigger the browser print dialog. */
function printHtmlInBrowser(html: string): void {
  const printWindow = window.open("", "_blank", "width=400,height=600");
  if (!printWindow) {
    throw new Error("Unable to open print window (popup blocked?)");
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => printWindow.print();
  // Some browsers never fire onload for document.write() content - print eagerly too.
  setTimeout(() => printWindow.print(), 300);
}

/**
 * Print the billing receipt for an order.
 *
 * 1. Look up the restaurant's active "bill" printer.
 * 2. If one is configured, fetch the receipt in that printer's configured
 *    data_format and POST it directly to the local bridge.
 * 3. If no printer is configured, or the bridge is unreachable, fall back to
 *    opening the HTML receipt and using the browser's print dialog.
 */
export async function printReceiptForOrder(
  orderId: string,
  restaurantId: string,
): Promise<{ method: "bridge" | "browser" }> {
  let printer: ReceiptPrinterActiveConfig | null = null;
  try {
    const res: any = await getActivePrinter(restaurantId, "bill");
    printer = res?.data ?? null;
  } catch {
    printer = null;
  }

  if (printer?.printer_url && printer?.printer_token) {
    try {
      const format = printer.data_format || "text";
      const printRes: any = await printReceipt(orderId, format as any);
      const content = printRes?.data?.content ?? printRes?.content;
      if (!content) throw new Error("No receipt content returned");
      await printToBridge(printer, content);
      return { method: "bridge" };
    } catch {
      // Bridge unreachable or rejected the job - fall through to browser print.
    }
  }

  const printRes: any = await printReceipt(orderId, "html");
  const html = printRes?.data?.content ?? printRes?.content;
  if (!html) throw new Error("No receipt content returned");
  printHtmlInBrowser(html);
  return { method: "browser" };
}
