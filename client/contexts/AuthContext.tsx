import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "manager" | "staff" | "cashier";
  avatar?: string;
  phone?: string;
  status?: string;
  permissions?: string[];
  join_date?: string;
  created_at?: string;
  updated_at?: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth on app load
    const storedUser = localStorage.getItem("restaurant-pos-user");
    const storedToken = localStorage.getItem("restaurant-pos-token");
    
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      // Create form data for OAuth2 standard
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        setIsLoading(false);
        return false;
      }

      const data: LoginResponse = await response.json();

      // Store user and token
      setUser(data.user);
      localStorage.setItem("restaurant-pos-user", JSON.stringify(data.user));
      localStorage.setItem("restaurant-pos-token", data.access_token);
      localStorage.setItem("restaurant-pos-token-type", data.token_type);
      localStorage.setItem("restaurant-pos-token-expires", String(Date.now() + data.expires_in * 60 * 1000));

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
