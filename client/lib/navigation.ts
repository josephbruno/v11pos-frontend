import {
    LayoutDashboard,
    ShoppingCart,
    BarChart3,
    Settings,
    Users,
    Package,
    ChefHat,
    FileText,
    Heart,
    Monitor,
    QrCode,
    Calendar,
    Building2,
    Layers3,
    GitBranch,
    Database,
    Workflow,
    Network,
    Shield,
    Globe,
} from "lucide-react";

export type UserRole = "super_admin" | "admin" | "supervisor" | "user";

export interface NavItem {
    name: string;
    href: string;
    icon: any;
    description: string;
    roles: UserRole[];
    category?: string;
}

export const navigationConfig: NavItem[] = [
    // Super Admin Specific
    {
        name: "System Overview",
        href: "/super-admin",
        icon: LayoutDashboard,
        description: "System Health & Metrics",
        roles: ["super_admin"],
        category: "overview",
    },
    {
        name: "Organization Tree",
        href: "/super-admin/organizations",
        icon: Building2,
        description: "Multi-tenant Management",
        roles: ["super_admin"],
        category: "organizations",
    },
    {
        name: "Category Builder",
        href: "/super-admin/categories",
        icon: Layers3,
        description: "Data Classification System",
        roles: ["super_admin"],
        category: "configuration",
    },
    {
        name: "Branch Configuration",
        href: "/super-admin/branches",
        icon: GitBranch,
        description: "Data Flow & Routing",
        roles: ["super_admin"],
        category: "configuration",
    },
    {
        name: "Data Migration",
        href: "/super-admin/migration",
        icon: Database,
        description: "Transfer & Sync Systems",
        roles: ["super_admin"],
        category: "data",
    },
    {
        name: "Workflow Builder",
        href: "/super-admin/workflows",
        icon: Workflow,
        description: "Process Automation",
        roles: ["super_admin"],
        category: "automation",
    },
    {
        name: "Global Analytics",
        href: "/super-admin/analytics",
        icon: BarChart3,
        description: "Cross-System Reports",
        roles: ["super_admin"],
        category: "insights",
    },
    {
        name: "Network Config",
        href: "/super-admin/network",
        icon: Network,
        description: "API & Integrations",
        roles: ["super_admin"],
        category: "technical",
    },
    {
        name: "Security Center",
        href: "/super-admin/security",
        icon: Shield,
        description: "Access & Permissions",
        roles: ["super_admin"],
        category: "security",
    },
    {
        name: "Global Settings",
        href: "/super-admin/settings",
        icon: Settings,
        description: "System Configuration",
        roles: ["super_admin"],
        category: "settings",
    },

    // Regular Admin, Supervisor, User
    {
        name: "Dashboard",
        href: "/",
        icon: LayoutDashboard,
        description: "Overview & Quick Stats",
        roles: ["admin", "supervisor", "user"],
    },
    {
        name: "Order Terminal",
        href: "/order",
        icon: ShoppingCart,
        description: "POS & Billing",
        roles: ["admin", "supervisor", "user"],
    },
    {
        name: "Kitchen Queue",
        href: "/queue",
        icon: Monitor,
        description: "Live Order Queue",
        roles: ["admin", "supervisor", "user"],
    },
    {
        name: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        description: "Reports & Insights",
        roles: ["admin", "supervisor"],
    },
    {
        name: "Reports",
        href: "/reports",
        icon: FileText,
        description: "Business Analytics",
        roles: ["admin", "supervisor"],
    },
    {
        name: "Products",
        href: "/products",
        icon: Package,
        description: "Menu & Inventory",
        roles: ["admin", "supervisor"],
    },
    {
        name: "Combos",
        href: "/combos",
        icon: ChefHat,
        description: "Combo Products",
        roles: ["admin", "supervisor"],
    },
    {
        name: "Tax Rules",
        href: "/tax",
        icon: FileText,
        description: "Tax Configuration",
        roles: ["admin"],
    },
    {
        name: "Customers",
        href: "/customers",
        icon: Heart,
        description: "Customer & Loyalty",
        roles: ["admin", "supervisor"],
    },
    {
        name: "QR Orders",
        href: "/qr-management",
        icon: QrCode,
        description: "QR Code & Tables",
        roles: ["admin", "supervisor"],
    },
    {
        name: "Table Booking",
        href: "/table-booking",
        icon: Calendar,
        description: "Reservations & Tables",
        roles: ["admin", "supervisor", "user"],
    },
    {
        name: "Users",
        href: "/users",
        icon: Users,
        description: "Staff & Roles",
        roles: ["admin"],
    },
    {
        name: "Settings",
        href: "/settings",
        icon: Settings,
        description: "Configuration",
        roles: ["admin"],
    },
];

export const getNavigationForRole = (role: UserRole) => {
    return navigationConfig.filter((item) => item.roles.includes(role));
};
