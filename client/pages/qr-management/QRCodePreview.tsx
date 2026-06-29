import { useEffect, useMemo, useState } from "react";
import { Copy, Download, Eye, Printer, QrCode, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/contexts/ToastContext";
import type { QRTable } from "@/shared/api";
import {
  buildQrMenuUrl,
  buildRemoteQrImageUrl,
  composeMonkeyQr,
  composeQrSticker,
  isProbablyImageUrl,
  safeFilePart,
  triggerDownloadDataUrl,
} from "./qrUtils";

export function QRCodePreview({
  table,
  restaurantName,
  restaurantLogoUrl,
}: {
  table: QRTable;
  restaurantName?: string;
  restaurantLogoUrl?: string;
}) {
  const { addToast } = useToast();
  const [monkeyQrDataUrl, setMonkeyQrDataUrl] = useState<string | null>(null);
  const [monkeyQrLoading, setMonkeyQrLoading] = useState(false);
  const qrValue = useMemo(() => {
    const explicitUrl = String(table.qrCodeUrl || "").trim();
    if (explicitUrl) return explicitUrl;
    if (typeof window === "undefined") return "";
    const token = String(table.qrToken || "").trim();
    const tableId = String((table as any).id || "").trim();
    return token ? buildQrMenuUrl(window.location.origin, token, tableId) : "";
  }, [table.qrCodeUrl, table.qrToken, (table as any).id]);
  const qrImageSrc = useMemo(() => {
    const candidate = String((table as any).qr_code ?? "").trim();
    if (isProbablyImageUrl(candidate)) return candidate;
    return qrValue ? buildRemoteQrImageUrl(qrValue) : "";
  }, [table, qrValue]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!qrImageSrc) {
        setMonkeyQrDataUrl(null);
        return;
      }
      setMonkeyQrLoading(true);
      try {
        const dataUrl = await composeMonkeyQr({
          qrSrc: qrImageSrc,
          logoSrc: restaurantLogoUrl,
          size: 640,
        });
        if (cancelled) return;
        setMonkeyQrDataUrl(dataUrl);
      } catch {
        if (cancelled) return;
        setMonkeyQrDataUrl(null);
      } finally {
        if (cancelled) return;
        setMonkeyQrLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [qrImageSrc, restaurantLogoUrl]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast({
      type: "success",
      title: "Copied!",
      description: "QR code URL copied to clipboard",
    });
  };

  const downloadQRCode = async () => {
    if (!qrImageSrc) {
      addToast({
        type: "error",
        title: "QR Not Available",
        description: "Unable to generate a QR image for this table.",
      });
      return;
    }

    try {
      const dataUrl = await composeQrSticker({
        qrSrc: qrImageSrc,
        logoSrc: restaurantLogoUrl,
        restaurantName,
        tableLabel: String(table.tableNumber || "").trim(),
        providerName: "V11TECH",
      });
      const filename = `${safeFilePart(String(restaurantName || "restaurant"))}_${safeFilePart(
        String(table.tableNumber || table.tableName || "table"),
      )}_sticker.png`;
      triggerDownloadDataUrl(dataUrl, filename);

      addToast({
        type: "success",
        title: "QR Code Downloaded",
        description: `QR code for ${table.tableName} downloaded successfully`,
      });
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Download Failed",
        description:
          error?.message ||
          "Could not export QR image. This can happen due to image CORS restrictions.",
      });
    }
  };

  const printQRCode = async () => {
    if (!qrImageSrc) {
      addToast({
        type: "error",
        title: "QR Not Available",
        description: "Unable to generate a QR image for this table.",
      });
      return;
    }

    try {
      const dataUrl = await composeQrSticker({
        qrSrc: qrImageSrc,
        logoSrc: restaurantLogoUrl,
        restaurantName,
        tableLabel: String(table.tableNumber || "").trim(),
        providerName: "V11TECH",
      });
      const printWindow = window.open("", "_blank", "noopener,noreferrer,width=720,height=720");
      if (!printWindow) {
        addToast({
          type: "error",
          title: "Popup Blocked",
          description: "Please allow popups to print the QR sticker.",
        });
        return;
      }

      const title = `${table.tableName} QR`;
      printWindow.document.open();
      printWindow.document.write(`
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      @page { margin: 12mm; }
      body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
      .wrap { display: grid; place-items: center; min-height: 100vh; }
      img { width: 85mm; height: auto; image-rendering: auto; }
      .meta { margin-top: 8mm; text-align: center; font-size: 12px; color: #111; }
      .meta .name { font-weight: 600; font-size: 14px; margin-bottom: 2mm; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div>
        <img src="${dataUrl}" alt="QR" />
        <div class="meta">
          <div class="name">${restaurantName ? restaurantName : ""}</div>
          <div>${table.tableName}</div>
        </div>
      </div>
    </div>
    <script>
      window.onload = () => {
        window.focus();
        window.print();
      };
    </script>
  </body>
</html>
      `);
      printWindow.document.close();

      addToast({
        type: "info",
        title: "Print QR Sticker",
        description: `Opening print dialog for ${table.tableName}`,
      });
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Print Failed",
        description:
          error?.message ||
          "Could not export QR image for printing. This can happen due to image CORS restrictions.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-56 bg-white border border-border rounded-2xl shadow-sm flex items-center justify-center p-4">
          {qrImageSrc ? (
            <div className="relative">
              <img
                src={monkeyQrDataUrl || qrImageSrc}
                alt="QR code"
                className="w-48 h-48 rounded-lg"
                crossOrigin="anonymous"
              />
              {monkeyQrLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-center">
              <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">QR Code Preview</p>
              <p className="text-xs text-muted-foreground">{table.tableNumber}</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            {table.tableName}
          </h3>
          <Badge className="bg-blue-500 text-white">{table.location}</Badge>
          <Badge className="bg-green-500 text-white">
            <Users className="h-3 w-3 mr-1" />
            {table.capacity} seats
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="text-foreground text-sm font-medium">
            QR Code URL:
          </Label>
          <div className="flex items-center space-x-2">
            <Input
              value={table.qrCodeUrl}
              readOnly
              className="bg-muted border-border text-foreground text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(table.qrCodeUrl)}
              className="border-border"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground text-sm font-medium">
            Security Token:
          </Label>
          <div className="flex items-center space-x-2">
            <Input
              value={table.qrToken}
              readOnly
              className="bg-muted border-border text-foreground text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(table.qrToken)}
              className="border-border"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Button
          onClick={downloadQRCode}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Download className="mr-2 h-4 w-4" />
          Download QR Code
        </Button>
        <Button
          variant="outline"
          onClick={() => window.open(qrValue, "_blank")}
          className="border-border text-foreground"
        >
          <Eye className="mr-2 h-4 w-4" />
          Test Menu
        </Button>
        <Button
          variant="outline"
          onClick={printQRCode}
          className="border-border text-foreground"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print QR Sticker
        </Button>
      </div>
    </div>
  );
}
