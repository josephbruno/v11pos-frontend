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

function joinPrintUrl(base: string): string {
  return base.endsWith("/") ? `${base}print` : `${base}/print`;
}

/** POST a print job straight to the local bridge. Throws on any non-2xx or network failure. */
export async function printToBridge(
  printer: ReceiptPrinterActiveConfig,
  data: string,
): Promise<void> {
  const response = await fetch(joinPrintUrl(printer.printer_url), {
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
