import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Edit,
  QrCode,
  Download,
  Eye,
  Copy,
  Users,
  MapPin,
  Settings as SettingsIcon,
  Printer,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { createTable, getMyRestaurants, getTables, updateTable } from "@/lib/apiServices";
import type { QRTable, QRSession, QRSettings } from "@/shared/api";

function isProbablyImageUrl(value: unknown) {
  if (!value) return false;
  const text = String(value).trim();
  if (!text) return false;
  if (/^data:image\//i.test(text)) return true;
  if (/^https?:\/\//i.test(text)) return true;
  if (/^\//.test(text)) return true;
  if (/^blob:/i.test(text)) return true;
  return /\.(png|jpe?g|svg|webp)(\?.*)?$/i.test(text);
}

function buildRemoteQrImageUrl(text: string, size = 420) {
  const payload = encodeURIComponent(text);
  // Uses a public QR image generator as a fallback when backend doesn't provide a QR image.
  // Note: download/print may fail if the remote server blocks CORS.
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&ecc=H&data=${payload}`;
}

function safeFilePart(value: string) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "");
}

function triggerDownloadDataUrl(dataUrl: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function ensureTableIdInQrMenuUrl(url: string, tableId: string) {
  const trimmedUrl = String(url || "").trim();
  const trimmedTableId = String(tableId || "").trim();
  if (!trimmedUrl || !trimmedTableId) return trimmedUrl;
  if (/\/table\/[^/]+\/?$/i.test(trimmedUrl) || /\/table\/[^/]+\b/i.test(trimmedUrl)) {
    return trimmedUrl;
  }
  const withoutTrailingSlash = trimmedUrl.replace(/\/+$/, "");
  return `${withoutTrailingSlash}/table/${encodeURIComponent(trimmedTableId)}`;
}

function buildQrMenuUrl(baseUrl: string, token: string, tableId: string) {
  const trimmedBase = String(baseUrl || "").replace(/\/+$/, "");
  const trimmedToken = String(token || "").trim();
  const trimmedTableId = String(tableId || "").trim();
  if (!trimmedBase || !trimmedToken) return "";
  if (!trimmedTableId) return `${trimmedBase}/qr-menu/${encodeURIComponent(trimmedToken)}`;
  return `${trimmedBase}/qr-menu/${encodeURIComponent(trimmedToken)}/table/${encodeURIComponent(trimmedTableId)}`;
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

async function loadImageElement(src: string) {
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

async function loadImageForCanvas(src: string) {
  const shouldSendCredentials = (() => {
    if (typeof window === "undefined") return false;
    if (/^data:/i.test(src) || /^blob:/i.test(src)) return false;
    if (/^\//.test(src)) return true;
    try {
      const url = new URL(src, window.location.origin);
      return url.origin === window.location.origin;
    } catch {
      return false;
    }
  })();

  try {
    const response = await fetch(src, {
      credentials: shouldSendCredentials ? "include" : "omit",
    });
    if (!response.ok) throw new Error(`Failed to fetch image (${response.status})`);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    try {
      return await loadImageElement(objectUrl);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    // Fallback: allow rendering in preview even if fetch is blocked; canvas export may still fail due to CORS.
    return await loadImageElement(src);
  }
}

async function composeQrWithCenteredLogo(options: {
  qrSrc: string;
  logoSrc?: string;
  size?: number;
}) {
  const outputSize = Math.max(256, Math.floor(options.size ?? 1024));
  const qrImage = await loadImageForCanvas(options.qrSrc);
  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(qrImage, 0, 0, canvas.width, canvas.height);

  if (options.logoSrc) {
    const logoImage = await loadImageForCanvas(options.logoSrc);
    const logoSize = Math.floor(outputSize * 0.22);
    const padding = Math.floor(outputSize * 0.03);
    const boxSize = logoSize + padding * 2;
    const x = Math.floor((outputSize - boxSize) / 2);
    const y = Math.floor((outputSize - boxSize) / 2);

    ctx.save();
    drawRoundedRectPath(ctx, x, y, boxSize, boxSize, Math.floor(boxSize * 0.18));
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.clip();
    ctx.drawImage(logoImage, x + padding, y + padding, logoSize, logoSize);
    ctx.restore();
  }

  return canvas.toDataURL("image/png");
}

async function composeMonkeyQr(options: {
  qrSrc: string;
  logoSrc?: string;
  size?: number;
}) {
  const outputSize = Math.max(256, Math.floor(options.size ?? 1024));
  const qrImage = await loadImageForCanvas(options.qrSrc);

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Render as dots by downsampling the QR raster.
  const grid = 150;
  const tiny = document.createElement("canvas");
  tiny.width = grid;
  tiny.height = grid;
  const tctx = tiny.getContext("2d");
  if (!tctx) throw new Error("Canvas not supported");
  tctx.imageSmoothingEnabled = false;
  tctx.clearRect(0, 0, grid, grid);
  tctx.drawImage(qrImage, 0, 0, grid, grid);

  const data = tctx.getImageData(0, 0, grid, grid).data;
  const step = outputSize / grid;
  const r = step * 0.43;

  ctx.save();
  ctx.fillStyle = "#0B0B0B";
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      const i = (y * grid + x) * 4;
      const a = data[i + 3];
      if (a < 10) continue;
      const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
      if (lum > 160) continue;
      const cx = x * step + step / 2;
      const cy = y * step + step / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  const drawEye = (cx: number, cy: number, size: number) => {
    const outerR = size * 0.48;
    const ringR = outerR * 0.78;
    const dotR = outerR * 0.34;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, outerR * 1.25, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    ctx.fillStyle = "#0B0B0B";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
    ctx.fillStyle = "#0B0B0B";
    ctx.fill();
    ctx.restore();
  };

  // Circular finder eyes (3 corners)
  const eyeSize = outputSize * 0.17;
  const eyeInset = outputSize * 0.13;
  drawEye(eyeInset, eyeInset, eyeSize);
  drawEye(outputSize - eyeInset, eyeInset, eyeSize);
  drawEye(eyeInset, outputSize - eyeInset, eyeSize);

  // Center logo
  if (options.logoSrc) {
    const logoImage = await loadImageForCanvas(options.logoSrc);
    const logoSize = Math.floor(outputSize * 0.22);
    const padding = Math.floor(outputSize * 0.03);
    const boxSize = logoSize + padding * 2;
    const x = Math.floor((outputSize - boxSize) / 2);
    const y = Math.floor((outputSize - boxSize) / 2);

    ctx.save();
    drawRoundedRectPath(ctx, x, y, boxSize, boxSize, Math.floor(boxSize * 0.18));
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.clip();
    ctx.drawImage(logoImage, x + padding, y + padding, logoSize, logoSize);
    ctx.restore();
  }

  return canvas.toDataURL("image/png");
}

async function composeQrSticker(options: {
  qrSrc: string;
  logoSrc?: string;
  restaurantName?: string;
  tableLabel?: string;
  providerName?: string;
  width?: number;
  height?: number;
}) {
  const width = Math.max(720, Math.floor(options.width ?? 1024));
  const height = Math.max(920, Math.floor(options.height ?? 1280));

  const sticker = document.createElement("canvas");
  sticker.width = width;
  sticker.height = height;
  const ctx = sticker.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  const drawStylizedQrEyes = (qrX: number, qrY: number, qrSize: number) => {
    const eyeBox = qrSize * 0.18;
    const eyeInset = qrSize * 0.045;
    const positions: Array<[number, number]> = [
      [qrX + eyeInset, qrY + eyeInset], // top-left
      [qrX + qrSize - eyeInset - eyeBox, qrY + eyeInset], // top-right
      [qrX + eyeInset, qrY + qrSize - eyeInset - eyeBox], // bottom-left
    ];

    for (const [x, y] of positions) {
      const cx = x + eyeBox / 2;
      const cy = y + eyeBox / 2;
      const outerR = eyeBox * 0.46;
      const ringR = outerR * 0.78;
      const dotR = outerR * 0.34;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, outerR * 1.15, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
      ctx.fillStyle = "#0B0B0B";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
      ctx.fillStyle = "#0B0B0B";
      ctx.fill();
      ctx.restore();
    }
  };

  const accent1 = "#0B5FFF";
  const accent2 = "#00C2FF";
  const cornerGradient = ctx.createLinearGradient(width * 0.35, height * 0.18, width, height * 0.62);
  cornerGradient.addColorStop(0, accent2);
  cornerGradient.addColorStop(1, accent1);

  // Background closer to the reference: two diagonal blue bands + corner accents.
  const cornerSize = Math.floor(Math.min(width, height) * 0.2);
  ctx.fillStyle = cornerGradient;
  ctx.beginPath();
  ctx.moveTo(width - cornerSize, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width, cornerSize);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = cornerGradient;
  ctx.beginPath();
  ctx.moveTo(0, height - cornerSize);
  ctx.lineTo(0, height);
  ctx.lineTo(cornerSize, height);
  ctx.closePath();
  ctx.fill();

  const bandGradient = ctx.createLinearGradient(0, height * 0.5, width, height * 0.25);
  bandGradient.addColorStop(0, "rgba(11,95,255,0.0)");
  bandGradient.addColorStop(0.35, "rgba(11,95,255,0.12)");
  bandGradient.addColorStop(1, "rgba(0,194,255,0.0)");
  ctx.fillStyle = bandGradient;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.55);
  ctx.lineTo(width * 0.45, height * 0.28);
  ctx.lineTo(width, height * 0.42);
  ctx.lineTo(width, height * 0.72);
  ctx.lineTo(0, height * 0.68);
  ctx.closePath();
  ctx.fill();

  const bandGradient2 = ctx.createLinearGradient(0, height * 0.7, width, height * 0.45);
  bandGradient2.addColorStop(0, "rgba(0,194,255,0.0)");
  bandGradient2.addColorStop(0.35, "rgba(0,194,255,0.14)");
  bandGradient2.addColorStop(1, "rgba(11,95,255,0.0)");
  ctx.fillStyle = bandGradient2;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.72);
  ctx.lineTo(width * 0.52, height * 0.42);
  ctx.lineTo(width, height * 0.58);
  ctx.lineTo(width, height * 0.88);
  ctx.lineTo(0, height * 0.9);
  ctx.closePath();
  ctx.fill();

  const title = String(options.restaurantName || "SCAN").trim();
  const footerProvider = String(options.providerName || "V11TECH").trim();
  const tableLabel = String(options.tableLabel || "").trim();

  const paddingX = Math.floor(width * 0.08);
  const topY = Math.floor(height * 0.05);

  ctx.fillStyle = "#0B0B0B";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  const maxTitleWidth = width - paddingX * 2;
  const titleWords = title.toUpperCase().split(/\s+/).filter(Boolean);
  const buildTitleLines = (fontSize: number) => {
    ctx.font = `800 ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`;
    if (titleWords.length <= 1) return [title.toUpperCase()];

    const lines: string[] = [];
    let current = "";
    for (const word of titleWords) {
      const next = current ? `${current} ${word}` : word;
      if (ctx.measureText(next).width <= maxTitleWidth) {
        current = next;
        continue;
      }
      if (current) lines.push(current);
      current = word;
      if (lines.length === 1) break; // we only allow up to 2 lines
    }
    if (current && lines.length < 2) lines.push(current);

    if (lines.length === 1 && ctx.measureText(lines[0]).width > maxTitleWidth) {
      // If even one line doesn't fit (very long word), force split into 2 halves.
      const text = lines[0];
      const mid = Math.max(1, Math.floor(text.length / 2));
      return [text.slice(0, mid), text.slice(mid)];
    }

    if (lines.length > 2) lines.length = 2;
    return lines;
  };

  let titleFontSize = Math.floor(width * 0.075);
  let titleLines = buildTitleLines(titleFontSize);
  if (titleLines.length === 1 && ctx.measureText(titleLines[0]).width > maxTitleWidth) {
    titleFontSize = Math.floor(width * 0.065);
    titleLines = buildTitleLines(titleFontSize);
  }
  if (titleLines.length === 2) {
    titleFontSize = Math.floor(width * 0.06);
    titleLines = buildTitleLines(titleFontSize);
  }

  const titleLineHeight = Math.floor(titleFontSize * 1.08);
  const titleStartY = topY;
  titleLines.forEach((line, index) => {
    ctx.fillText(line, Math.floor(width / 2), titleStartY + index * titleLineHeight);
  });

  const titleBlockHeight = titleLines.length * titleLineHeight;
  let qrCardSize = Math.floor(Math.min(width * 0.74, height * 0.58));

  const badgeText = (() => {
    if (!tableLabel) return "";
    const raw = tableLabel.toUpperCase().trim();
    const digits = raw.replace(/[^0-9]/g, "");
    if (digits.length >= 1) {
      const trimmedDigits = digits.slice(-3);
      const paddedDigits =
        trimmedDigits.length === 1 ? `0${trimmedDigits}` : trimmedDigits;
      return `T${paddedDigits}`;
    }
    const compact = raw.replace(/[^0-9A-Z]/g, "");
    return compact.length > 3 ? compact.slice(-3) : compact;
  })();

  // Center card inside safe margins.
  const qrCardX = Math.floor(paddingX + (width - paddingX * 2 - qrCardSize) / 2);
  const titleToQrGap =
    titleLines.length === 1 ? height * 0.002 : height * 0.004;
  const qrCardY = Math.floor(
    Math.max(height * 0.095, titleStartY + titleBlockHeight + titleToQrGap),
  );

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.18)";
  ctx.shadowBlur = Math.floor(width * 0.03);
  ctx.shadowOffsetY = Math.floor(width * 0.012);
  drawRoundedRectPath(ctx, qrCardX, qrCardY, qrCardSize, qrCardSize, Math.floor(qrCardSize * 0.06));
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.restore();

  const qrPngDataUrl = await composeMonkeyQr({
    qrSrc: options.qrSrc,
    logoSrc: options.logoSrc,
    size: 1024,
  });
  const qrImage = await loadImageForCanvas(qrPngDataUrl);

  const qrInnerPadding = Math.floor(qrCardSize * 0.07);
  const qrInnerSize = qrCardSize - qrInnerPadding * 2;
  ctx.drawImage(qrImage, qrCardX + qrInnerPadding, qrCardY + qrInnerPadding, qrInnerSize, qrInnerSize);

  // Table badge as a pill below the QR card (never interferes with QR)
  let contentY = Math.floor(qrCardY + qrCardSize + height * 0.035);
  if (badgeText) {
    let fontSize = Math.floor(width * 0.045);
    fontSize = Math.max(18, Math.min(34, fontSize));

    const measure = () => {
      ctx.font = `800 ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`;
      const textWidth = ctx.measureText(badgeText).width;
      const padX = Math.floor(fontSize * 0.7);
      const padY = Math.floor(fontSize * 0.42);
      return {
        textWidth,
        w: Math.ceil(textWidth + padX * 2),
        h: Math.ceil(fontSize + padY * 2),
      };
    };

    let box = measure();
    const maxW = width - paddingX * 2;
    while (box.w > maxW && fontSize > 14) {
      fontSize = Math.floor(fontSize * 0.92);
      box = measure();
    }

    const x = Math.floor(width / 2 - box.w / 2);
    const y = contentY;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.16)";
    ctx.shadowBlur = Math.floor(width * 0.014);
    ctx.shadowOffsetY = Math.floor(width * 0.006);
    drawRoundedRectPath(ctx, x, y, box.w, box.h, Math.floor(box.h / 2));
    ctx.fillStyle = accent1;
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${fontSize}px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`;
    ctx.fillText(badgeText, Math.floor(width / 2), Math.floor(y + box.h / 2) + 1);

    contentY = y + box.h + Math.floor(height * 0.045);
  } else {
    contentY = contentY + Math.floor(height * 0.045);
  }

  const scanTextY = contentY;
  ctx.fillStyle = "#0B0B0B";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `700 ${Math.floor(width * 0.06)}px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`;
  ctx.fillText("SCAN TO ORDER", Math.floor(width / 2), scanTextY);

  if (footerProvider) {
    ctx.fillStyle = "rgba(11,11,11,0.75)";
    ctx.font = `500 ${Math.floor(width * 0.038)}px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`;
    const footerText = `Powered by ${footerProvider}`;
    const footerMaxWidth = width - paddingX * 2;
    if (ctx.measureText(footerText).width <= footerMaxWidth) {
      ctx.fillText(footerText, Math.floor(width / 2), scanTextY + Math.floor(height * 0.055));
    } else {
      let clipped = footerText;
      while (clipped.length > 12 && ctx.measureText(`${clipped}…`).width > footerMaxWidth) {
        clipped = clipped.slice(0, -1);
      }
      ctx.fillText(`${clipped}…`, Math.floor(width / 2), scanTextY + Math.floor(height * 0.055));
    }
  }

  return sticker.toDataURL("image/png");
}

const mockQRSettings: QRSettings = {
  id: "settings-1",
  restaurantName: "RestaurantPOS",
  primaryColor: "#00A19D",
  accentColor: "#FF6D00",
  enableOnlineOrdering: true,
  enablePaymentAtTable: true,
  enableOnlinePayment: false,
  serviceChargePercentage: 10,
  autoConfirmOrders: false,
  orderTimeoutMinutes: 30,
  maxOrdersPerSession: 10,
  enableCustomerInfo: false,
  enableSpecialInstructions: true,
  enableOrderTracking: true,
  welcomeMessage:
    "Welcome! Please scan the QR code to view our menu and place your order.",
  contactInfo: {
    phone: "+1 (555) 123-4567",
    email: "orders@restaurantpos.com",
    address: "123 Restaurant Street, Food City, FC 12345",
  },
  businessHours: {
    monday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
    tuesday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
    wednesday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
    thursday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
    friday: { isOpen: true, openTime: "09:00", closeTime: "23:00" },
    saturday: { isOpen: true, openTime: "09:00", closeTime: "23:00" },
    sunday: { isOpen: true, openTime: "10:00", closeTime: "21:00" },
  },
  paymentGateways: [],
};

type EditTableFormValues = {
  restaurant_id: string;
  table_number: string;
  table_name: string;
  capacity: number;
  min_capacity: number | "";
  floor: string;
  section: string;
  position_x: number | "";
  position_y: number | "";
  image: string;
  qr_code: string;
  status: string;
  is_bookable: boolean;
  is_outdoor: boolean;
  is_accessible: boolean;
  has_power_outlet: boolean;
  minimum_spend: number | "";
  description: string;
  notes: string;
  is_active: boolean;
};

interface CreateTableFormProps {
  onSave: (table: {
    tableNumber: string;
    tableName: string;
    location: string;
    capacity: number;
    isActive: boolean;
  }) => void;
  onCancel: () => void;
}

function CreateTableForm({ onSave, onCancel }: CreateTableFormProps) {
  const [formData, setFormData] = useState({
    tableNumber: "",
    tableName: "",
    location: "Main Floor",
    capacity: 4,
    isActive: true,
  });

  const handleSubmit = () => onSave(formData);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="table-number" className="text-foreground">
            Table Number *
          </Label>
          <Input
            id="table-number"
            value={formData.tableNumber}
            onChange={(e) => setFormData((p) => ({ ...p, tableNumber: e.target.value }))}
            className="bg-background border-border text-foreground"
            placeholder="T-01"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="table-name" className="text-foreground">
            Table Name
          </Label>
          <Input
            id="table-name"
            value={formData.tableName}
            onChange={(e) => setFormData((p) => ({ ...p, tableName: e.target.value }))}
            className="bg-background border-border text-foreground"
            placeholder="Table 1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location" className="text-foreground">
            Location/Section
          </Label>
          <Select
            value={formData.location}
            onValueChange={(value) => setFormData((p) => ({ ...p, location: value }))}
          >
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="Main Floor">Main Floor</SelectItem>
              <SelectItem value="VIP Section">VIP Section</SelectItem>
              <SelectItem value="Outdoor">Outdoor</SelectItem>
              <SelectItem value="Private Dining">Private Dining</SelectItem>
              <SelectItem value="Bar Area">Bar Area</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity" className="text-foreground">
            Capacity (People)
          </Label>
          <Input
            id="capacity"
            type="number"
            min="1"
            max="20"
            value={formData.capacity}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                capacity: parseInt(e.target.value) || 1,
              }))
            }
            className="bg-background border-border text-foreground"
          />
        </div>
      </div>

      <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) => setFormData((p) => ({ ...p, isActive: checked }))}
        />
        <div>
          <Label className="text-foreground font-medium">
            Enable QR Ordering
          </Label>
          <p className="text-sm text-muted-foreground">
            Allow customers to scan and order from this table
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={onCancel}
          className="border-border text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!formData.tableNumber}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Create Table
        </Button>
      </div>
    </div>
  );
}

