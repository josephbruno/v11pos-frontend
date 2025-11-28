// API utility functions for making authenticated requests

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

interface ApiError {
  message: string;
  status: number;
}

export class ApiException extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiException";
  }
}

/**
 * Get authorization headers with stored token
 */
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("restaurant-pos-token");
  const tokenType = localStorage.getItem("restaurant-pos-token-type") || "bearer";

  if (!token) {
    return {};
  }

  return {
    Authorization: `${tokenType} ${token}`,
  };
}

/**
 * Check if token is expired
 */
export function isTokenExpired(): boolean {
  const expiresAt = localStorage.getItem("restaurant-pos-token-expires");
  if (!expiresAt) return true;

  return Date.now() >= parseInt(expiresAt);
}

/**
 * Make an authenticated GET request
 */
export async function apiGet<T = any>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new ApiException(error.message || "Request failed", response.status);
  }

  return response.json();
}

/**
 * Make an authenticated POST request
 */
export async function apiPost<T = any>(endpoint: string, data: any): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new ApiException(error.message || "Request failed", response.status);
  }

  return response.json();
}

/**
 * Make an authenticated PUT request
 */
export async function apiPut<T = any>(endpoint: string, data: any): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new ApiException(error.message || "Request failed", response.status);
  }

  return response.json();
}

/**
 * Make an authenticated PATCH request
 */
export async function apiPatch<T = any>(endpoint: string, data: any): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new ApiException(error.message || "Request failed", response.status);
  }

  return response.json();
}

/**
 * Make an authenticated DELETE request
 */
export async function apiDelete<T = any>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new ApiException(error.message || "Request failed", response.status);
  }

  return response.json();
}

export { API_BASE_URL };
