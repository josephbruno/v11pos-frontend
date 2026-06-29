import React, { createContext, useContext, useState, useEffect } from "react";
import { BackendCustomer } from "@shared/api";
import { requestCustomerOTP, verifyCustomerOTP, refreshCustomerToken, getCustomerProfile } from "../lib/apiServices";

interface CustomerAuthContextType {
  customer: BackendCustomer | null;
  requestOTP: (email: string, restaurantId: string) => Promise<boolean>;
  verifyOTP: (email: string, restaurantId: string, otp: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  getAuthToken: () => string | null;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<BackendCustomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedCustomer = localStorage.getItem("pos-customer");
      const storedToken = localStorage.getItem("pos-customer-token");

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      if (storedCustomer) {
        try {
          setCustomer(JSON.parse(storedCustomer));
        } catch {
          localStorage.removeItem("pos-customer");
        }
      }

      try {
        const meResponse = await getCustomerProfile();
        if (meResponse?.data) {
          setCustomer(meResponse.data);
          localStorage.setItem("pos-customer", JSON.stringify(meResponse.data));
        }
      } catch (error: any) {
        if (error?.status === 401) {
          const storedRefreshToken = localStorage.getItem("pos-customer-refresh-token");
          if (storedRefreshToken) {
            try {
              const refreshResponse = await refreshCustomerToken(storedRefreshToken);
              const refreshData = (refreshResponse as any)?.data ?? refreshResponse;
              if (refreshData?.access_token) {
                localStorage.setItem("pos-customer-token", refreshData.access_token);
                if (refreshData.refresh_token) {
                  localStorage.setItem("pos-customer-refresh-token", refreshData.refresh_token);
                }
                const meRetry = await getCustomerProfile();
                if (meRetry?.data) {
                  setCustomer(meRetry.data);
                  localStorage.setItem("pos-customer", JSON.stringify(meRetry.data));
                }
              }
            } catch {
              localStorage.removeItem("pos-customer");
              localStorage.removeItem("pos-customer-token");
              localStorage.removeItem("pos-customer-refresh-token");
            }
          } else {
            localStorage.removeItem("pos-customer");
            localStorage.removeItem("pos-customer-token");
          }
        } else {
          console.error("Failed to fetch customer profile:", error);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const requestOTP = async (email: string, restaurantId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await requestCustomerOTP(email, restaurantId);
      setIsLoading(false);
      return !!response; // If it doesn't throw, it's successful
    } catch (error) {
      console.error("OTP request error:", error);
      setIsLoading(false);
      return false;
    }
  };

  const verifyOTP = async (email: string, restaurantId: string, otp: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await verifyCustomerOTP(email, restaurantId, otp);
      const data = response as any;
      const payload = data?.data ?? data;

      if (!payload?.access_token) {
        setIsLoading(false);
        return false;
      }

      localStorage.setItem("pos-customer-token", payload.access_token);
      if (payload.refresh_token) {
        localStorage.setItem("pos-customer-refresh-token", payload.refresh_token);
      }

      if (payload.customer) {
        setCustomer(payload.customer);
        localStorage.setItem("pos-customer", JSON.stringify(payload.customer));
      }

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("OTP verification error:", error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setCustomer(null);
    localStorage.removeItem("pos-customer");
    localStorage.removeItem("pos-customer-token");
    localStorage.removeItem("pos-customer-refresh-token");
  };

  const getAuthToken = (): string | null => {
    return localStorage.getItem("pos-customer-token");
  };

  return (
    <CustomerAuthContext.Provider value={{ customer, requestOTP, verifyOTP, logout, isLoading, getAuthToken }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  }
  return context;
}
