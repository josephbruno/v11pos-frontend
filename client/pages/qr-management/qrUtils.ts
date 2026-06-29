export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const normalizeDoubleProtocolUrl = (url: string) =>
  url
    .replace(/^https?:\/\/https:\/\//i, "https://")
    .replace(/^https?:\/\/http:\/\//i, "http://");

export const resolveTableImageSrc = (image?: string) => {
  if (!image) return "";
  const cleaned = normalizeDoubleProtocolUrl(image);
  if (/^https?:\/\//i.test(cleaned)) return cleaned;

  const base = String(BACKEND_URL || "").replace(/\/$/, "");
  const path = cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
  return `${base}${path}`;
};

export function isProbablyImageUrl(value: unknown) {
  if (!value) return false;
  const text = String(value).trim();
  if (!text) return false;
  if (/^data:image\//i.test(text)) return true;
  if (/^https?:\/\//i.test(text)) return true;
  if (/^\//.test(text)) return true;
  if (/^blob:/i.test(text)) return true;
  return /\.(png|jpe?g|svg|webp)(\?.*)?$/i.test(text);
}

export function buildRemoteQrImageUrl(text: string, size = 420) {
  const payload = encodeURIComponent(text);
  // Uses a public QR image generator as a fallback when backend doesn't provide a QR image.
  // Note: download/print may fail if the remote server blocks CORS.
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&ecc=H&data=${payload}`;
}

export function safeFilePart(value: string) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_-]/g, "");
}

export function triggerDownloadDataUrl(dataUrl: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function ensureTableIdInQrMenuUrl(url: string, tableId: string) {
  const trimmedUrl = String(url || "").trim();
  const trimmedTableId = String(tableId || "").trim();
  if (!trimmedUrl || !trimmedTableId) return trimmedUrl;
  if (/\/table\/[^/]+\/?$/i.test(trimmedUrl) || /\/table\/[^/]+\b/i.test(trimmedUrl)) {
    return trimmedUrl;
  }
  const withoutTrailingSlash = trimmedUrl.replace(/\/+$/, "");
  return `${withoutTrailingSlash}/table/${encodeURIComponent(trimmedTableId)}`;
}

export function buildQrMenuUrl(baseUrl: string, token: string, tableId: string) {
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

export async function composeMonkeyQr(options: {
  qrSrc: string;
  logoSrc?: string;
  size?: number;
}) {
  const outputSize = Math.max(512, Math.floor(options.size ?? 1024));
  const qrImage = await loadImageForCanvas(options.qrSrc);

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Step 1: Detect actual QR modules
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = qrImage.width;
  tempCanvas.height = qrImage.height;
  const tctx = tempCanvas.getContext("2d", { willReadFrequently: true });
  if (!tctx) throw new Error("Canvas not supported");
  tctx.drawImage(qrImage, 0, 0);
  const qrData = tctx.getImageData(0, 0, qrImage.width, qrImage.height).data;

  // Detect module size
  // The first 7 modules are black (finder pattern).
  // The first transition to white marks the end of 7 modules.
  let firstWhiteX = 0;
  for (let x = 0; x < qrImage.width; x++) {
    const i = x * 4;
    const isWhite = qrData[i] > 180 && qrData[i+1] > 180 && qrData[i+2] > 180;
    if (isWhite) {
      firstWhiteX = x;
      break;
    }
  }
  
  // If firstWhiteX is found, it represents 7 modules.
  const modulePixelSize = firstWhiteX ? firstWhiteX / 7 : Math.floor(qrImage.width / 21);
  const grid = Math.round(qrImage.width / modulePixelSize);
  
  // Re-sample to the exact grid
  const gridCanvas = document.createElement("canvas");
  gridCanvas.width = grid;
  gridCanvas.height = grid;
  const gctx = gridCanvas.getContext("2d");
  if (!gctx) throw new Error("Canvas not supported");
  gctx.imageSmoothingEnabled = false;
  gctx.drawImage(qrImage, 0, 0, grid, grid);
  const gridData = gctx.getImageData(0, 0, grid, grid).data;

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, outputSize, outputSize);

  const step = outputSize / grid;
  const moduleDrawSize = step * 0.85; // Use 85% for a nice "Monkey QR" look with gaps

  const eyeSize = 7;
  const logoSizeModules = Math.floor(grid * 0.20); 
  const logoStart = Math.floor((grid - logoSizeModules) / 2);
  const logoEnd = logoStart + logoSizeModules;

  ctx.fillStyle = "#000000";
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      // Skip finder patterns
      if (y < eyeSize && x < eyeSize) continue;
      if (y < eyeSize && x >= grid - eyeSize) continue;
      if (y >= grid - eyeSize && x < eyeSize) continue;

      // Skip logo area
      if (options.logoSrc && x >= logoStart && x < logoEnd && y >= logoStart && y < logoEnd) continue;

      const i = (y * grid + x) * 4;
      const isBlack = gridData[i] < 128 && gridData[i+3] > 128;

      if (isBlack) {
        const cx = x * step + step / 2;
        const cy = y * step + step / 2;
        const r = moduleDrawSize / 2;
        
        // Circular/Dotted look for "Monkey QR"
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Draw perfect Finder Patterns (Eyes) - Dotted/Rounded style
  const drawEye = (ex: number, ey: number) => {
    const s = step;
    const x = ex * s;
    const y = ey * s;
    const fullSize = 7 * s;
    
    ctx.save();
    ctx.fillStyle = "#000000";
    
    // Outer frame (7x7) with nice rounding
    drawRoundedRectPath(ctx, x, y, fullSize, fullSize, fullSize * 0.25);
    ctx.fill();
    
    // Inner white gap (5x5)
    ctx.fillStyle = "#FFFFFF";
    drawRoundedRectPath(ctx, x + s, y + s, 5 * s, 5 * s, (5 * s) * 0.2);
    ctx.fill();
    
    // Inner solid dot (3x3)
    ctx.fillStyle = "#000000";
    drawRoundedRectPath(ctx, x + 2 * s, y + 2 * s, 3 * s, 3 * s, (3 * s) * 0.2);
    ctx.fill();
    
    ctx.restore();
  };

  drawEye(0, 0); // Top-left
  drawEye(grid - 7, 0); // Top-right
  drawEye(0, grid - 7); // Bottom-left

  // Center logo
  if (options.logoSrc) {
    const logoImage = await loadImageForCanvas(options.logoSrc);
    const logoDrawSize = logoSizeModules * step;
    const logoPadding = step * 0.5;
    const boxSize = logoDrawSize + logoPadding * 2;
    const lx = (outputSize - boxSize) / 2;
    const ly = (outputSize - boxSize) / 2;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.1)";
    ctx.shadowBlur = 10;
    drawRoundedRectPath(ctx, lx, ly, boxSize, boxSize, boxSize * 0.25);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.clip();
    
    ctx.drawImage(logoImage, lx + logoPadding, ly + logoPadding, logoDrawSize, logoDrawSize);
    ctx.restore();
  }

  return canvas.toDataURL("image/png");
}

export async function composeQrSticker(options: {
  qrSrc: string;
  logoSrc?: string;
  restaurantName?: string;
  tableLabel?: string;
  providerName?: string;
  width?: number;
  height?: number;
}) {
  const width = Math.max(800, Math.floor(options.width ?? 1024));
  const height = Math.max(1100, Math.floor(options.height ?? 1350));

  const sticker = document.createElement("canvas");
  sticker.width = width;
  sticker.height = height;
  const ctx = sticker.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // White Background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  const accent1 = "#0F4CFF";
  const accent2 = "#00A3FF";
  
  // Premium Background Accents
  const cornerGradient = ctx.createLinearGradient(0, 0, width, height);
  cornerGradient.addColorStop(0, accent1);
  cornerGradient.addColorStop(1, accent2);

  // Top-right triangle accent
  const cornerSize = Math.floor(width * 0.3);
  ctx.fillStyle = cornerGradient;
  ctx.beginPath();
  ctx.moveTo(width - cornerSize, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(width, cornerSize);
  ctx.closePath();
  ctx.fill();

  // Bottom-left triangle accent
  ctx.beginPath();
  ctx.moveTo(0, height - cornerSize);
  ctx.lineTo(0, height);
  ctx.lineTo(cornerSize, height);
  ctx.closePath();
  ctx.fill();

  // Subtle diagonal bands
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = accent1;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.4);
  ctx.lineTo(width, height * 0.2);
  ctx.lineTo(width, height * 0.25);
  ctx.lineTo(0, height * 0.45);
  ctx.closePath();
  ctx.fill();
  
  ctx.beginPath();
  ctx.moveTo(0, height * 0.6);
  ctx.lineTo(width, height * 0.4);
  ctx.lineTo(width, height * 0.45);
  ctx.lineTo(0, height * 0.65);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  const title = String(options.restaurantName || "SCAN").trim().toUpperCase();
  const footerProvider = String(options.providerName || "V11TECH").trim();
  const tableLabel = String(options.tableLabel || "").trim();

  const paddingX = Math.floor(width * 0.1);
  
  // Typography
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Title Rendering (Max 2 lines)
  const maxTitleWidth = width - paddingX * 2;
  const titleWords = title.split(/\s+/);
  
  let fontSize = Math.floor(width * 0.07);
  ctx.font = `900 ${fontSize}px "Inter", "system-ui", sans-serif`;
  
  const lines: string[] = [];
  let currentLine = "";
  for (const word of titleWords) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxTitleWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length >= 2) break;
    }
  }
  if (currentLine && lines.length < 2) lines.push(currentLine);

  const titleY = Math.floor(height * 0.1);
  const lineHeight = fontSize * 1.1;
  
  ctx.fillStyle = "#0F0F0F";
  lines.forEach((line, i) => {
    ctx.fillText(line, width / 2, titleY + (i - (lines.length - 1) / 2) * lineHeight);
  });

  // QR Card
  const qrCardSize = Math.floor(width * 0.72);
  const qrCardX = (width - qrCardSize) / 2;
  const qrCardY = Math.floor(height * 0.22);

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.12)";
  ctx.shadowBlur = Math.floor(width * 0.04);
  ctx.shadowOffsetY = Math.floor(width * 0.02);
  drawRoundedRectPath(ctx, qrCardX, qrCardY, qrCardSize, qrCardSize, Math.floor(qrCardSize * 0.08));
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.restore();

  const qrPngDataUrl = await composeMonkeyQr({
    qrSrc: options.qrSrc,
    logoSrc: options.logoSrc,
    size: 1024,
  });
  const qrImage = await loadImageForCanvas(qrPngDataUrl);

  const qrInnerPadding = Math.floor(qrCardSize * 0.06);
  const qrInnerSize = qrCardSize - qrInnerPadding * 2;
  ctx.drawImage(qrImage, qrCardX + qrInnerPadding, qrCardY + qrInnerPadding, qrInnerSize, qrInnerSize);

  // Table ID Badge (Pill)
  let currentY = qrCardY + qrCardSize + Math.floor(height * 0.05);
  if (tableLabel) {
    const badgeFontSize = Math.floor(width * 0.045);
    ctx.font = `bold ${badgeFontSize}px sans-serif`;
    const badgeText = tableLabel.toUpperCase();
    const textWidth = ctx.measureText(badgeText).width;
    const badgeWidth = textWidth + Math.floor(width * 0.08);
    const badgeHeight = badgeFontSize * 1.8;
    
    ctx.save();
    drawRoundedRectPath(ctx, (width - badgeWidth) / 2, currentY - badgeHeight / 2, badgeWidth, badgeHeight, badgeHeight / 2);
    ctx.fillStyle = "#0F4CFF";
    ctx.fill();
    
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(badgeText, width / 2, currentY);
    ctx.restore();
    currentY += badgeHeight / 2 + Math.floor(height * 0.05);
  } else {
    currentY += Math.floor(height * 0.02);
  }

  // Large CTA
  const scanTextY = currentY;
  ctx.font = `900 ${Math.floor(width * 0.065)}px sans-serif`;
  ctx.fillStyle = "#0F0F0F";
  ctx.fillText("SCAN TO ORDER", width / 2, scanTextY);

  // Provider
  ctx.font = `500 ${Math.floor(width * 0.035)}px sans-serif`;
  ctx.fillStyle = "#666666";
  ctx.fillText(`Powered by ${footerProvider}`, width / 2, scanTextY + Math.floor(height * 0.05));

  return sticker.toDataURL("image/png");
}