interface EditTableFormProps {
  restaurantId: string;
  table?: QRTable;
  onSave: (table: EditTableFormValues) => void;
  onCancel: () => void;
}

function EditTableForm({ restaurantId, table, onSave, onCancel }: EditTableFormProps) {
  const [formData, setFormData] = useState<EditTableFormValues>({
    restaurant_id: String((table as any)?.restaurant_id ?? restaurantId ?? ""),
    table_number: String((table as any)?.table_number ?? table?.tableNumber ?? ""),
    table_name: String((table as any)?.table_name ?? table?.tableName ?? ""),
    capacity: Number((table as any)?.capacity ?? table?.capacity ?? 4),
    min_capacity: (table as any)?.min_capacity ?? (table as any)?.minCapacity ?? "",
    floor: String((table as any)?.floor ?? ""),
    section: String((table as any)?.section ?? (table as any)?.location ?? table?.location ?? ""),
    position_x: (table as any)?.position_x ?? (table as any)?.positionX ?? "",
    position_y: (table as any)?.position_y ?? (table as any)?.positionY ?? "",
    image: String((table as any)?.image ?? ""),
    qr_code: String((table as any)?.qr_code ?? (table as any)?.qrCode ?? ""),
    status: String((table as any)?.status ?? "available"),
    is_bookable: (table as any)?.is_bookable ?? (table as any)?.isBookable ?? true,
    is_outdoor: (table as any)?.is_outdoor ?? (table as any)?.isOutdoor ?? false,
    is_accessible: (table as any)?.is_accessible ?? (table as any)?.isAccessible ?? false,
    has_power_outlet: (table as any)?.has_power_outlet ?? (table as any)?.hasPowerOutlet ?? false,
    minimum_spend: (table as any)?.minimum_spend ?? (table as any)?.minimumSpend ?? "",
    description: String((table as any)?.description ?? ""),
    notes: String((table as any)?.notes ?? ""),
    is_active: (table as any)?.is_active ?? table?.isActive ?? true,
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      restaurant_id: String((table as any)?.restaurant_id ?? restaurantId ?? ""),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, table?.id]);

  const handleSubmit = () => onSave(formData);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-foreground">Restaurant ID *</Label>
        <Input
          value={formData.restaurant_id}
          disabled
          className="bg-background border-border text-foreground"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="table-number" className="text-foreground">
            Table Number/Identifier *
          </Label>
          <Input
            id="table-number"
            value={formData.table_number}
            onChange={(e) =>
              setFormData((p) => ({ ...p, table_number: e.target.value }))
            }
            className="bg-background border-border text-foreground"
            placeholder="T-01"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="table-name" className="text-foreground">
            Table Name
          </Label>
          <Input
            id="table-name"
            value={formData.table_name}
            onChange={(e) =>
              setFormData((p) => ({ ...p, table_name: e.target.value }))
            }
            className="bg-background border-border text-foreground"
            placeholder="Optional name"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="capacity" className="text-foreground">
            Capacity *
          </Label>
          <Input
            id="capacity"
            type="number"
            inputMode="numeric"
            min={1}
            value={formData.capacity}
            onChange={(e) =>
              setFormData((p) => ({ ...p, capacity: Number(e.target.value || 0) }))
            }
            className="bg-background border-border text-foreground"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="min-capacity" className="text-foreground">
            Min Capacity
          </Label>
          <Input
            id="min-capacity"
            type="number"
            inputMode="numeric"
            min={0}
            value={String(formData.min_capacity)}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                min_capacity: e.target.value === "" ? "" : Number(e.target.value),
              }))
            }
            className="bg-background border-border text-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="floor" className="text-foreground">
            Floor
          </Label>
          <Input
            id="floor"
            value={formData.floor}
            onChange={(e) => setFormData((p) => ({ ...p, floor: e.target.value }))}
            className="bg-background border-border text-foreground"
            placeholder="e.g. Ground"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="section" className="text-foreground">
            Section
          </Label>
          <Input
            id="section"
            value={formData.section}
            onChange={(e) => setFormData((p) => ({ ...p, section: e.target.value }))}
            className="bg-background border-border text-foreground"
            placeholder='e.g. "Patio", "Main Hall"'
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="position-x" className="text-foreground">
            Position X
          </Label>
          <Input
            id="position-x"
            type="number"
            inputMode="numeric"
            value={String(formData.position_x)}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                position_x: e.target.value === "" ? "" : Number(e.target.value),
              }))
            }
            className="bg-background border-border text-foreground"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="position-y" className="text-foreground">
            Position Y
          </Label>
          <Input
            id="position-y"
            type="number"
            inputMode="numeric"
            value={String(formData.position_y)}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                position_y: e.target.value === "" ? "" : Number(e.target.value),
              }))
            }
            className="bg-background border-border text-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="image" className="text-foreground">
            Image URL
          </Label>
          <Input
            id="image"
            value={formData.image}
            onChange={(e) => setFormData((p) => ({ ...p, image: e.target.value }))}
            className="bg-background border-border text-foreground"
            placeholder="https://..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="qr-code" className="text-foreground">
            QR Code URL
          </Label>
          <Input
            id="qr-code"
            value={formData.qr_code}
            onChange={(e) => setFormData((p) => ({ ...p, qr_code: e.target.value }))}
            className="bg-background border-border text-foreground"
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-foreground">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData((p) => ({ ...p, status: value }))}
          >
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="minimum-spend" className="text-foreground">
            Minimum Spend
          </Label>
          <Input
            id="minimum-spend"
            type="number"
            inputMode="numeric"
            min={0}
            value={String(formData.minimum_spend)}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                minimum_spend: e.target.value === "" ? "" : Number(e.target.value),
              }))
            }
            className="bg-background border-border text-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <div className="text-sm font-medium text-foreground">Bookable</div>
            <div className="text-xs text-muted-foreground">Allow online booking</div>
          </div>
          <Switch
            checked={!!formData.is_bookable}
            onCheckedChange={(checked) => setFormData((p) => ({ ...p, is_bookable: checked }))}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <div className="text-sm font-medium text-foreground">Outdoor</div>
            <div className="text-xs text-muted-foreground">Outdoor table</div>
          </div>
          <Switch
            checked={!!formData.is_outdoor}
            onCheckedChange={(checked) => setFormData((p) => ({ ...p, is_outdoor: checked }))}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <div className="text-sm font-medium text-foreground">Accessible</div>
            <div className="text-xs text-muted-foreground">Wheelchair accessible</div>
          </div>
          <Switch
            checked={!!formData.is_accessible}
            onCheckedChange={(checked) => setFormData((p) => ({ ...p, is_accessible: checked }))}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <div className="text-sm font-medium text-foreground">Power Outlet</div>
            <div className="text-xs text-muted-foreground">Has power outlet</div>
          </div>
          <Switch
            checked={!!formData.has_power_outlet}
            onCheckedChange={(checked) => setFormData((p) => ({ ...p, has_power_outlet: checked }))}
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <div className="text-sm font-medium text-foreground">Active</div>
          <div className="text-xs text-muted-foreground">Enable this table</div>
        </div>
        <Switch
          checked={!!formData.is_active}
          onCheckedChange={(checked) => setFormData((p) => ({ ...p, is_active: checked }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-foreground">
          Description
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
          className="bg-background border-border text-foreground"
          placeholder="Table description"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-foreground">
          Notes
        </Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
          className="bg-background border-border text-foreground"
          placeholder="Internal notes"
        />
      </div>

      <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={onCancel}
          className="border-border text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!formData.table_number}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {table ? "Update Table" : "Create Table"}
        </Button>
      </div>
    </div>
  );
}

function QRCodePreview({
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

function QRSettingsForm() {
  const [settings, setSettings] = useState(mockQRSettings);
  const { addToast } = useToast();

  const handleSave = () => {
    addToast({
      type: "success",
      title: "Settings Saved",
      description: "QR ordering settings updated successfully",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Restaurant Name</Label>
              <Input
                value={settings.restaurantName}
                onChange={(e) =>
                  setSettings({ ...settings, restaurantName: e.target.value })
                }
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Service Charge (%)</Label>
              <Input
                type="number"
                value={settings.serviceChargePercentage}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    serviceChargePercentage: parseFloat(e.target.value) || 0,
                  })
                }
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Welcome Message</Label>
            <Textarea
              value={settings.welcomeMessage}
              onChange={(e) =>
                setSettings({ ...settings, welcomeMessage: e.target.value })
              }
              className="bg-background border-border text-foreground"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Feature Toggles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <div className="font-medium text-foreground">
                  Online Ordering
                </div>
                <div className="text-sm text-muted-foreground">
                  Allow customers to place orders via QR
                </div>
              </div>
              <Switch
                checked={settings.enableOnlineOrdering}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableOnlineOrdering: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <div className="font-medium text-foreground">Pay at Table</div>
                <div className="text-sm text-muted-foreground">
                  Allow customers to pay later
                </div>
              </div>
              <Switch
                checked={settings.enablePaymentAtTable}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enablePaymentAtTable: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <div className="font-medium text-foreground">
                  Online Payment
                </div>
                <div className="text-sm text-muted-foreground">
                  Enable online payment gateways
                </div>
              </div>
              <Switch
                checked={settings.enableOnlinePayment}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableOnlinePayment: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <div className="font-medium text-foreground">
                  Order Tracking
                </div>
                <div className="text-sm text-muted-foreground">
                  Real-time order status updates
                </div>
              </div>
              <Switch
                checked={settings.enableOrderTracking}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableOrderTracking: checked })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        Save QR Settings
      </Button>
    </div>
  );
}

