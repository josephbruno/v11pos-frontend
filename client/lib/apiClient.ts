/**
 * API Client for making authenticated requests to the backend
 * This file provides utilities for API communication with automatic token handling
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");
const joinUrl = (baseUrl: string, endpoint: string) => {
  const base = normalizeBaseUrl(baseUrl);
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
};

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * Get the authentication token from localStorage
 */
export function getAuthToken(endpoint?: string): string | null {
  if (endpoint && (endpoint.includes("/customer-auth") || endpoint.includes("/carts"))) {
    return localStorage.getItem("pos-customer-token") || localStorage.getItem("restaurant-pos-token");
  }
  if (typeof window !== "undefined" && window.location.pathname.includes("/qr-")) {
    return localStorage.getItem("pos-customer-token") || localStorage.getItem("restaurant-pos-token");
  }
  return localStorage.getItem("restaurant-pos-token");
}

/**
 * Get the token type from localStorage
 */
export function getTokenType(endpoint?: string): string {
  const isCustomerEndpoint = endpoint && (endpoint.includes("/customer-auth") || endpoint.includes("/carts"));
  const isCustomerUrl = typeof window !== "undefined" && window.location.pathname.includes("/qr-");
  
  let tokenType;
  if ((isCustomerEndpoint || isCustomerUrl) && localStorage.getItem("pos-customer-token")) {
     tokenType = "Bearer"; // Customer tokens are always Bearer for now
  } else {
     tokenType = localStorage.getItem("restaurant-pos-token-type") || "Bearer";
  }
  return tokenType.toLowerCase() === "bearer" ? "Bearer" : tokenType;
}

function parseJwtExpiryMs(token: string): number | null {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return null;

    const normalized = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { exp?: number };

    if (!payload.exp) return null;
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(): boolean {
  const token = localStorage.getItem("restaurant-pos-token");
  const expiresAt = localStorage.getItem("restaurant-pos-token-expires");

  if (expiresAt) {
    return Date.now() >= parseInt(expiresAt, 10);
  }

  if (token) {
    const jwtExpiry = parseJwtExpiryMs(token);
    if (jwtExpiry) {
      return Date.now() >= jwtExpiry;
    }
  }

  return true;
}

export function persistAccessToken(accessToken: string, tokenType?: string): void {
  localStorage.setItem("restaurant-pos-token", accessToken);

  if (tokenType) {
    const normalized = tokenType.toLowerCase() === "bearer" ? "Bearer" : tokenType;
    localStorage.setItem("restaurant-pos-token-type", normalized);
  }

  const expiryMs = parseJwtExpiryMs(accessToken);
  if (expiryMs) {
    localStorage.setItem("restaurant-pos-token-expires", String(expiryMs));
  }
}

function clearAuthStorage(): void {
  localStorage.removeItem("restaurant-pos-user");
  localStorage.removeItem("restaurant-pos-token");
  localStorage.removeItem("restaurant-pos-refresh-token");
  localStorage.removeItem("restaurant-pos-token-type");
  localStorage.removeItem("restaurant-pos-token-expires");
}

function redirectToLogin(): void {
  if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
    window.location.href = "/login";
  }
}

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Exchange stored refresh token for a new access token.
 */
export async function refreshSession(): Promise<boolean> {
  const refreshToken = localStorage.getItem("restaurant-pos-refresh-token");
  if (!refreshToken) return false;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!response.ok) return false;

        const payload = await response.json();
        const data = payload?.data ?? payload;
        if (!data?.access_token) return false;

        persistAccessToken(data.access_token, data.token_type);
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

function isPublicAuthEndpoint(endpoint?: string): boolean {
  if (!endpoint) return false;
  return (
    endpoint.includes("/auth/login") ||
    endpoint.includes("/auth/refresh") ||
    endpoint.includes("/auth/forgot-password") ||
    endpoint.includes("/auth/verify-otp") ||
    endpoint.includes("/auth/reset-password")
  );
}

function buildRequestHeaders(options: RequestInit, endpoint?: string, withAuth = true): HeadersInit {
  return {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(withAuth ? getAuthHeaders(endpoint) : {}),
    ...options.headers,
  };
}

async function apiRequest(url: string, options: RequestInit = {}, endpoint?: string): Promise<Response> {
  const useAuth = !isPublicAuthEndpoint(endpoint);
  let response = await fetch(url, {
    ...options,
    headers: buildRequestHeaders(options, endpoint, useAuth),
  });

  if (response.status === 401 && useAuth) {
    const refreshed = await refreshSession();
    if (refreshed) {
      response = await fetch(url, {
        ...options,
        headers: buildRequestHeaders(options, endpoint, true),
      });
    }

    if (response.status === 401) {
      clearAuthStorage();
      redirectToLogin();
    }
  }

  return response;
}

