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
import { CustomerAuthProvider } from "./contexts/CustomerAuthContext";
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
import Migration from "./pages/Migration";
import GlobalAnalytics from "./pages/GlobalAnalytics";
import KitchenDisplay from "./pages/KitchenDisplay";
import StaffManagement from "./pages/StaffManagement";
import InventoryManagement from "./pages/InventoryManagement";
import { CustomerAppRedirect } from "./components/CustomerAppRedirect";
import TableBooking from "./pages/TableBooking";
import ProductManagement from "./pages/ProductManagement";
import ModifierOptionsManagement from "./pages/ModifierOptionsManagement";
import ComboManagement from "./pages/ComboManagement";
import CustomerManagement from "./pages/CustomerManagement";
import QRManagement from "./pages/QRManagement";
import TableTransferApprovals from "./pages/TableTransferApprovals";
import TableOrderApprovals from "./pages/TableOrderApprovals";
import UserManagement from "./pages/UserManagement";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import SubscriptionGuard from "./components/SubscriptionGuard";
import HomebannerManagement from "./pages/HomebannerManagement";
import RowManagementPage from "./pages/RowManagement";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function getRoleBasePath(role?: string) {
  const normalized = String(role || "").toLowerCase().trim();
  if (normalized === "super_admin") return "/super-admin";
  if (normalized === "mobile-kds" || normalized === "kitchen-kds") return "/admin/kds";
  if (normalized === "kiosk-machine") return "/admin/order";
  return "/admin";
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

  const inner =
    user?.role === "admin" ? <SubscriptionGuard>{children}</SubscriptionGuard> : children;

  return <Layout>{inner}</Layout>;
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
        {/* Legacy QR routes → customer app (client-frontend) */}
        <Route path="/qr-menu/:tableToken" element={<CustomerAppRedirect path="/order" />} />
        <Route path="/qr-menu/:tableToken/menu" element={<CustomerAppRedirect path="/order" />} />
        <Route path="/qr-checkout/:tableToken" element={<CustomerAppRedirect path="/order" />} />
        <Route path="/qr-order/:orderId/track" element={<CustomerAppRedirect path="/orders" />} />
        <Route path="/book-table" element={<CustomerAppRedirect path="/tables" />} />
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
            <RoleProtectedRoute allowedRoles={["admin", "supervisor", "user", "cashier", "waiter"]}>
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
                <GlobalAnalytics />
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
          path="/super-admin/homebanners"
          element={
            <RoleProtectedRoute allowedRoles={["super_admin"]}>
              <LayoutWrapper>
                <HomebannerManagement />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/super-admin/row-management"
          element={
            <RoleProtectedRoute allowedRoles={["super_admin"]}>
              <LayoutWrapper>
                <RowManagementPage />
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
          path="/super-admin/subscription-plans"
          element={
            <RoleProtectedRoute allowedRoles={["super_admin"]}>
              <LayoutWrapper>
                <SubscriptionPlans />
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
          path="/super-admin/analytics"
          element={
            <RoleProtectedRoute allowedRoles={["super_admin"]}>
              <LayoutWrapper>
                <GlobalAnalytics />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />

        {/* Admin scoped routes */}
        <Route
          path="/admin/order"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "supervisor", "user", "cashier", "waiter", "kiosk-machine"]}>
              <LayoutWrapper>
                <OrderPanel />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/queue"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "supervisor", "user", "cashier", "waiter", "mobile-kds", "kitchen-kds"]}>
              <LayoutWrapper>
                <OrderQueue />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/kds"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "supervisor", "user", "mobile-kds", "kitchen-kds"]}>
              <LayoutWrapper>
                <KitchenDisplay />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/staff"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "supervisor"]}>
              <LayoutWrapper>
                <StaffManagement />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "supervisor"]}>
              <LayoutWrapper>
                <InventoryManagement />
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
          path="/admin/homebanners"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "supervisor"]}>
              <LayoutWrapper>
                <HomebannerManagement />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/row-management"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "supervisor"]}>
              <LayoutWrapper>
                <RowManagementPage />
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
            <RoleProtectedRoute allowedRoles={["admin", "supervisor", "user", "waiter"]}>
              <LayoutWrapper>
                <TableBooking />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/table-transfers"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "supervisor", "user", "waiter", "cashier"]}>
              <LayoutWrapper>
                <TableTransferApprovals />
              </LayoutWrapper>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/admin/table-order-approvals"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "supervisor", "user", "waiter", "cashier"]}>
              <LayoutWrapper>
                <TableOrderApprovals />
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
        <Route
          path="/admin/billing"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <LayoutWrapper>
                <Billing />
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
          path="/homebanners"
          element={
            <ProtectedRoute>
              <RolePreservingRedirect suffix="/homebanners" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/row-management"
          element={
            <ProtectedRoute>
              <RolePreservingRedirect suffix="/row-management" />
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
          <CustomerAuthProvider>
            <ToastProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </TooltipProvider>
            </ToastProvider>
          </CustomerAuthProvider>
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