export default function QRManagement() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [editingTable, setEditingTable] = useState<QRTable | null>(null);
  const [previewTable, setPreviewTable] = useState<QRTable | null>(null);
  const [qrOnlyTable, setQrOnlyTable] = useState<QRTable | null>(null);
  const [qrOnlyDataUrl, setQrOnlyDataUrl] = useState<string | null>(null);
  const [qrOnlyLoading, setQrOnlyLoading] = useState(false);
  const [qrOnlyError, setQrOnlyError] = useState<string | null>(null);
  const [tables, setTables] = useState<QRTable[]>([]);
  const isSuperAdmin = ["super_admin", "superadmin"].includes(
    String(user?.role || "").toLowerCase().trim(),
  );
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(
    isSuperAdmin ? "" : String(user?.branchId || ""),
  );
  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  const { data: restaurantsResponse } = useQuery({
    queryKey: ["my-restaurants", user?.id],
    queryFn: () => getMyRestaurants(0, 500),
    enabled: isSuperAdmin,
    staleTime: 60000,
  });

  const restaurantOptions = (() => {
    const payload = restaurantsResponse as any;
    const source =
      payload?.data?.data ??
      payload?.data?.items ??
      payload?.data?.restaurants ??
      payload?.data ??
      payload;
    const restaurants = Array.isArray(source)
      ? source
      : Array.isArray(source?.items)
        ? source.items
        : Array.isArray(source?.restaurants)
          ? source.restaurants
          : [];

    return Array.from(
      new Map(
        restaurants
          .filter((restaurant: any) => restaurant?.id && (restaurant?.name || restaurant?.business_name))
          .map((restaurant: any) => [
            String(restaurant.id),
            {
              id: String(restaurant.id),
              name: String(restaurant.name || restaurant.business_name),
              logoUrl: String(restaurant.logo_url ?? restaurant.logoUrl ?? restaurant.logo ?? ""),
            },
          ]),
      ).values(),
    ) as { id: string; name: string; logoUrl?: string }[];
  })();

  const currentRestaurantLogoUrl =
    restaurantOptions.find((restaurant) => restaurant.id === selectedRestaurantId)?.logoUrl ||
    String((user as any)?.restaurantLogoUrl ?? (user as any)?.logo_url ?? (user as any)?.logo ?? "");

  const currentRestaurantName =
    restaurantOptions.find((restaurant) => restaurant.id === selectedRestaurantId)?.name ||
    (user as any)?.branchName ||
    (user as any)?.restaurantName ||
    "Current Restaurant";

  useEffect(() => {
    if (!isSuperAdmin) {
      setSelectedRestaurantId(String(user?.branchId || ""));
    }
  }, [isSuperAdmin, user?.branchId]);

  useEffect(() => {
    if (isSuperAdmin && !selectedRestaurantId && restaurantOptions.length > 0) {
      setSelectedRestaurantId(restaurantOptions[0].id);
    }
  }, [isSuperAdmin, selectedRestaurantId, restaurantOptions]);

  const { data: tablesResponse, refetch: refetchTables } = useQuery({
    queryKey: ["tables", selectedRestaurantId],
    queryFn: () => getTables(selectedRestaurantId),
    enabled: Boolean(selectedRestaurantId),
    staleTime: 60000,
  });

  useEffect(() => {
    if (!selectedRestaurantId) {
      setTables([]);
      return;
    }
    const payload: any = tablesResponse;
    const source =
      payload?.data?.data ??
      payload?.data?.items ??
      payload?.data?.tables ??
      payload?.data ??
      payload;
    const items = Array.isArray(source) ? source : [];

    if (!items.length) {
      setTables([]);
      return;
    }

    const normalizedTables = items.map((table: any, index: number) => {
      const id = String(table.id ?? table.table_id ?? table.tableId ?? "");
      const restaurant_id = String(
        table.restaurant_id ?? table.restaurantId ?? selectedRestaurantId ?? "",
      );
      const tableNumber = String(
        table.table_number ??
          table.tableNumber ??
          table.table_name ??
          table.tableName ??
          table.name ??
          "",
      );
      const safeTableNumber = tableNumber || id || `Table-${index + 1}`;
      const tableName = String(
        table.table_name ?? table.tableName ?? table.name ?? safeTableNumber,
      );
      const capacity = Number(table.capacity ?? table.seats ?? 0);
      const section = String(table.section ?? table.location ?? table.area ?? "");
      const floor = String(table.floor ?? "");
      const qrToken = String(
        table.qr_token ??
          table.qrToken ??
          table.qr_code_token ??
          table.qrCodeToken ??
          table.qr_code ??
          table.qrCode ??
          table.qr ??
          id ??
          safeTableNumber,
      );
      const qrCodeUrl = String(
        table.qr_code_url ??
          table.qrCodeUrl ??
          table.qr_url ??
          (qrToken ? buildQrMenuUrl(baseUrl, qrToken, id || safeTableNumber) : ""),
      );
      const qrCodeUrlWithTable = ensureTableIdInQrMenuUrl(qrCodeUrl, id || safeTableNumber);

      return {
        id: id || `table-${index + 1}`,
        restaurant_id: restaurant_id || undefined,
        tableNumber: safeTableNumber,
        tableName,
        location: section || floor || "Main Floor",
        capacity: capacity || 1,
        min_capacity: table.min_capacity ?? table.minCapacity ?? undefined,
        floor: floor || undefined,
        section: section || undefined,
        position_x: table.position_x ?? table.positionX ?? undefined,
        position_y: table.position_y ?? table.positionY ?? undefined,
        image: table.image ?? undefined,
        qr_code: table.qr_code ?? table.qrCode ?? undefined,
        status: table.status ?? undefined,
        is_bookable: table.is_bookable ?? table.isBookable ?? undefined,
        is_outdoor: table.is_outdoor ?? table.isOutdoor ?? undefined,
        is_accessible: table.is_accessible ?? table.isAccessible ?? undefined,
        has_power_outlet: table.has_power_outlet ?? table.hasPowerOutlet ?? undefined,
        minimum_spend: table.minimum_spend ?? table.minimumSpend ?? undefined,
        description: table.description ?? undefined,
        notes: table.notes ?? undefined,
        qrCodeUrl: qrCodeUrlWithTable,
        qrToken,
        isActive: table.is_active ?? table.isActive ?? true,
        isOccupied: table.is_occupied ?? table.isOccupied ?? false,
        currentSessionId:
          table.current_session_id ?? table.currentSessionId ?? undefined,
        createdAt: table.created_at ? new Date(table.created_at) : new Date(),
        lastUsed: table.last_used ? new Date(table.last_used) : undefined,
      } as QRTable;
    });

    setTables(normalizedTables);
  }, [tablesResponse, baseUrl, selectedRestaurantId]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!qrOnlyTable) return;
      setQrOnlyLoading(true);
      setQrOnlyError(null);
      setQrOnlyDataUrl(null);

      const qrValue = String(qrOnlyTable.qrCodeUrl || "").trim();
      const qrSrcCandidate = String((qrOnlyTable as any).qr_code ?? "").trim();
      const qrSrc = isProbablyImageUrl(qrSrcCandidate)
        ? qrSrcCandidate
        : qrValue
          ? buildRemoteQrImageUrl(qrValue)
          : "";

      if (!qrSrc) {
        setQrOnlyError("QR image is not available for this table.");
        setQrOnlyLoading(false);
        return;
      }

      try {
        const dataUrl = await composeQrSticker({
          qrSrc,
          logoSrc: currentRestaurantLogoUrl,
          restaurantName: currentRestaurantName,
          tableLabel: String(qrOnlyTable.tableNumber || "").trim(),
          providerName: "V11TECH",
        });
        if (cancelled) return;
        setQrOnlyDataUrl(dataUrl);
      } catch (error: any) {
        if (cancelled) return;
        setQrOnlyError(
          error?.message ||
            "Could not render QR image. This can happen due to image CORS restrictions.",
        );
      } finally {
        if (cancelled) return;
        setQrOnlyLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [qrOnlyTable, currentRestaurantLogoUrl]);

  const downloadQrOnly = () => {
    if (!qrOnlyTable || !qrOnlyDataUrl) return;
    const filename = `${safeFilePart(currentRestaurantName)}_${safeFilePart(
      String(qrOnlyTable.tableNumber || qrOnlyTable.tableName || "table"),
    )}_sticker.png`;
    triggerDownloadDataUrl(qrOnlyDataUrl, filename);
    addToast({
      type: "success",
      title: "Downloaded",
      description: "QR image downloaded as PNG.",
    });
  };

  const filteredTables = tables.filter((table) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      table.tableNumber.toLowerCase().includes(query) ||
      table.tableName.toLowerCase().includes(query);
    const matchesLocation =
      selectedLocation === "all" || table.location === selectedLocation;
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "active" ? table.isActive : !table.isActive);
    return matchesSearch && matchesLocation && matchesStatus;
  });

  const createTableMutation = useMutation({
    mutationFn: createTable,
    onSuccess: () => {
      addToast({
        type: "success",
        title: "Table Created",
        description: "Table has been created successfully",
      });
      setIsAddingTable(false);
      refetchTables();
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Create Table",
        description: error?.message || "An error occurred while creating the table",
      });
    },
  });

  const updateTableMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateTable(id, data),
    onSuccess: () => {
      addToast({
        type: "success",
        title: "Table Updated",
        description: "Table has been updated successfully",
      });
      setEditingTable(null);
      refetchTables();
    },
    onError: (error: any) => {
      addToast({
        type: "error",
        title: "Failed to Update Table",
        description: error?.message || "An error occurred while updating the table",
      });
    },
  });

  const handleSaveTable = (tableData: any) => {
    const restaurantId = String(tableData.restaurant_id || selectedRestaurantId || "").trim();
    const tableNumber = String(tableData.table_number || "").trim();
    const tableName = String(tableData.table_name || "").trim();
    const capacity = Number(tableData.capacity || 0);
    const minCapacity =
      tableData.min_capacity === "" || tableData.min_capacity === undefined
        ? undefined
        : Number(tableData.min_capacity);
    const floor = String(tableData.floor || "").trim() || undefined;
    const section = String(tableData.section || "").trim() || undefined;
    const positionX =
      tableData.position_x === "" || tableData.position_x === undefined
        ? undefined
        : Number(tableData.position_x);
    const positionY =
      tableData.position_y === "" || tableData.position_y === undefined
        ? undefined
        : Number(tableData.position_y);
    const image = String(tableData.image || "").trim() || undefined;
    const qrCode = String(tableData.qr_code || "").trim() || undefined;
    const status = String(tableData.status || "").trim() || undefined;
    const isBookable = tableData.is_bookable ?? true;
    const isOutdoor = tableData.is_outdoor ?? false;
    const isAccessible = tableData.is_accessible ?? false;
    const hasPowerOutlet = tableData.has_power_outlet ?? false;
    const minimumSpend =
      tableData.minimum_spend === "" || tableData.minimum_spend === undefined
        ? undefined
        : Number(tableData.minimum_spend);
    const description = String(tableData.description || "").trim() || undefined;
    const notes = String(tableData.notes || "").trim() || undefined;
    const isActive = tableData.is_active ?? true;

    if (!restaurantId) {
      addToast({
        type: "error",
        title: "Restaurant Required",
        description: "Please select a restaurant before creating a table.",
      });
      return;
    }
    if (!tableNumber) {
      addToast({
        type: "error",
        title: "Table Number Required",
        description: "Please enter a table number.",
      });
      return;
    }
    if (!capacity || capacity <= 0) {
      addToast({
        type: "error",
        title: "Capacity Required",
        description: "Please enter a valid capacity.",
      });
      return;
    }

    const payload: any = {
      restaurant_id: restaurantId,
      table_number: tableNumber,
      table_name: tableName || undefined,
      capacity,
      min_capacity: minCapacity,
      floor,
      section,
      location: section || floor || undefined,
      position_x: positionX,
      position_y: positionY,
      image,
      qr_code: qrCode,
      status,
      is_bookable: !!isBookable,
      is_outdoor: !!isOutdoor,
      is_accessible: !!isAccessible,
      has_power_outlet: !!hasPowerOutlet,
      minimum_spend: minimumSpend,
      description,
      notes,
      is_active: !!isActive,
    };

    if (!editingTable?.id) return;
    updateTableMutation.mutate({ id: editingTable.id, data: payload });
  };

  const deleteTable = (tableId: string) => {
    setTables(tables.filter((t) => t.id !== tableId));
  };

  const toggleTableStatus = (tableId: string) => {
    setTables(
      tables.map((table) =>
        table.id === tableId ? { ...table, isActive: !table.isActive } : table,
      ),
    );
  };

  const getTableStats = () => {
    return {
      total: tables.length,
      active: tables.filter((t) => t.isActive).length,
      occupied: tables.filter((t) => t.isOccupied).length,
      available: tables.filter((t) => t.isActive && !t.isOccupied).length,
    };
  };

  const stats = getTableStats();
  const locations = Array.from(new Set(tables.map((t) => t.location)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">QR Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage QR codes, tables, and ordering settings
          </p>
        </div>
        <Dialog open={isAddingTable} onOpenChange={setIsAddingTable}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-card-foreground">
                Add New Table
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Label className="text-foreground">Restaurant</Label>
              {isSuperAdmin ? (
                <Select
                  value={selectedRestaurantId || "none"}
                  onValueChange={(value) =>
                    setSelectedRestaurantId(value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger className="bg-background border-border text-foreground">
                    <SelectValue placeholder="Select Restaurant" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="none">Select Restaurant</SelectItem>
                    {restaurantOptions.map((restaurant) => (
                      <SelectItem key={restaurant.id} value={restaurant.id}>
                        {restaurant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={currentRestaurantName} disabled />
              )}
            </div>
            <CreateTableForm
              onSave={(values) => {
                const restaurantId = String(selectedRestaurantId || "").trim();
                const tableNumber = String(values.tableNumber || "").trim();
                const tableName = String(values.tableName || "").trim();
                const location = String(values.location || "").trim();
                const capacity = Number(values.capacity || 0);
                const isActive = values.isActive ?? true;

                if (!restaurantId) {
                  addToast({
                    type: "error",
                    title: "Restaurant Required",
                    description: "Please select a restaurant before creating a table.",
                  });
                  return;
                }
                if (!tableNumber) {
                  addToast({
                    type: "error",
                    title: "Table Number Required",
                    description: "Please enter a table number.",
                  });
                  return;
                }
                if (!capacity || capacity <= 0) {
                  addToast({
                    type: "error",
                    title: "Capacity Required",
                    description: "Please enter a valid capacity.",
                  });
                  return;
                }

                createTableMutation.mutate({
                  restaurant_id: restaurantId,
                  table_number: tableNumber,
                  table_name: tableName || undefined,
                  capacity,
                  location: location || undefined,
                  is_active: !!isActive,
                });
              }}
              onCancel={() => setIsAddingTable(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {stats.total}
              </div>
              <div className="text-sm text-muted-foreground">Total Tables</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {stats.active}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {stats.occupied}
              </div>
              <div className="text-sm text-muted-foreground">Occupied</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {stats.available}
              </div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tables">
        <TabsList className="bg-muted border-border">
          <TabsTrigger
            value="tables"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <QrCode className="mr-2 h-4 w-4" />
            Tables & QR Codes
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <SettingsIcon className="mr-2 h-4 w-4" />
            QR Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="space-y-6">
          {/* Filters */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                {isSuperAdmin ? (
                  <Select
                    value={selectedRestaurantId || "none"}
                    onValueChange={(value) =>
                      setSelectedRestaurantId(value === "none" ? "" : value)
                    }
                  >
                    <SelectTrigger className="w-full lg:w-60 bg-background border-border text-foreground">
                      <SelectValue placeholder="Restaurant" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="none">Select Restaurant</SelectItem>
                      {restaurantOptions.map((restaurant) => (
                        <SelectItem key={restaurant.id} value={restaurant.id}>
                          {restaurant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={currentRestaurantName}
                    disabled
                    className="w-full lg:w-60 bg-background border-border text-foreground"
                  />
                )}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search tables..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background border-border text-foreground"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:flex">
                  <Select
                    value={selectedLocation}
                    onValueChange={setSelectedLocation}
                  >
                    <SelectTrigger className="w-full lg:w-48 bg-background border-border text-foreground">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="all">All Locations</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedStatus}
                    onValueChange={(value) =>
                      setSelectedStatus(value as "all" | "active" | "inactive")
                    }
                  >
                    <SelectTrigger className="w-full lg:w-44 bg-background border-border text-foreground">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tables Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTables.map((table) => (
              <Card
                key={table.id}
                className={`bg-card border-border ${
                  !table.isActive ? "opacity-60" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-card-foreground flex items-center">
                        {table.tableName}
                        {table.isOccupied && (
                          <Badge className="ml-2 bg-red-500 text-white">
                            Occupied
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {table.tableNumber} • {table.location}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {table.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Capacity:</span>
                    <span className="text-foreground flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {table.capacity} people
                    </span>
                  </div>

                  {table.lastUsed && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Used:</span>
                      <span className="text-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {table.lastUsed.toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono">
                    {table.qrCodeUrl}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-border text-foreground"
                          onClick={() => setPreviewTable(table)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-card-foreground">
                            QR Code Preview
                         </DialogTitle>
                        </DialogHeader>
                        {previewTable && (
                          <QRCodePreview
                            table={previewTable}
                            restaurantName={currentRestaurantName}
                            restaurantLogoUrl={currentRestaurantLogoUrl}
                          />
                        )}
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQrOnlyTable(table)}
                      className="border-border text-blue-600 hover:text-blue-700"
                      title="Show QR"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleTableStatus(table.id)}
                      className={`border-border ${
                        table.isActive
                          ? "text-red-500 hover:text-red-500"
                          : "text-green-500 hover:text-green-500"
                      }`}
                    >
                      {table.isActive ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </Button>

                    <Dialog
                      open={Boolean(editingTable)}
                      onOpenChange={(open) => {
                        if (!open) setEditingTable(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border text-muted-foreground hover:text-foreground"
                          onClick={() => setEditingTable(table)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-card-foreground">
                            Edit Table
                          </DialogTitle>
                        </DialogHeader>
                        <EditTableForm
                          table={editingTable || undefined}
                          restaurantId={String((editingTable as any)?.restaurant_id || selectedRestaurantId || "")}
                          onSave={handleSaveTable}
                          onCancel={() => setEditingTable(null)}
                        />
                      </DialogContent>
                    </Dialog>

                    {/* Delete option removed as requested */}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTables.length === 0 && (
            <Card className="bg-card border-border">
              <CardContent className="text-center py-12">
                <QrCode className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No tables found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {!selectedRestaurantId && isSuperAdmin
                    ? "Select a restaurant to view its tables"
                    : searchQuery ||
                        selectedLocation !== "all" ||
                        selectedStatus !== "all"
                    ? "Try adjusting your search or filters"
                    : "Create your first QR table to get started"}
                </p>
                {!selectedRestaurantId && isSuperAdmin ? null : !searchQuery &&
                  selectedLocation === "all" &&
                  selectedStatus === "all" && (
                  <Button
                    onClick={() => setIsAddingTable(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Table
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <QRSettingsForm />
        </TabsContent>
      </Tabs>

      <Dialog
        open={Boolean(qrOnlyTable)}
        onOpenChange={(open) => {
          if (open) return;
          setQrOnlyTable(null);
          setQrOnlyDataUrl(null);
          setQrOnlyError(null);
          setQrOnlyLoading(false);
        }}
      >
        <DialogContent className="bg-card border-border max-w-md">
          <div className="flex items-center justify-center">
            {qrOnlyLoading ? (
              <div className="w-64 h-64 bg-muted rounded-xl flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-muted-foreground animate-spin" />
              </div>
            ) : qrOnlyDataUrl ? (
              <button
                type="button"
                onClick={downloadQrOnly}
                className="bg-white rounded-2xl p-4 shadow-sm border border-border"
                title="Click to download"
              >
                <img src={qrOnlyDataUrl} alt="QR sticker" className="w-80 max-w-full h-auto" />
              </button>
            ) : (
              <div className="w-full text-center text-sm text-muted-foreground">
                {qrOnlyError || "QR not available"}
              </div>
            )}
          </div>

          {qrOnlyDataUrl ? (
            <Button
              onClick={downloadQrOnly}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PNG
            </Button>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