/**
 * Get authorization headers with stored token
 */
function getAuthHeaders(endpoint?: string): HeadersInit {
  const token = getAuthToken(endpoint);
  const tokenType = getTokenType(endpoint);

  if (!token) {
    return {};
  }

  return {
    Authorization: `${tokenType} ${token}`,
  };
}

/**
 * Handle API response and errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText || "Request failed" };
    }

    throw new ApiError(
      errorData.message || errorData.detail || "Request failed",
      response.status,
      errorData
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    return (text ? ({ message: text } as unknown as T) : ({} as T));
  }

  try {
    return await response.json();
  } catch {
    return {} as T;
  }
}

/**
 * Make an authenticated GET request
 */
export async function apiGet<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await apiRequest(
    `${API_BASE_URL}${endpoint}`,
    { method: "GET", ...options },
    endpoint
  );

  return handleResponse<T>(response);
}

/**
 * Make an authenticated POST request to a specific base URL
 */
export async function apiPostTo<T = any>(
  baseUrl: string,
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<T> {
  const response = await apiRequest(
    joinUrl(baseUrl, endpoint),
    {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    },
    endpoint
  );

  return handleResponse<T>(response);
}

/**
 * Make an authenticated PUT request to a specific base URL
 */
export async function apiPutTo<T = any>(
  baseUrl: string,
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<T> {
  const response = await apiRequest(
    joinUrl(baseUrl, endpoint),
    {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    },
    endpoint
  );

  return handleResponse<T>(response);
}

/**
 * Make an authenticated POST request
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<T> {
  const response = await apiRequest(
    `${API_BASE_URL}${endpoint}`,
    {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    },
    endpoint
  );

  return handleResponse<T>(response);
}

/**
 * Make an authenticated PUT request
 */
export async function apiPut<T = any>(
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<T> {
  const response = await apiRequest(
    `${API_BASE_URL}${endpoint}`,
    {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    },
    endpoint
  );

  return handleResponse<T>(response);
}

/**
 * Make an authenticated PATCH request to a specific base URL
 */
export async function apiPatchTo<T = any>(
  baseUrl: string,
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<T> {
  const response = await apiRequest(
    joinUrl(baseUrl, endpoint),
    {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    },
    endpoint
  );

  return handleResponse<T>(response);
}

/**
 * Make an authenticated PATCH request
 */
export async function apiPatch<T = any>(
  endpoint: string,
  data?: any,
  options?: RequestInit
): Promise<T> {
  const response = await apiRequest(
    `${API_BASE_URL}${endpoint}`,
    {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    },
    endpoint
  );

  return handleResponse<T>(response);
}

/**
 * Make an authenticated DELETE request
 */
export async function apiDelete<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await apiRequest(
    `${API_BASE_URL}${endpoint}`,
    { method: "DELETE", ...options },
    endpoint
  );

  return handleResponse<T>(response);
}

/**
 * Upload file with form data
 */
export async function apiUpload<T = any>(
  endpoint: string,
  formData: FormData,
  options?: RequestInit
): Promise<T> {
  const response = await apiRequest(
    `${API_BASE_URL}${endpoint}`,
    { method: "POST", body: formData, ...options },
    endpoint
  );

  return handleResponse<T>(response);
}

/**
 * Upload file with form data to a specific base URL
 */
export async function apiUploadTo<T = any>(
  baseUrl: string,
  endpoint: string,
  formData: FormData,
  options?: RequestInit
): Promise<T> {
  const response = await apiRequest(
    joinUrl(baseUrl, endpoint),
    { method: "POST", body: formData, ...options },
    endpoint
  );

  return handleResponse<T>(response);
}

/**
 * Upload file with form data using PUT
 */
export async function apiUploadPut<T = any>(
  endpoint: string,
  formData: FormData,
  options?: RequestInit
): Promise<T> {
  const response = await apiRequest(
    `${API_BASE_URL}${endpoint}`,
    { method: "PUT", body: formData, ...options },
    endpoint
  );

  return handleResponse<T>(response);
}

/**
 * Upload file with form data using PUT to a specific base URL
 */
export async function apiUploadPutTo<T = any>(
  baseUrl: string,
  endpoint: string,
  formData: FormData,
  options?: RequestInit
): Promise<T> {
  const response = await apiRequest(
    joinUrl(baseUrl, endpoint),
    { method: "PUT", body: formData, ...options },
    endpoint
  );

  return handleResponse<T>(response);
}

/**
 * Make a request with custom method
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await apiRequest(`${API_BASE_URL}${endpoint}`, options ?? {}, endpoint);

  return handleResponse<T>(response);
}

// Export API base URL for reference
export { API_BASE_URL };
