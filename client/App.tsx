import "./global.css";

// Suppress Recharts defaultProps warnings in development
if (import.meta.env.DEV) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const fullMessage = args.join(" ");

    // Suppress Recharts defaultProps warnings
    // These warnings come from React about deprecated defaultProps usage
    const isRechartsWarning =
      fullMessage.includes("Support for defaultProps will be removed") ||
      fullMessage.includes(
        "defaultProps will be removed from function components",
      ) ||
      (fullMessage.includes("Warning") &&
        fullMessage.includes("defaultProps") &&
        (fullMessage.includes("XAxis") ||
          fullMessage.includes("YAxis") ||
          fullMessage.includes("CartesianGrid") ||
          fullMessage.includes("Tooltip") ||
          fullMessage.includes("Legend") ||
          fullMessage.includes("Bar") ||
          fullMessage.includes("Line") ||
          fullMessage.includes("Area") ||
          fullMessage.includes("Pie") ||
          fullMessage.includes("Cell") ||
          fullMessage.includes("ResponsiveContainer") ||
          fullMessage.includes("BarChart") ||
          fullMessage.includes("LineChart") ||
          fullMessage.includes("AreaChart") ||
          fullMessage.includes("PieChart") ||
          fullMessage.includes("recharts")));

    if (isRechartsWarning) {
      return;
    }

    originalWarn.apply(console, args);
  };
}

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { UserRole } from "./lib/navigation";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./contexts/ToastContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Layout from "./components/Layout";
import SuperAdminLayout from "./components/SuperAdminLayout";
import Dashboard from "./pages/Dashboard";
import OrderPanel from "./pages/OrderPanel";
import OrderQueue from "./pages/OrderQueue";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import CategoryConfiguration from "./pages/CategoryConfiguration";
import Organizations from "./pages/Organizations";
import Branches from "./pages/Branches";
import Migration from "./pages/Migration";
import Workflows from "./pages/Workflows";
import GlobalAnalytics from "./pages/GlobalAnalytics";
import Network from "./pages/Network";
import Security from "./pages/Security";
import SuperAdminSettings from "./pages/SuperAdminSettings";
import TableBooking from "./pages/TableBooking";
import CustomerBooking from "./pages/CustomerBooking";
import ProductManagement from "./pages/ProductManagement";
import ModifierOptionsManagement from "./pages/ModifierOptionsManagement";
import ComboManagement from "./pages/ComboManagement";
import TaxManagement from "./pages/TaxManagement";
import CustomerManagement from "./pages/CustomerManagement";
import QRManagement from "./pages/QRManagement";
import CustomerMenu from "./pages/CustomerMenu";
import QRMenuLanding from "./pages/QRMenuLanding";
import QRCheckout from "./pages/QRCheckout";
import OrderTracking from "./pages/OrderTracking";
import UserManagement from "./pages/UserManagement";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function getRoleBasePath(role?: string) {
  const normalized = String(role || "").toLowerCase().trim();
  return normalized === "super_admin" ? "/super-admin" : "/admin";
}

