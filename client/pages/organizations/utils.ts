import type { Restaurant } from "@shared/api";

export function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function sanitizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function sanitizeAlphaSpaces(value: string) {
  return value.replace(/[^a-zA-Z\s]/g, "");
}

export function sanitizeAddress(value: string) {
  return value.replace(/[^a-zA-Z0-9\s/,]/g, "");
}

export function normalizeRestaurantStatus(raw: any): "active" | "inactive" {
  const status = String(raw?.status || "").toLowerCase();
  if (status === "active" || status === "inactive") {
    return status;
  }
  if (raw?.is_active === true || raw?.active === true) return "active";
  if (raw?.is_active === false || raw?.active === false) return "inactive";
  return "inactive";
}

export function extractRestaurants(payload: any): Restaurant[] {
  const source = payload?.data ?? payload;
  const list = Array.isArray(source)
    ? source
    : Array.isArray(source?.items)
      ? source.items
      : Array.isArray(source?.restaurants)
        ? source.restaurants
        : [];

  return list.map((restaurant: any) => ({
    ...restaurant,
    status: normalizeRestaurantStatus(restaurant),
  })) as Restaurant[];
}

/** Validate Indian GSTIN (15 chars) when provided. */
export function isValidGstin(value: string): boolean {
  const gstin = value.trim().toUpperCase();
  if (!gstin) return true;
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin);
}

/** Validate PAN format when provided. */
export function isValidPan(value: string): boolean {
  const pan = value.trim().toUpperCase();
  if (!pan) return true;
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
}
