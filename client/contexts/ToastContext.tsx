import React, { createContext, useContext, useState } from "react";
import { AlertCircle, CheckCircle, Info, X, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration
    const timeoutId = setTimeout(() => {
      removeToast(id);
    }, toast.duration || 5000);

    // Store timeout ID to clear it if needed
    return timeoutId;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const getIcon = (type: Toast["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "info":
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = (type: Toast["type"]) => {
    switch (type) {
      case "success":
        return "bg-green-600 border-green-700 text-white";
      case "error":
        return "bg-red-600 border-red-700 text-white";
      case "warning":
        return "bg-amber-500 border-amber-600 text-black";
      case "info":
        return "bg-blue-600 border-blue-700 text-white";
      default:
        return "bg-blue-600 border-blue-700 text-white";
    }
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-in slide-in-from-right-full duration-300 p-4 rounded-lg border shadow-lg ${getBackgroundColor(
              toast.type,
            )}`}
          >
            <div className="flex items-start space-x-3">
              {getIcon(toast.type)}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium">
                  {toast.title}
                </h4>
                {toast.description && (
                  <p className="text-sm mt-1 opacity-90">
                    {toast.description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-black/10"
                onClick={() => removeToast(toast.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
