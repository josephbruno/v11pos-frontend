import React, { createContext, useContext, useState, useEffect } from "react";

import { User, LoginResponse, LoginRequest } from "@shared/api";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  getAuthToken: () => string | null;
  isTokenExpired: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
const DEFAULT_TOKEN_TTL_MS = 15 * 60 * 1000;

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

function normalizeTokenType(tokenType?: string): string {
  if (!tokenType) return "Bearer";
  if (tokenType.toLowerCase() === "bearer") return "Bearer";
  return tokenType;
}

function normalizeUserRole(role?: string): User["role"] {
  const normalizedRole = (role || "").toLowerCase().trim();
  if (normalizedRole === "superadmin" || normalizedRole === "super_admin") {
    return "super_admin";
  }
  if (normalizedRole === "admin") return "admin";
  if (normalizedRole === "supervisor") return "supervisor";
  return "user";
}

function normalizeUser(rawUser: any): User {
  return {
    ...rawUser,
    id: rawUser?.id || "",
    name: rawUser?.name || rawUser?.full_name || rawUser?.username || rawUser?.email || "User",
    email: rawUser?.email || "",
    role: normalizeUserRole(rawUser?.role),
    avatar: rawUser?.avatar ?? null,
    join_date: rawUser?.join_date || rawUser?.created_at,
    branchId: rawUser?.branchId || rawUser?.branch_id || rawUser?.restaurant_id || undefined,
  } as User;
}

async function fetchCurrentUser(token: string, tokenType: string): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        Authorization: `${normalizeTokenType(tokenType)} ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json();
    return normalizeUser(payload?.data ?? payload);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // Check for stored auth on app load
      const storedUser = localStorage.getItem("restaurant-pos-user");
      const storedToken = localStorage.getItem("restaurant-pos-token");
      const storedTokenType = localStorage.getItem("restaurant-pos-token-type") || "Bearer";

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      if (storedUser) {
        try {
          const parsedUser = normalizeUser(JSON.parse(storedUser));
          setUser(parsedUser);
          localStorage.setItem("restaurant-pos-user", JSON.stringify(parsedUser));
          setIsLoading(false);
          return;
        } catch {
          localStorage.removeItem("restaurant-pos-user");
        }
      }

      const me = await fetchCurrentUser(storedToken, storedTokenType);
      if (me) {
        setUser(me);
        localStorage.setItem("restaurant-pos-user", JSON.stringify(me));
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const loginRequest: LoginRequest = { email, password };
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginRequest),
      });

      if (!response.ok) {
        setIsLoading(false);
        return false;
      }

      const payload = await response.json();
      const loginData: Partial<LoginResponse> = payload?.data ?? payload;

      if (!loginData.access_token) {
        setIsLoading(false);
        return false;
      }

      const tokenType = normalizeTokenType(loginData.token_type);
      const expiresInMs = loginData.expires_in
        ? loginData.expires_in * 60 * 1000
        : (parseJwtExpiryMs(loginData.access_token) ?? (Date.now() + DEFAULT_TOKEN_TTL_MS)) - Date.now();
      const expiresAt = Date.now() + Math.max(expiresInMs, 60 * 1000);

      localStorage.setItem("restaurant-pos-token", loginData.access_token);
      localStorage.setItem("restaurant-pos-token-type", tokenType);
      localStorage.setItem("restaurant-pos-token-expires", String(expiresAt));
      if (loginData.refresh_token) {
        localStorage.setItem("restaurant-pos-refresh-token", loginData.refresh_token);
      }

      const nextUser =
        (loginData.user ? normalizeUser(loginData.user) : null) ??
        (await fetchCurrentUser(loginData.access_token, tokenType));

      if (!nextUser) {
        setIsLoading(false);
        return false;
      }

      setUser(nextUser);
      localStorage.setItem("restaurant-pos-user", JSON.stringify(nextUser));

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("restaurant-pos-user");
    localStorage.removeItem("restaurant-pos-token");
    localStorage.removeItem("restaurant-pos-refresh-token");
    localStorage.removeItem("restaurant-pos-token-type");
    localStorage.removeItem("restaurant-pos-token-expires");
  };

  const getAuthToken = (): string | null => {
    return localStorage.getItem("restaurant-pos-token");
  };

  const isTokenExpired = (): boolean => {
    const expiresAt = localStorage.getItem("restaurant-pos-token-expires");
    if (!expiresAt) return true;
    return Date.now() >= parseInt(expiresAt);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, getAuthToken, isTokenExpired }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
