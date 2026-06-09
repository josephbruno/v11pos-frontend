export function resolveOrderSource(order: {
  source?: string | null;
  created_by?: string | null;
}): string {
  const source = String(order.source ?? "").toLowerCase();
  if (source === "qr_table") return "qr_table";
  if (source === "pos") return "pos";
  if (source === "web") return "web";
  if (source === "app") return "app";
  if (!source && order.created_by) return "pos";
  return source;
}

export function formatOrderSourceLabel(order: {
  source?: string | null;
  created_by?: string | null;
  order_type?: string | null;
}): string {
  const resolved = resolveOrderSource(order);
  if (resolved === "pos") return "POS Order";
  if (resolved === "qr_table") return "QR Order";
  if (resolved === "web") return "Web Order";
  if (resolved === "app") return "App Order";
  if (resolved) {
    return resolved.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  const type = order.order_type ?? "dine_in";
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isPosOrder(order: {
  source?: string | null;
  created_by?: string | null;
}): boolean {
  return resolveOrderSource(order) === "pos";
}

export function isQrTableOrder(order: { source?: string | null }): boolean {
  return String(order.source ?? "").toLowerCase() === "qr_table";
}
