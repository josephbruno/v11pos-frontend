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
    ClipboardCheck,
    ArrowRightLeft,
    Calendar,
    Building2,
    Layers3,
    GitBranch,
    Database,
    Globe,
    LayoutGrid,
    CreditCard,
    Receipt,
    ClipboardList,
} from "lucide-react";

export type UserRole = "super_admin" | "admin" | "supervisor" | "user" | "cashier" | "waiter" | "mobile-kds" | "kitchen-kds" | "kiosk-machine";

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
        name: "Global Analytics",
        href: "/super-admin",
        icon: BarChart3,
        description: "Restaurants & Users Overview",
        roles: ["super_admin"],
        category: "overview",
    },
    {
        name: "Restaurant",
        href: "/super-admin/organizations",
        icon: Building2,
        description: "Restaurant Management",
        roles: ["super_admin"],
        category: "organizations",
    },
    {
        name: "Subscription Plans",
        href: "/super-admin/subscription-plans",
        icon: CreditCard,
        description: "SaaS plan management",
        roles: ["super_admin"],
        category: "organizations",
    },
    {
        name: "Users",
        href: "/super-admin/users",
        icon: Users,
        description: "User & Role Management",
        roles: ["super_admin"],
        category: "configuration",
    },
    {
        name: "Category",
        href: "/super-admin/categories",
        icon: Layers3,
        description: "Category Management",
        roles: ["super_admin"],
        category: "configuration",
    },
    {
        name: "Product",
        href: "/super-admin/products?tab=products",
        icon: Package,
        description: "Product Management",
        roles: ["super_admin"],
        category: "configuration",
    },
    {
        name: "Modifiers",
        href: "/super-admin/products?tab=modifiers",
        icon: FileText,
        description: "Modifier Management",
        roles: ["super_admin"],
        category: "configuration",
    },
    {
        name: "Modifier Options",
        href: "/super-admin/modifier-options",
        icon: GitBranch,
        description: "Option Management",
        roles: ["super_admin"],
        category: "configuration",
    },
    {
        name: "Combo Product",
        href: "/super-admin/combos",
        icon: ChefHat,
        description: "Combo Product Management",
        roles: ["super_admin"],
        category: "configuration",
    },
    {
        name: "Tables",
        href: "/super-admin/tables",
        icon: Calendar,
        description: "Table Management",
        roles: ["super_admin"],
        category: "configuration",
    },
    {
        name: "Home Banners",
        href: "/super-admin/homebanners",
        icon: Globe,
        description: "Homepage Banner Management",
        roles: ["super_admin"],
        category: "configuration",
    },
    {
        name: "Row Management",
        href: "/super-admin/row-management",
        icon: LayoutGrid,
        description: "Homepage Rows & Sections",
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

    // Restaurant admin, supervisor, and staff
    {
        name: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        description: "Overview & Quick Stats",
        roles: ["admin", "supervisor", "user", "cashier", "waiter"],
        category: "overview",
    },
    {
        name: "Analytics",
        href: "/admin/analytics",
        icon: BarChart3,
        description: "Reports & Insights",
        roles: ["admin", "supervisor"],
        category: "overview",
    },
    {
        name: "Reports",
        href: "/admin/reports",
        icon: FileText,
        description: "Business Analytics",
        roles: ["admin", "supervisor"],
        category: "overview",
    },
    {
        name: "Order Terminal",
        href: "/admin/order",
        icon: ShoppingCart,
        description: "POS & Billing",
        roles: ["admin", "supervisor", "user", "cashier", "waiter", "kiosk-machine"],
        category: "operations",
    },
    {
        name: "Orders",
        href: "/admin/orders",
        icon: ClipboardList,
        description: "View & manage orders",
        roles: ["admin", "supervisor", "user", "cashier", "waiter"],
        category: "operations",
    },
    {
        name: "Kitchen Queue",
        href: "/admin/queue",
        icon: Monitor,
        description: "Live Order Queue",
        roles: ["admin", "supervisor", "user", "cashier", "waiter", "mobile-kds", "kitchen-kds"],
        category: "operations",
    },
    {
        name: "Kitchen Display",
        href: "/admin/kds",
        icon: ChefHat,
        description: "KDS stations & KOT",
        roles: ["admin", "supervisor", "user", "mobile-kds", "kitchen-kds"],
        category: "operations",
    },
    {
        name: "Category",
        href: "/admin/categories",
        icon: Layers3,
        description: "Category Management",
        roles: ["admin"],
        category: "configuration",
    },
    {
        name: "Product",
        href: "/admin/products",
        icon: Package,
        description: "Product Management",
        roles: ["admin", "supervisor"],
        category: "configuration",
    },
    {
        name: "Modifiers",
        href: "/admin/products?tab=modifiers",
        icon: FileText,
        description: "Modifier Management",
        roles: ["admin", "supervisor"],
        category: "configuration",
    },
    {
        name: "Modifier Options",
        href: "/admin/modifier-options",
        icon: GitBranch,
        description: "Option Management",
        roles: ["admin", "supervisor", "user"],
        category: "configuration",
    },
    {
        name: "Combo Product",
        href: "/admin/combos",
        icon: ChefHat,
        description: "Combo Product Management",
        roles: ["admin", "supervisor"],
        category: "configuration",
    },
    {
        name: "Customers",
        href: "/admin/customers",
        icon: Heart,
        description: "Customer & Loyalty",
        roles: ["admin", "supervisor"],
        category: "configuration",
    },
    {
        name: "Home Banners",
        href: "/admin/homebanners",
        icon: Globe,
        description: "Homepage Banner Management",
        roles: ["admin", "supervisor"],
        category: "configuration",
    },
    {
        name: "Row Management",
        href: "/admin/row-management",
        icon: LayoutGrid,
        description: "Homepage Rows & Sections",
        roles: ["admin", "supervisor"],
        category: "configuration",
    },
    {
        name: "Tables",
        href: "/admin/tables",
        icon: Calendar,
        description: "Table Management",
        roles: ["admin", "supervisor"],
        category: "dining",
    },
    {
        name: "QR Order Approvals",
        href: "/admin/table-order-approvals",
        icon: ClipboardCheck,
        description: "Approve customer QR table orders",
        roles: ["admin", "supervisor", "user", "waiter", "cashier"],
        category: "dining",
    },
    {
        name: "Table Transfers",
        href: "/admin/table-transfers",
        icon: ArrowRightLeft,
        description: "Approve QR table transfer requests",
        roles: ["admin", "supervisor", "user", "waiter", "cashier"],
        category: "dining",
    },
    {
        name: "Table Booking",
        href: "/admin/table-booking",
        icon: Calendar,
        description: "Reservations & Tables",
        roles: ["admin", "supervisor", "user", "waiter"],
        category: "dining",
    },
    {
        name: "Users",
        href: "/admin/users",
        icon: Users,
        description: "User & Role Management",
        roles: ["admin"],
        category: "administration",
    },
    {
        name: "Settings",
        href: "/admin/settings",
        icon: Settings,
        description: "Restaurant Configuration",
        roles: ["admin"],
        category: "administration",
    },
    {
        name: "Billing",
        href: "/admin/billing",
        icon: Receipt,
        description: "Subscription & invoices",
        roles: ["admin"],
        category: "administration",
    },
];

export const adminNavCategoryOrder = [
    "overview",
    "operations",
    "configuration",
    "dining",
    "administration",
] as const;

export const adminNavCategoryLabels: Record<string, string> = {
    overview: "Overview",
    operations: "Operations",
    configuration: "Configuration",
    dining: "Tables & Dining",
    administration: "Administration",
};

export const getNavigationForRole = (role: UserRole) => {
    return navigationConfig.filter((item) => item.roles.includes(role));
};

export const groupNavigationByCategory = (items: NavItem[]) => {
    return items.reduce(
        (acc, item) => {
            const category = item.category || "other";
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(item);
            return acc;
        },
        {} as Record<string, NavItem[]>,
    );
};