function RolePreservingRedirect({ suffix }: { suffix?: string }) {
  const { user } = useAuth();
  const location = useLocation();
  const base = getRoleBasePath(user?.role);
  const normalizedSuffix = suffix
    ? suffix.startsWith("/")
      ? suffix
      : `/${suffix}`
    : "";

  return (
    <Navigate to={`${base}${normalizedSuffix}${location.search}${location.hash}`} replace />
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pos-accent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function RoleProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pos-accent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role as UserRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Use SuperAdminLayout for super_admin role, regular Layout for others
  if (user?.role === "super_admin") {
    return <SuperAdminLayout>{children}</SuperAdminLayout>;
  }

  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user } = useAuth();
  const defaultAppPath = getRoleBasePath(user?.role);

  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to={defaultAppPath} replace /> : <Login />}
        />
        <Route
          path="/forgot-password"
          element={user ? <Navigate to={defaultAppPath} replace /> : <ForgotPassword />}
        />
        {/* Public QR Menu Routes */}
        <Route path="/qr-menu/:tableToken" element={<QRMenuLanding />} />
        <Route path="/qr-menu/:tableToken/menu" element={<CustomerMenu />} />
        <Route path="/qr-checkout/:tableToken" element={<QRCheckout />} />
        <Route path="/qr-order/:orderId/track" element={<OrderTracking />} />
        <Route path="/book-table" element={<CustomerBooking />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RolePreservingRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "supervisor", "user"]}>
              <LayoutWrapper>
                <Dashboard />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/super-admin"
          element={
            <RoleProtectedRoute allowedRoles={["super_admin"]}>
              <LayoutWrapper>
                <Dashboard />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/super-admin/categories"
          element={
            <RoleProtectedRoute allowedRoles={["super_admin"]}>
              <LayoutWrapper>
                <CategoryConfiguration />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/super-admin/products"
          element={
            <RoleProtectedRoute allowedRoles={["super_admin"]}>
              <LayoutWrapper>
                <ProductManagement />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/super-admin/modifier-options"
          element={
            <RoleProtectedRoute allowedRoles={["super_admin"]}>
              <LayoutWrapper>
                <ModifierOptionsManagement />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/super-admin/combos"
          element={
            <RoleProtectedRoute allowedRoles={["super_admin"]}>
              <LayoutWrapper>
                <ComboManagement />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/super-admin/tables"
          element={
            <RoleProtectedRoute allowedRoles={["super_admin"]}>
              <LayoutWrapper>
                <QRManagement />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/super-admin/users"
          element={
            <RoleProtectedRoute allowedRoles={["super_admin"]}>
              <LayoutWrapper>
                <UserManagement />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/super-admin/organizations"
          element={
            <RoleProtectedRoute allowedRoles={["super_admin"]}>
              <LayoutWrapper>
                <Organizations />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/super-admin/branches"
          element={
            <RoleProtectedRoute allowedRoles={["super_admin"]}>
              <LayoutWrapper>
                <Branches />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/super-admin/migration"
          element={
            <RoleProtectedRoute allowedRoles={["super_admin"]}>
              <LayoutWrapper>
                <Migration />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/super-admin/workflows"
          element={
            <RoleProtectedRoute allowedRoles={["super_admin"]}>
              <LayoutWrapper>
                <Workflows />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/super-admin/analytics"
          element={
            <RoleProtectedRoute allowedRoles={["super_admin"]}>
              <LayoutWrapper>
                <GlobalAnalytics />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/super-admin/network"
          element={
            <RoleProtectedRoute allowedRoles={["super_admin"]}>
              <LayoutWrapper>
                <Network />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/super-admin/security"
          element={
            <RoleProtectedRoute allowedRoles={["super_admin"]}>
              <LayoutWrapper>
                <Security />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/super-admin/settings"
          element={
            <RoleProtectedRoute allowedRoles={["super_admin"]}>
              <LayoutWrapper>
                <SuperAdminSettings />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />

        {/* Admin scoped routes */}
        <Route
          path="/admin/order"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "supervisor", "user"]}>
              <LayoutWrapper>
                <OrderPanel />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/queue"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "supervisor", "user"]}>
              <LayoutWrapper>
                <OrderQueue />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "supervisor"]}>
              <LayoutWrapper>
                <Analytics />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "supervisor"]}>
              <LayoutWrapper>
                <Reports />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <LayoutWrapper>
                <CategoryConfiguration />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "supervisor"]}>
              <LayoutWrapper>
                <ProductManagement />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/modifier-options"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "supervisor", "user"]}>
              <LayoutWrapper>
                <ModifierOptionsManagement />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/combos"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "supervisor"]}>
              <LayoutWrapper>
                <ComboManagement />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/tax"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <LayoutWrapper>
                <TaxManagement />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "supervisor"]}>
              <LayoutWrapper>
                <CustomerManagement />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/qr-management"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "supervisor"]}>
              <LayoutWrapper>
                <QRManagement />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/tables"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "supervisor"]}>
              <LayoutWrapper>
                <QRManagement />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/table-booking"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "supervisor", "user"]}>
              <LayoutWrapper>
                <TableBooking />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <LayoutWrapper>
                <UserManagement />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <LayoutWrapper>
                <Settings />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />

        {/* Extra super-admin scoped routes for common pages */}
        <Route
          path="/super-admin/order"
          element={
            <RoleProtectedRoute allowedRoles={["super_admin"]}>
              <LayoutWrapper>
                <OrderPanel />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/super-admin/queue"
          element={
            <RoleProtectedRoute allowedRoles={["super_admin"]}>
              <LayoutWrapper>
                <OrderQueue />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/super-admin/reports"
          element={
            <RoleProtectedRoute allowedRoles={["super_admin"]}>
              <LayoutWrapper>
                <Reports />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/super-admin/tax"
          element={
            <RoleProtectedRoute allowedRoles={["super_admin"]}>
              <LayoutWrapper>
                <TaxManagement />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/super-admin/customers"
          element={
            <RoleProtectedRoute allowedRoles={["super_admin"]}>
              <LayoutWrapper>
                <CustomerManagement />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/super-admin/qr-management"
          element={
            <RoleProtectedRoute allowedRoles={["super_admin"]}>
              <LayoutWrapper>
                <QRManagement />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/super-admin/table-booking"
          element={
            <RoleProtectedRoute allowedRoles={["super_admin"]}>
              <LayoutWrapper>
                <TableBooking />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />

        {/* Legacy (unscoped) routes now redirect by role */}
        <Route
          path="/order"
          element={
            <ProtectedRoute>
              <RolePreservingRedirect suffix="/order" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/queue"
          element={
            <ProtectedRoute>
              <RolePreservingRedirect suffix="/queue" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <RolePreservingRedirect suffix="/analytics" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <RolePreservingRedirect suffix="/reports" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <RolePreservingRedirect suffix="/products" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/combos"
          element={
            <ProtectedRoute>
              <RolePreservingRedirect suffix="/combos" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tax"
          element={
            <ProtectedRoute>
              <RolePreservingRedirect suffix="/tax" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <RolePreservingRedirect suffix="/customers" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/qr-management"
          element={
            <ProtectedRoute>
              <RolePreservingRedirect suffix="/qr-management" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tables"
          element={
            <ProtectedRoute>
              <RolePreservingRedirect suffix="/tables" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/table-booking"
          element={
            <ProtectedRoute>
              <RolePreservingRedirect suffix="/table-booking" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <RolePreservingRedirect suffix="/users" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <RolePreservingRedirect suffix="/settings" />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppRoutes />
              </BrowserRouter>
            </TooltipProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

// Prevent multiple root creation during development hot reloads
const container = document.getElementById("root")!;
let root = (window as any).__reactRoot;

if (!root) {
  root = createRoot(container);
  (window as any).__reactRoot = root;
}

root.render(<App />);
