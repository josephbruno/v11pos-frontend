/**
 * API Client for making authenticated requests to the backend
 * This file provides utilities for API communication with automatic token handling
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

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
export function getAuthToken(): string | null {
  return localStorage.getItem("restaurant-pos-token");
}

/**
 * Get the token type from localStorage
 */
export function getTokenType(): string {
  return localStorage.getItem("restaurant-pos-token-type") || "bearer";
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
 * Get authorization headers with stored token
 */
function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const tokenType = getTokenType();

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

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      // Clear stored auth data
      localStorage.removeItem("restaurant-pos-user");
      localStorage.removeItem("restaurant-pos-token");
      localStorage.removeItem("restaurant-pos-token-type");
      localStorage.removeItem("restaurant-pos-token-expires");
      
      // Redirect to login if not already there
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
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

  return response.json();
}

/**
 * Make an authenticated GET request
 */
export async function apiGet<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options?.headers,
    },
    ...options,
  });

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
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options?.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });

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
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options?.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });

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
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options?.headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    ...options,
  });

  return handleResponse<T>(response);
}

/**
 * Make an authenticated DELETE request
 */
export async function apiDelete<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options?.headers,
    },
    ...options,
  });

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
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      // Don't set Content-Type for FormData, browser will set it with boundary
      ...options?.headers,
    },
    body: formData,
    ...options,
  });

  return handleResponse<T>(response);
}

/**
 * Make a request with custom method
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options?.headers,
    },
    ...options,
  });

  return handleResponse<T>(response);
}

// Export API base URL for reference
export { API_BASE_URL };
