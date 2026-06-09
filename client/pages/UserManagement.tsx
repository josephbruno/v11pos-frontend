import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Users,
  Shield,
  Clock,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  MoreVertical,
  UserPlus,
  Key,
  Save,
  Eye,
  EyeOff,
  ShieldCheck,
  CalendarPlus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { validateFullName, validatePassword, validateUsername } from "@/lib/userValidation";
import {
  createUser,
  deleteUser,
  getMyRestaurants,
  getUsers,
  getUsersByRestaurant,
  updateUser,
  updateUserPassword,
} from "@/lib/apiServices";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  phone: string;
  restaurant: string;
  restaurantId?: string;
  role: "super_admin" | "admin" | "supervisor" | "user" | "cashier" | "waiter" | "mobile-kds" | "kitchen-kds" | "kiosk-machine";
  status: "active" | "inactive" | "suspended";
  joinDate: string;
  lastLogin: string;
  avatar?: string;
  permissions: string[];
  shifts: ShiftSchedule[];
  performance: {
    ordersHandled: number;
    avgOrderValue: number;
    customerRating: number;
    punctualityScore: number;
  };
}

interface ShiftSchedule {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  position: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

interface NewRole {
  name: string;
  description: string;
  permissions: string[];
}

interface NewSchedule {
  userId: string;
  day: string;
  startTime: string;
  endTime: string;
  position: string;
}

// Modal animation variants for center zoom
const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.75,
    y: 0,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 400,
    } as any,
  },
  exit: {
    opacity: 0,
    scale: 0.75,
    y: 0,
    transition: {
      duration: 0.2,
    } as any,
  },
};

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedRestaurant, setSelectedRestaurant] = useState("all");
  const [restaurantOptions, setRestaurantOptions] = useState<string[]>([]);
  const [restaurantChoices, setRestaurantChoices] = useState<Array<{ id: string; name: string }>>([]);
  const [apiUsers, setApiUsers] = useState<User[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [activeTab, setActiveTab] = useState("users");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [resetPasswordError, setResetPasswordError] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    user: User;
    checked: boolean;
  } | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [statusUpdatingUserId, setStatusUpdatingUserId] = useState<string | null>(null);
  const { addToast } = useToast();
  const { user: authUser } = useAuth();

  // Mock data
  const roles: Role[] = [
    {
      id: "super_admin",
      name: "Super Administrator",
      description: "Global system access and multi-tenant management",
      permissions: [
        "manage_organizations",
        "manage_branches",
        "system_configuration",
        "data_migration",
        "global_analytics",
      ],
      userCount: 1,
    },
    {
      id: "admin",
      name: "Administrator",
      description: "Full restaurant management access",
      permissions: [
        "manage_users",
        "manage_products",
        "view_analytics",
        "manage_settings",
        "process_payments",
        "manage_orders",
      ],
      userCount: 2,
    },
    {
      id: "supervisor",
      name: "Supervisor",
      description: "Operations supervision and kitchen management",
      permissions: [
        "manage_products",
        "view_analytics",
        "manage_orders",
        "process_payments",
        "view_menu",
      ],
      userCount: 3,
    },
    {
      id: "user",
      name: "User",
      description: "General POS and order operations",
      permissions: ["manage_orders", "process_payments", "view_menu"],
      userCount: 10,
    },
    {
      id: "cashier",
      name: "Cashier",
      description: "POS billing and order processing",
      permissions: ["process_payments", "manage_orders", "view_menu"],
      userCount: 0,
    },
    {
      id: "waiter",
      name: "Waiter",
      description: "Table service, orders and reservations",
      permissions: ["manage_orders", "view_menu", "manage_table_booking"],
      userCount: 0,
    },
    {
      id: "mobile-kds",
      name: "Mobile KDS",
      description: "Mobile kitchen display — view live orders",
      permissions: ["view_orders"],
      userCount: 0,
    },
    {
      id: "kitchen-kds",
      name: "Kitchen KDS",
      description: "Kitchen display screen — view and manage live orders",
      permissions: ["view_orders", "manage_orders"],
      userCount: 0,
    },
    {
      id: "kiosk-machine",
      name: "Kiosk Machine",
      description: "Self-service ordering kiosk",
      permissions: ["manage_orders", "process_payments", "view_menu"],
      userCount: 0,
    },
  ];

  const initialUsers: User[] = [
    {
      id: "1",
      name: "Alex Johnson",
      email: "alex.johnson@restaurant.com",
      phone: "+1 (555) 123-4567",
      restaurant: "Downtown Restaurant",
      role: "admin",
      status: "active",
      joinDate: "2023-01-15",
      lastLogin: "2024-01-20 14:30",
      permissions: [
        "manage_users",
        "manage_products",
        "view_analytics",
        "manage_settings",
      ],
      shifts: [
        {
          id: "1",
          day: "Monday",
          startTime: "09:00",
          endTime: "17:00",
          position: "Management",
        },
        {
          id: "2",
          day: "Tuesday",
          startTime: "09:00",
          endTime: "17:00",
          position: "Management",
        },
      ],
      performance: {
        ordersHandled: 245,
        avgOrderValue: 28.5,
        customerRating: 4.8,
        punctualityScore: 95,
      },
    },
    {
      id: "2",
      name: "Maria Garcia",
      email: "maria.garcia@restaurant.com",
      phone: "+1 (555) 234-5678",
      restaurant: "Downtown Restaurant",
      role: "admin",
      status: "active",
      joinDate: "2023-03-20",
      lastLogin: "2024-01-20 13:45",
      permissions: [
        "manage_products",
        "view_analytics",
        "manage_orders",
        "manage_staff_schedules",
      ],
      shifts: [
        {
          id: "3",
          day: "Wednesday",
          startTime: "12:00",
          endTime: "22:00",
          position: "Floor Manager",
        },
        {
          id: "4",
          day: "Thursday",
          startTime: "12:00",
          endTime: "22:00",
          position: "Floor Manager",
        },
      ],
      performance: {
        ordersHandled: 189,
        avgOrderValue: 25.2,
        customerRating: 4.6,
        punctualityScore: 92,
      },
    },
    {
      id: "3",
      name: "David Chen",
      email: "david.chen@restaurant.com",
      phone: "+1 (555) 345-6789",
      restaurant: "Mall Food Court",
      role: "supervisor",
      status: "active",
      joinDate: "2023-06-10",
      lastLogin: "2024-01-20 12:15",
      permissions: ["manage_orders", "process_payments", "view_menu"],
      shifts: [
        {
          id: "5",
          day: "Friday",
          startTime: "17:00",
          endTime: "23:00",
          position: "Server",
        },
        {
          id: "6",
          day: "Saturday",
          startTime: "17:00",
          endTime: "23:00",
          position: "Server",
        },
      ],
      performance: {
        ordersHandled: 134,
        avgOrderValue: 22.8,
        customerRating: 4.4,
        punctualityScore: 88,
      },
    },
    {
      id: "4",
      name: "Sarah Wilson",
      email: "sarah.wilson@restaurant.com",
      phone: "+1 (555) 456-7890",
      restaurant: "Airport Terminal",
      role: "user",
      status: "inactive",
      joinDate: "2023-09-05",
      lastLogin: "2024-01-18 16:00",
      permissions: ["process_payments", "view_menu"],
      shifts: [],
      performance: {
        ordersHandled: 98,
        avgOrderValue: 19.5,
        customerRating: 4.2,
        punctualityScore: 85,
      },
    },
  ];

  const [users, setUsers] = useState<User[]>(initialUsers);
  const isAdminView = authUser?.role === "admin";
  const usesApiUsers = authUser?.role === "super_admin" || isAdminView;
  const usersForView = usesApiUsers ? apiUsers : users;
  const adminRestaurantId = authUser?.branchId || "";

  const filteredUsers = usersForView.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    const matchesStatus =
      selectedStatus === "all" || user.status === selectedStatus;
    const matchesRestaurant =
      selectedRestaurant === "all" || user.restaurant === selectedRestaurant;

    return matchesSearch && matchesRole && matchesStatus && matchesRestaurant;
  });
  const fallbackRestaurantOptions = Array.from(
    new Set(usersForView.map((u) => u.restaurant).filter(Boolean))
  );
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * pageSize;
  const pagedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRole, selectedStatus, selectedRestaurant, pageSize]);

  useEffect(() => {
    const loadRestaurantsForFilter = async () => {
      try {
        const response = await getMyRestaurants(0, 500);
        const source = (response as any)?.data ?? response;
        const restaurants = Array.isArray(source)
          ? source
          : Array.isArray(source?.items)
            ? source.items
            : Array.isArray(source?.restaurants)
              ? source.restaurants
              : [];
        const choices = Array.from(
          new Map(
            restaurants
              .filter(
                (restaurant: any) =>
                  restaurant?.id && (restaurant?.name || restaurant?.business_name),
              )
              .map((restaurant: any) => [
                String(restaurant.id),
                {
                  id: String(restaurant.id),
                  name: String(restaurant.name || restaurant.business_name),
                },
              ]),
          ).values(),
        ) as Array<{ id: string; name: string }>;
        const names = Array.from(
          new Set(
            restaurants
              .map((restaurant: any) => restaurant?.name || restaurant?.business_name)
              .filter((name: string | undefined) => !!name)
          )
        ) as string[];

        setRestaurantChoices(choices);
        setRestaurantOptions(names.length > 0 ? names : fallbackRestaurantOptions);
      } catch {
        setRestaurantChoices([]);
        setRestaurantOptions(fallbackRestaurantOptions);
      }
    };

    if (authUser?.role === "super_admin") {
      loadRestaurantsForFilter();
    }
  }, [authUser?.role]);

  useEffect(() => {
    if (authUser?.role === "super_admin") {
      loadSuperAdminUsers();
    } else if (isAdminView) {
      loadRestaurantUsers();
    }
  }, [authUser?.role, adminRestaurantId]);

  // Tab-specific configurations
  const getTabConfig = (tab: string) => {
    switch (tab) {
      case "users":
        return {
          buttonText: "Add User",
          buttonIcon: UserPlus,
          description: "Create a new user account",
        };
      case "roles":
        return {
          buttonText: "Add Role",
          buttonIcon: ShieldCheck,
          description: "Define a new user role",
        };
      case "schedules":
        return {
          buttonText: "Add Schedule",
          buttonIcon: CalendarPlus,
          description: "Create a new shift schedule",
        };
      default:
        return {
          buttonText: "Add User",
          buttonIcon: UserPlus,
          description: "Create a new user account",
        };
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":    return "bg-purple-600 text-white";
      case "admin":          return "bg-red-500 text-white";
      case "supervisor":     return "bg-yellow-500 text-black";
      case "user":           return "bg-green-500 text-white";
      case "cashier":        return "bg-blue-500 text-white";
      case "waiter":         return "bg-teal-500 text-white";
      case "mobile-kds":     return "bg-orange-500 text-white";
      case "kitchen-kds":    return "bg-rose-500 text-white";
      case "kiosk-machine":  return "bg-indigo-500 text-white";
      default:               return "bg-gray-500 text-white";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "inactive":
        return <XCircle className="h-4 w-4 text-gray-400" />;
      case "suspended":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const mapRoleForApi = (role: User["role"]) => {
    if (role === "super_admin") return "superadmin";
    return role;
  };

  const resetUserFilters = () => {
    setSearchQuery("");
    setSelectedRole("all");
    setSelectedStatus("all");
    setSelectedRestaurant("all");
    setCurrentPage(1);
  };

  const closeAddUserModal = () => {
    setIsAddingUser(false);
    resetUserFilters();
  };

  const handleOpenEditUser = (targetUser: User) => {
    if (targetUser.status === "inactive") return;

    if (typeof document !== "undefined") {
      (document.activeElement as HTMLElement | null)?.blur?.();
    }

    const filtersSnapshot = {
      searchQuery,
      selectedRole,
      selectedStatus,
      selectedRestaurant,
      currentPage,
    };

    setEditingUser(targetUser);

    // Defensive: keep filters unchanged when opening the edit modal.
    setTimeout(() => {
      setSearchQuery(filtersSnapshot.searchQuery);
      setSelectedRole(filtersSnapshot.selectedRole);
      setSelectedStatus(filtersSnapshot.selectedStatus);
      setSelectedRestaurant(filtersSnapshot.selectedRestaurant);
      setCurrentPage(filtersSnapshot.currentPage);
    }, 0);
  };

  const isAnyModalOpen =
    !!editingUser || isAddingUser || isAddingRole || isAddingSchedule;

  const handleCreateUser = async (newUser: any) => {
    if (authUser?.role === "super_admin" || isAdminView) {
      try {
        const selectedStatus = newUser.status as User["status"];
        const createdUserResponse: any = await createUser({
          full_name: newUser.name,
          username: newUser.username,
          email: newUser.email,
          ...(newUser.phone ? { phone: newUser.phone } : {}),
          restaurant_id: isAdminView
            ? adminRestaurantId
            : newUser.restaurantId || undefined,
          role: mapRoleForApi(newUser.role as User["role"]),
          is_active: newUser.status === "active",
          status: newUser.status,
          password: newUser.password || undefined,
        } as any);

        const createdUser = (createdUserResponse as any)?.data ?? createdUserResponse;
        const createdUserId = String((createdUser as any)?.id || "").trim();
        const apiReturnedStatus: User["status"] =
          typeof (createdUser as any)?.status === "string"
            ? ((createdUser as any).status as User["status"])
            : (createdUser as any)?.is_active === false
              ? "inactive"
              : "active";

        if (selectedStatus !== apiReturnedStatus && selectedStatus === "inactive" && createdUserId) {
          await updateUser(createdUserId, {
            status: "inactive",
            is_active: false,
          } as any);
        }

        if (authUser?.role === "super_admin") {
          await loadSuperAdminUsers();
        } else {
          await loadRestaurantUsers();
        }
        closeAddUserModal();
        addToast({
          type: "success",
          title: "User Created",
          description: `New user has been added successfully (${apiReturnedStatus}).`,
        });
        if (selectedStatus !== apiReturnedStatus) {
          addToast({
            type: selectedStatus === "inactive" && createdUserId ? "success" : "error",
            title: "Status Mismatch",
            description:
              selectedStatus === "inactive" && createdUserId
                ? "Backend returned active, so status was auto-corrected to inactive."
                : "Selected status and API response status are different. Backend may be overriding status.",
          });
        }
      } catch (error: any) {
        addToast({
          type: "error",
          title: "Create Failed",
          description: error?.message || "Could not create user.",
        });
      }
      return;
    }

    const newLocalUser: User = {
      id: String(Date.now()),
      name: newUser.name || "New User",
      username: newUser.username || undefined,
      email: newUser.email || "",
      phone: newUser.phone || "",
      restaurant:
        restaurantChoices.find((restaurant) => restaurant.id === newUser.restaurantId)?.name ||
        "Unassigned",
      restaurantId: newUser.restaurantId || undefined,
      role: newUser.role as User["role"],
      status: newUser.status as User["status"],
      joinDate: new Date().toLocaleDateString(),
      lastLogin: "N/A",
      permissions: [],
      shifts: [],
      performance: {
        ordersHandled: 0,
        avgOrderValue: 0,
        customerRating: 0,
        punctualityScore: 0,
      },
    };

    setUsers((prev) => [newLocalUser, ...prev]);
    closeAddUserModal();
    addToast({
      type: "success",
      title: "User Created",
      description: "New user has been added successfully.",
    });
  };

  const normalizeRole = (role?: string): User["role"] => {
    const value = (role || "").toLowerCase();
    if (value === "superadmin" || value === "super_admin") return "super_admin";
    if (value === "admin") return "admin";
    if (value === "supervisor") return "supervisor";
    if (value === "cashier") return "cashier";
    if (value === "waiter") return "waiter";
    if (value === "mobile-kds" || value === "mobile_kds") return "mobile-kds";
    if (value === "kitchen-kds" || value === "kitchen_kds") return "kitchen-kds";
    if (value === "kiosk-machine" || value === "kiosk_machine") return "kiosk-machine";
    return "user";
  };

  const normalizeStatus = (raw: any): User["status"] => {
    const value = (raw?.status || "").toLowerCase();
    if (value === "active" || value === "inactive" || value === "suspended") {
      return value;
    }
    if (raw?.is_active === true) return "active";
    if (raw?.is_active === false) return "inactive";
    return "inactive";
  };

  const toDateText = (dateValue?: string) => {
    if (!dateValue) return "N/A";
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return "N/A";
    return parsed.toLocaleDateString();
  };

  const toDateTimeText = (dateValue?: string) => {
    if (!dateValue) return "N/A";
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return "N/A";
    return parsed.toLocaleString();
  };

  const mapApiUserRecords = (
    usersData: any[],
    restaurantNameById: Map<string, string>,
  ): User[] => {
    const sortedUsersData = [...usersData].sort((a: any, b: any) => {
      const aDate = new Date(
        a?.created_at || a?.createdAt || a?.updated_at || a?.updatedAt || 0,
      ).getTime();
      const bDate = new Date(
        b?.created_at || b?.createdAt || b?.updated_at || b?.updatedAt || 0,
      ).getTime();
      return bDate - aDate;
    });

    return sortedUsersData.map((user: any) => {
      const restaurantId =
        user.restaurant_id ||
        user.restaurantId ||
        user.branchId ||
        user.restaurant?.id;
      const restaurantNameFromUser =
        user.restaurant_name ||
        user.restaurantName ||
        user.restaurant?.name ||
        user.restaurant?.business_name;
      return {
        id: String(user.id || ""),
        name:
          user.name ||
          user.full_name ||
          user.username ||
          user.email ||
          "Unknown User",
        username: user.username || undefined,
        email: user.email || "N/A",
        phone: user.phone || "N/A",
        restaurant:
          restaurantNameById.get(String(restaurantId || "")) ||
          restaurantNameFromUser ||
          "Unassigned",
        restaurantId: restaurantId ? String(restaurantId) : undefined,
        role: normalizeRole(user.role),
        status: normalizeStatus(user),
        joinDate: toDateText(user.join_date || user.created_at),
        lastLogin: toDateTimeText(user.last_login || user.updated_at),
        avatar: user.avatar || undefined,
        permissions: Array.isArray(user.permissions) ? user.permissions : [],
        shifts: [],
        performance: {
          ordersHandled: 0,
          avgOrderValue: 0,
          customerRating: 0,
          punctualityScore: 0,
        },
      };
    });
  };

  const loadRestaurantUsers = async () => {
    if (!isAdminView || !adminRestaurantId) {
      return;
    }

    setIsUsersLoading(true);
    try {
      const [usersResponse, restaurantsResponse] = await Promise.all([
        getUsersByRestaurant(adminRestaurantId, 0, 1000),
        getMyRestaurants(0, 500),
      ]);

      const usersSource = (usersResponse as any)?.data ?? usersResponse;
      const usersData = Array.isArray(usersSource?.users)
        ? usersSource.users
        : Array.isArray(usersSource)
          ? usersSource
          : [];

      const restaurantsSource = (restaurantsResponse as any)?.data ?? restaurantsResponse;
      const restaurantsData = Array.isArray(restaurantsSource)
        ? restaurantsSource
        : Array.isArray(restaurantsSource?.items)
          ? restaurantsSource.items
          : Array.isArray(restaurantsSource?.restaurants)
            ? restaurantsSource.restaurants
            : [];

      const restaurantNameById = new Map<string, string>(
        restaurantsData
          .filter((r: any) => r?.id && (r?.name || r?.business_name))
          .map((r: any) => [String(r.id), String(r.name || r.business_name)]),
      );

      const adminRestaurantChoices = Array.from(
        new Map(
          restaurantsData
            .filter(
              (r: any) =>
                String(r.id) === adminRestaurantId &&
                (r?.name || r?.business_name),
            )
            .map((r: any) => [
              String(r.id),
              { id: String(r.id), name: String(r.name || r.business_name) },
            ]),
        ).values(),
      ) as Array<{ id: string; name: string }>;

      if (adminRestaurantChoices.length > 0) {
        setRestaurantChoices(adminRestaurantChoices);
      } else if (restaurantNameById.has(adminRestaurantId)) {
        setRestaurantChoices([
          {
            id: adminRestaurantId,
            name: restaurantNameById.get(adminRestaurantId) || "My Restaurant",
          },
        ]);
      }

      setApiUsers(mapApiUserRecords(usersData, restaurantNameById));
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Failed to Load Users",
        description: error?.message || "Could not fetch restaurant users.",
      });
      setApiUsers([]);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const loadSuperAdminUsers = async () => {
    if (authUser?.role !== "super_admin") {
      return;
    }

    setIsUsersLoading(true);
    try {
      const [usersResponse, restaurantsResponse] = await Promise.all([
        getUsers(0, 1000),
        getMyRestaurants(0, 500),
      ]);

      const usersSource = (usersResponse as any)?.data ?? usersResponse;
      const usersData = Array.isArray(usersSource)
        ? usersSource
        : Array.isArray(usersSource?.items)
          ? usersSource.items
          : [];

      const restaurantsSource = (restaurantsResponse as any)?.data ?? restaurantsResponse;
      const restaurantsData = Array.isArray(restaurantsSource)
        ? restaurantsSource
        : Array.isArray(restaurantsSource?.items)
          ? restaurantsSource.items
          : Array.isArray(restaurantsSource?.restaurants)
            ? restaurantsSource.restaurants
            : [];

      const restaurantNameById = new Map<string, string>(
        restaurantsData
          .filter((r: any) => r?.id && (r?.name || r?.business_name))
          .map((r: any) => [String(r.id), String(r.name || r.business_name)]),
      );
      setRestaurantChoices(
        Array.from(
          new Map(
            restaurantsData
              .filter((r: any) => r?.id && (r?.name || r?.business_name))
              .map((r: any) => [
                String(r.id),
                { id: String(r.id), name: String(r.name || r.business_name) },
              ]),
          ).values(),
        ) as Array<{ id: string; name: string }>,
      );

      setApiUsers(mapApiUserRecords(usersData, restaurantNameById));
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Failed to Load Users",
        description: error?.message || "Could not fetch /api/v1/users.",
      });
      setApiUsers([]);
    } finally {
      setIsUsersLoading(false);
    }
  };

  const handleSaveUser = async (updatedUser: Partial<User>) => {
    if (!editingUser) return;

    if (authUser?.role === "super_admin" || isAdminView) {
      try {
        const nextPassword = String((updatedUser as any).password ?? "").trim();
        await updateUser(editingUser.id, {
          full_name: updatedUser.name,
          username: updatedUser.username,
          email: updatedUser.email,
          ...(nextPassword ? { password: nextPassword } : {}),
          ...(updatedUser.phone ? { phone: updatedUser.phone } : {}),
          restaurant_id: isAdminView
            ? adminRestaurantId
            : (updatedUser as any).restaurantId || undefined,
          role: updatedUser.role ? mapRoleForApi(updatedUser.role as User["role"]) : undefined,
          is_active: updatedUser.status ? updatedUser.status === "active" : undefined,
          status: updatedUser.status,
        } as any);

        setApiUsers((prev) =>
          prev.map((user) =>
            user.id === editingUser.id
              ? {
                  ...user,
                  ...updatedUser,
                  restaurant:
                    restaurantChoices.find(
                      (restaurant) =>
                        restaurant.id ===
                        (isAdminView
                          ? adminRestaurantId
                          : (updatedUser as any).restaurantId),
                    )?.name || user.restaurant,
                  role: (updatedUser.role as User["role"]) || user.role,
                  status: (updatedUser.status as User["status"]) || user.status,
                }
              : user,
          ),
        );

        addToast({
          type: "success",
          title: "User Updated",
          description: "User information has been updated.",
        });
      } catch (error: any) {
        addToast({
          type: "error",
          title: "Update Failed",
          description: error?.message || "Could not update user.",
        });
        return;
      }
    } else {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === editingUser.id
            ? {
                ...user,
                ...updatedUser,
                restaurant:
                  restaurantChoices.find(
                    (restaurant) => restaurant.id === (updatedUser as any).restaurantId,
                  )?.name || user.restaurant,
                role: (updatedUser.role as User["role"]) || user.role,
                status: (updatedUser.status as User["status"]) || user.status,
              }
            : user,
        ),
      );
      addToast({
        type: "success",
        title: "User Updated",
        description: "User information has been updated.",
      });
    }

    setEditingUser(null);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);

    if (authUser?.role === "super_admin" || isAdminView) {
      try {
        await deleteUser(userToDelete.id);
        setApiUsers((prev) => prev.filter((user) => user.id !== userToDelete.id));
        addToast({
          type: "success",
          title: "User Deleted",
          description: `${userToDelete.name} has been removed.`,
        });
      } catch (error: any) {
        addToast({
          type: "error",
          title: "Delete Failed",
          description: error?.message || "Could not delete user.",
        });
        setIsDeletingUser(false);
        return;
      }
    } else {
      setUsers((prev) => prev.filter((user) => user.id !== userToDelete.id));
      addToast({
        type: "success",
        title: "User Deleted",
        description: `${userToDelete.name} has been removed.`,
      });
    }

    setUserToDelete(null);
    setIsDeletingUser(false);
  };

  const closeResetPasswordModal = () => {
    setPasswordResetUser(null);
    setResetPasswordValue("");
    setResetPasswordError("");
    setShowResetPassword(false);
  };

  const handleResetPassword = async () => {
    if (!passwordResetUser) return;
    
    const error = validatePassword(resetPasswordValue, passwordResetUser.username);
    if (error) {
      setResetPasswordError(error);
      return;
    }
    
    setIsResettingPassword(true);
    setResetPasswordError("");
    
    try {
      if (authUser?.role === "super_admin") {
        await updateUserPassword(passwordResetUser.id, resetPasswordValue);
        await loadSuperAdminUsers();
      } else if (isAdminView) {
        await updateUserPassword(passwordResetUser.id, resetPasswordValue);
        await loadRestaurantUsers();
      }
      addToast({
        type: "success",
        title: "Password Updated",
        description: `Password for ${passwordResetUser.name} has been updated.`,
      });
      closeResetPasswordModal();
    } catch (error: any) {
      addToast({
        type: "error",
        title: "Update Failed",
        description: error?.message || "Could not update password.",
      });
      setResetPasswordError(error?.message || "Could not update password.");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleToggleUserStatus = async (targetUser: User, checked: boolean) => {
    if (targetUser.status === "suspended") return;
    if (statusUpdatingUserId === targetUser.id) return;

    const nextStatus: User["status"] = checked ? "active" : "inactive";
    const previousStatus = targetUser.status;
    if (nextStatus === previousStatus) return;

    setStatusUpdatingUserId(targetUser.id);
    setApiUsers((prev) =>
      prev.map((user) =>
        user.id === targetUser.id ? { ...user, status: nextStatus } : user,
      ),
    );

    try {
      const response: any = await updateUser(targetUser.id, {
        status: nextStatus,
        is_active: checked,
      } as any);

      const payload = response?.data ?? response;
      const apiStatus: User["status"] =
        typeof payload?.status === "string"
          ? (payload.status as User["status"])
          : payload?.is_active === false
            ? "inactive"
            : "active";

      setApiUsers((prev) =>
        prev.map((user) =>
          user.id === targetUser.id ? { ...user, status: apiStatus } : user,
        ),
      );
    } catch (error: any) {
      setApiUsers((prev) =>
        prev.map((user) =>
          user.id === targetUser.id ? { ...user, status: previousStatus } : user,
        ),
      );
      addToast({
        type: "error",
        title: "Update Failed",
        description: error?.message || "Could not update user status.",
      });
    } finally {
      setStatusUpdatingUserId((current) => (current === targetUser.id ? null : current));
    }
  };

  const handleRequestStatusChange = (targetUser: User, checked: boolean) => {
    if (targetUser.status === "suspended") return;
    if (statusUpdatingUserId === targetUser.id) return;
    const nextStatus: User["status"] = checked ? "active" : "inactive";
    if (nextStatus === targetUser.status) return;
    setPendingStatusChange({ user: targetUser, checked });
  };

  const handleAddAction = () => {
    const config = getTabConfig(activeTab);
    addToast({
      type: "info",
      title: config.buttonText,
      description: config.description,
    });

    switch (activeTab) {
      case "users":
        setIsAddingUser(true);
        break;
      case "roles":
        setIsAddingRole(true);
        break;
      case "schedules":
        setIsAddingSchedule(true);
        break;
    }
  };

  const UserForm = ({
    user,
    onSave,
    onCancel,
  }: {
    user?: User;
    onSave: (user: any) => void;
    onCancel: () => void;
  }) => {
    const initialRestaurantId =
      user?.restaurantId ||
      restaurantChoices.find((restaurant) => restaurant.name === user?.restaurant)?.id ||
      (isAdminView ? adminRestaurantId : "");
    const [formData, setFormData] = useState({
      name: user?.name || "",
      username: user?.username || "",
      email: user?.email || "",
      restaurantId: initialRestaurantId,
      role: user?.role || "",
      status: user?.status || "active",
      password: "",
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const [showPassword, setShowPassword] = useState(false);

    const validateField = (
      field: "name" | "username" | "email" | "restaurantId" | "password" | "role",
      value: string,
    ) => {
      const normalizedValue = value.trim();
      switch (field) {
        case "name":
          return validateFullName(normalizedValue);
        case "username":
          {
            const usernameError = validateUsername(normalizedValue);
            if (usernameError) return usernameError;
            const selectedRestaurantId = (formData.restaurantId || "").trim();
            if (
              usersForView.some(
                (existingUser) => {
                  const existingRestaurantId = (existingUser.restaurantId || "").trim();
                  return (
                    (existingUser.username || "").toLowerCase() ===
                      normalizedValue.toLowerCase() &&
                    existingUser.id !== user?.id &&
                    existingRestaurantId === selectedRestaurantId
                  );
                },
              )
            ) {
              return "Username already exists in this restaurant.";
            }
            return "";
          }
        case "email":
          if (!normalizedValue) return "Email is required.";
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValue)) {
            return "Enter a valid email address.";
          }
          if (
            usersForView.some(
              (existingUser) =>
                existingUser.email.toLowerCase() === normalizedValue.toLowerCase() &&
                existingUser.id !== user?.id,
            )
          ) {
            return "Email already exists.";
          }
          return "";
        case "restaurantId":
          if (isAdminView) return "";
          if (!normalizedValue) return "Please select a restaurant.";
          return "";
        case "role":
          if (!normalizedValue) return "Please select a role.";
          return "";
        case "password":
          if (user && !normalizedValue) return "";
          return validatePassword(normalizedValue, formData.username);
        default:
          return "";
      }
    };

    const setFieldValue = (
      field: keyof typeof formData,
      value: string,
      validateOnChange = true,
    ) => {
      setFormData((prev) => {
        const next = { ...prev, [field]: value };
        if (validateOnChange && formErrors[field]) {
          const error = validateField(field as any, value);
          setFormErrors((prevErrors) => {
            if (error) return { ...prevErrors, [field]: error };
            const copy = { ...prevErrors };
            delete copy[field];
            return copy;
          });
        }
        return next;
      });
    };

    const handleFieldBlur = (
      field: "name" | "username" | "email" | "restaurantId" | "password" | "role",
    ) => {
      const value = String((formData as any)[field] ?? "");
      const error = validateField(field, value);
      setFormErrors((prev) => {
        if (!error) {
          const copy = { ...prev };
          delete copy[field];
          return copy;
        }
        return { ...prev, [field]: error };
      });
    };

    const validateForm = () => {
      const fields: Array<
        "name" | "username" | "email" | "restaurantId" | "password" | "role"
      > = isAdminView
        ? ["name", "username", "email", "role", "password"]
        : [
            "name",
            "username",
            "email",
            "restaurantId",
            "role",
            "password",
          ];
      const nextErrors: Record<string, string> = {};
      for (const field of fields) {
        const value = String((formData as any)[field] ?? "");
        const error = validateField(field, value);
        if (error) {
          nextErrors[field] = error;
        }
      }
      setFormErrors(nextErrors);
      return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = () => {
      if (!validateForm()) return;
      onSave({
        ...formData,
        name: formData.name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        restaurantId: isAdminView ? adminRestaurantId : formData.restaurantId,
      });
    };

    return (
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">
              Full Name
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFieldValue("name", e.target.value)}
              onBlur={() => handleFieldBlur("name")}
              className="bg-background border-border text-foreground"
              placeholder="Enter full name"
            />
            {formErrors.name && (
              <p className="text-xs text-destructive">{formErrors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFieldValue("email", e.target.value)}
              onBlur={() => handleFieldBlur("email")}
              className="bg-background border-border text-foreground"
              placeholder="Enter email address"
            />
            {formErrors.email && (
              <p className="text-xs text-destructive">{formErrors.email}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {!isAdminView && (
            <div className="space-y-2">
              <Label htmlFor="restaurant" className="text-foreground">
                Restaurant
              </Label>
              <Select
                value={formData.restaurantId || "none"}
                onValueChange={(value) =>
                  setFieldValue("restaurantId", value === "none" ? "" : value)
                }
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select restaurant" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="none">Select Restaurant</SelectItem>
                  {restaurantChoices.map((restaurant) => (
                    <SelectItem key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.restaurantId && (
                <p className="text-xs text-destructive">{formErrors.restaurantId}</p>
              )}
            </div>
          )}
          <div className={`space-y-2 ${isAdminView ? "md:col-span-2" : ""}`}>
            <Label htmlFor="role" className="text-foreground">
              Role
            </Label>
            <Select
              value={formData.role || "none"}
              onValueChange={(value) =>
                setFieldValue("role", value === "none" ? "" : value)
              }
            >
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="none">Select Role</SelectItem>
                {(isAdminView
                  ? roles.filter((role) => role.id !== "super_admin")
                  : roles
                ).map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formErrors.role && (
              <p className="text-xs text-destructive">{formErrors.role}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-foreground">
              Username
            </Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFieldValue("username", e.target.value)}
              onBlur={() => handleFieldBlur("username")}
              className="bg-background border-border text-foreground"
              placeholder="Enter username"
            />
            {formErrors.username && (
              <p className="text-xs text-destructive">{formErrors.username}</p>
            )}
          </div>
          {!user && (
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Temporary Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFieldValue("password", e.target.value)}
                  onBlur={() => handleFieldBlur("password")}
                  className="bg-background border-border text-foreground pr-10"
                  placeholder="Enter temporary password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {formErrors.password && (
                <p className="text-xs text-destructive">{formErrors.password}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="mr-2 h-4 w-4" />
            {user ? "Update User" : "Create User"}
          </Button>
        </div>
      </motion.div>
    );
  };

  const RoleForm = ({
    onSave,
    onCancel,
  }: {
    onSave: (role: NewRole) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState<NewRole>({
      name: "",
      description: "",
      permissions: [],
    });

    const availablePermissions = [
      "manage_users",
      "manage_products",
      "view_analytics",
      "manage_settings",
      "process_payments",
      "manage_orders",
      "manage_staff_schedules",
      "view_menu",
    ];

    return (
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="space-y-6"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roleName" className="text-foreground">
              Role Name
            </Label>
            <Input
              id="roleName"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="bg-background border-border text-foreground"
              placeholder="Enter role name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="roleDescription" className="text-foreground">
              Description
            </Label>
            <Input
              id="roleDescription"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="bg-background border-border text-foreground"
              placeholder="Describe the role responsibilities"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Permissions</Label>
            <div className="grid grid-cols-2 gap-2">
              {availablePermissions.map((permission) => (
                <div key={permission} className="flex items-center space-x-2">
                  <Switch
                    checked={formData.permissions.includes(permission)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setFormData({
                          ...formData,
                          permissions: [...formData.permissions, permission],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          permissions: formData.permissions.filter(
                            (p) => p !== permission,
                          ),
                        });
                      }
                    }}
                  />
                  <span className="text-sm text-foreground">
                    {permission.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={() => onSave(formData)}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="mr-2 h-4 w-4" />
            Create Role
          </Button>
        </div>
      </motion.div>
    );
  };

  const ScheduleForm = ({
    onSave,
    onCancel,
  }: {
    onSave: (schedule: NewSchedule) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState<NewSchedule>({
      userId: "",
      day: "Monday",
      startTime: "09:00",
      endTime: "17:00",
      position: "",
    });

    const daysOfWeek = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    const positions = ["Server", "Kitchen", "Cashier", "Manager", "Host"];

    return (
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="space-y-6"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId" className="text-foreground">
              Staff Member
            </Label>
            <Select
              value={formData.userId}
              onValueChange={(value) =>
                setFormData({ ...formData, userId: value })
              }
            >
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} - {user.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="day" className="text-foreground">
                Day of Week
              </Label>
              <Select
                value={formData.day}
                onValueChange={(value) =>
                  setFormData({ ...formData, day: value })
                }
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {daysOfWeek.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position" className="text-foreground">
                Position
              </Label>
              <Select
                value={formData.position}
                onValueChange={(value) =>
                  setFormData({ ...formData, position: value })
                }
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  {positions.map((position) => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="text-foreground">
                Start Time
              </Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime" className="text-foreground">
                End Time
              </Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData({ ...formData, endTime: e.target.value })
                }
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={() => onSave(formData)}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="mr-2 h-4 w-4" />
            Create Schedule
          </Button>
        </div>
      </motion.div>
    );
  };

  const tabConfig = getTabConfig(activeTab);
  const ButtonIcon = tabConfig.buttonIcon;

  if (authUser?.role === "super_admin") {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                User Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Super admin datatable view for all users
              </p>
            </div>
            <Button
              onClick={() => setIsAddingUser(true)}
              className="bg-primary hover:bg-primary/90 justify-center lg:justify-start"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="search"
                    name="superadmin-users-search"
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => {
                      if (isAnyModalOpen) return;
                      setSearchQuery(e.target.value);
                    }}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="pl-10 bg-background border-border text-foreground"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-44 bg-background border-border text-foreground">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="all">All Roles</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-40 bg-background border-border text-foreground">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                    <SelectTrigger className="w-52 bg-background border-border text-foreground">
                      <SelectValue placeholder="Restaurant" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="all">All Restaurants</SelectItem>
                      {(restaurantOptions.length > 0
                        ? restaurantOptions
                        : fallbackRestaurantOptions
                      ).map((restaurant) => (
                        <SelectItem key={restaurant} value={restaurant}>
                          {restaurant}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
                    <SelectTrigger className="w-28 bg-background border-border text-foreground">
                      <SelectValue placeholder="Rows" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Restaurant</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right w-[160px] pr-10">Actions</TableHead>
                      <TableHead className="w-[140px] pl-10">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isUsersLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Loading users...
                        </TableCell>
                      </TableRow>
                    ) : pagedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No users found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.restaurant}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                          </TableCell>
                          <TableCell className="text-right w-[160px] pr-10 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={user.status === "inactive"}
                                className="bg-muted text-foreground hover:bg-green-600 hover:text-white hover:border-green-600 disabled:opacity-50 disabled:hover:bg-muted disabled:hover:text-foreground"
                                onClick={() => handleOpenEditUser(user)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={user.status === "inactive"}
                                className="bg-muted text-foreground hover:bg-blue-600 hover:text-white hover:border-blue-600 disabled:opacity-50 disabled:hover:bg-muted disabled:hover:text-foreground px-2"
                                onClick={() => setPasswordResetUser(user)}
                                title="Update Password"
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="w-[140px] pl-10">
                              <Switch
                                checked={user.status === "active"}
                                disabled={
                                  statusUpdatingUserId === user.id || user.status === "suspended"
                                }
                                onCheckedChange={(checked) =>
                                  handleRequestStatusChange(user, checked)
                                }
                              />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredUsers.length === 0 ? 0 : startIndex + 1}-
                  {Math.min(startIndex + pageSize, filteredUsers.length)} of {filteredUsers.length} users
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPageSafe <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPageSafe} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPageSafe >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {isAddingUser && (
          <Dialog
            open={isAddingUser}
            onOpenChange={(open) => {
              if (open) {
                setIsAddingUser(true);
              } else {
                closeAddUserModal();
              }
            }}
          >
            <DialogContent
              className="bg-background border-border max-w-2xl"
              onInteractOutside={(event) => event.preventDefault()}
              onPointerDownOutside={(event) => event.preventDefault()}
            >
              <DialogHeader>
                <DialogTitle className="text-foreground">Add New User</DialogTitle>
              </DialogHeader>
              <UserForm onSave={handleCreateUser} onCancel={closeAddUserModal} />
            </DialogContent>
          </Dialog>
        )}

        {editingUser && (
          <Dialog
            open={!!editingUser}
            onOpenChange={(open) => {
              if (!open) setEditingUser(null);
            }}
          >
            <DialogContent
              className="bg-background border-border max-w-2xl"
              onInteractOutside={(event) => event.preventDefault()}
              onPointerDownOutside={(event) => event.preventDefault()}
            >
              <DialogHeader>
                <DialogTitle className="text-foreground">Edit User</DialogTitle>
              </DialogHeader>
              <UserForm
                user={editingUser}
                onSave={handleSaveUser}
                onCancel={() => setEditingUser(null)}
              />
            </DialogContent>
          </Dialog>
        )}

        <AlertDialog
          open={!!userToDelete}
          onOpenChange={(open) => {
            if (!open) {
              setUserToDelete(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>{userToDelete?.name || "this user"}</strong>? This action cannot be undone.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingUser}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteUser();
                }}
                disabled={isDeletingUser}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeletingUser ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={!!pendingStatusChange}
          onOpenChange={(open) => {
            if (!open) {
              setPendingStatusChange(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change User Status?</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingStatusChange
                  ? `Are you sure you want to set ${pendingStatusChange.user.name} as ${
                      pendingStatusChange.checked ? "Active" : "Inactive"
                    }?`
                  : "Confirm status change."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async (e) => {
                  e.preventDefault();
                  if (!pendingStatusChange) return;
                  const target = pendingStatusChange;
                  setPendingStatusChange(null);
                  await handleToggleUserStatus(target.user, target.checked);
                }}
              >
                {pendingStatusChange?.checked ? "Set Active" : "Set Inactive"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog
          open={!!passwordResetUser}
          onOpenChange={(open) => {
            if (!open) closeResetPasswordModal();
          }}
        >
          <DialogContent className="bg-background border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">Update Password</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Set a new password for <strong>{passwordResetUser?.name}</strong>.
              </p>
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-foreground">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showResetPassword ? "text" : "password"}
                    value={resetPasswordValue}
                    onChange={(e) => {
                      setResetPasswordValue(e.target.value);
                      if (resetPasswordError) setResetPasswordError("");
                    }}
                    className="bg-background border-border text-foreground pr-10"
                    placeholder="Enter new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                  >
                    {showResetPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {resetPasswordError && (
                  <p className="text-xs text-destructive">{resetPasswordError}</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 border-t border-border pt-4">
              <Button variant="outline" onClick={closeResetPasswordModal} disabled={isResettingPassword}>
                Cancel
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={isResettingPassword || !resetPasswordValue}
                className="bg-primary hover:bg-primary/90"
              >
                {isResettingPassword ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (isAdminView) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                User Management
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage staff accounts for your restaurant
              </p>
            </div>
            <Button
              onClick={() => setIsAddingUser(true)}
              className="bg-primary hover:bg-primary/90 justify-center lg:justify-start"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="search"
                    name="admin-users-search"
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => {
                      if (isAnyModalOpen) return;
                      setSearchQuery(e.target.value);
                    }}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    className="pl-10 bg-background border-border text-foreground"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-44 bg-background border-border text-foreground">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="all">All Roles</SelectItem>
                      {roles
                        .filter((role) => role.id !== "super_admin")
                        .map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-40 bg-background border-border text-foreground">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
                    <SelectTrigger className="w-28 bg-background border-border text-foreground">
                      <SelectValue placeholder="Rows" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-border">
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right w-[160px] pr-10">Actions</TableHead>
                      <TableHead className="w-[140px] pl-10">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isUsersLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Loading users...
                        </TableCell>
                      </TableRow>
                    ) : pagedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No users found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      pagedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                          </TableCell>
                          <TableCell className="text-right w-[160px] pr-10 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={user.status === "inactive"}
                                className="bg-muted text-foreground hover:bg-green-600 hover:text-white hover:border-green-600 disabled:opacity-50 disabled:hover:bg-muted disabled:hover:text-foreground"
                                onClick={() => handleOpenEditUser(user)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={user.status === "inactive"}
                                className="bg-muted text-foreground hover:bg-blue-600 hover:text-white hover:border-blue-600 disabled:opacity-50 disabled:hover:bg-muted disabled:hover:text-foreground px-2"
                                onClick={() => setPasswordResetUser(user)}
                                title="Update Password"
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="bg-muted text-destructive hover:bg-destructive/10 px-2"
                                onClick={() => setUserToDelete(user)}
                                title="Delete User"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="w-[140px] pl-10">
                            <Switch
                              checked={user.status === "active"}
                              disabled={
                                statusUpdatingUserId === user.id || user.status === "suspended"
                              }
                              onCheckedChange={(checked) =>
                                handleRequestStatusChange(user, checked)
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredUsers.length === 0 ? 0 : startIndex + 1}-
                  {Math.min(startIndex + pageSize, filteredUsers.length)} of {filteredUsers.length} users
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPageSafe <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPageSafe} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPageSafe >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {isAddingUser && (
          <Dialog
            open={isAddingUser}
            onOpenChange={(open) => {
              if (open) {
                setIsAddingUser(true);
              } else {
                closeAddUserModal();
              }
            }}
          >
            <DialogContent
              className="bg-background border-border max-w-2xl"
              onInteractOutside={(event) => event.preventDefault()}
              onPointerDownOutside={(event) => event.preventDefault()}
            >
              <DialogHeader>
                <DialogTitle className="text-foreground">Add New User</DialogTitle>
              </DialogHeader>
              <UserForm onSave={handleCreateUser} onCancel={closeAddUserModal} />
            </DialogContent>
          </Dialog>
        )}

        {editingUser && (
          <Dialog
            open={!!editingUser}
            onOpenChange={(open) => {
              if (!open) setEditingUser(null);
            }}
          >
            <DialogContent
              className="bg-background border-border max-w-2xl"
              onInteractOutside={(event) => event.preventDefault()}
              onPointerDownOutside={(event) => event.preventDefault()}
            >
              <DialogHeader>
                <DialogTitle className="text-foreground">Edit User</DialogTitle>
              </DialogHeader>
              <UserForm
                user={editingUser}
                onSave={handleSaveUser}
                onCancel={() => setEditingUser(null)}
              />
            </DialogContent>
          </Dialog>
        )}

        <AlertDialog
          open={!!userToDelete}
          onOpenChange={(open) => {
            if (!open) {
              setUserToDelete(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                <strong>{userToDelete?.name || "this user"}</strong>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingUser}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteUser();
                }}
                disabled={isDeletingUser}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeletingUser ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={!!pendingStatusChange}
          onOpenChange={(open) => {
            if (!open) {
              setPendingStatusChange(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change User Status?</AlertDialogTitle>
              <AlertDialogDescription>
                {pendingStatusChange
                  ? `Are you sure you want to set ${pendingStatusChange.user.name} as ${
                      pendingStatusChange.checked ? "Active" : "Inactive"
                    }?`
                  : "Confirm status change."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={async (e) => {
                  e.preventDefault();
                  if (!pendingStatusChange) return;
                  const target = pendingStatusChange;
                  setPendingStatusChange(null);
                  await handleToggleUserStatus(target.user, target.checked);
                }}
              >
                {pendingStatusChange?.checked ? "Set Active" : "Set Inactive"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog
          open={!!passwordResetUser}
          onOpenChange={(open) => {
            if (!open) closeResetPasswordModal();
          }}
        >
          <DialogContent className="bg-background border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-foreground">Update Password</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Set a new password for <strong>{passwordResetUser?.name}</strong>.
              </p>
              <div className="space-y-2">
                <Label htmlFor="admin-new-password" className="text-foreground">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="admin-new-password"
                    type={showResetPassword ? "text" : "password"}
                    value={resetPasswordValue}
                    onChange={(e) => {
                      setResetPasswordValue(e.target.value);
                      if (resetPasswordError) setResetPasswordError("");
                    }}
                    className="bg-background border-border text-foreground pr-10"
                    placeholder="Enter new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                  >
                    {showResetPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {resetPasswordError && (
                  <p className="text-xs text-destructive">{resetPasswordError}</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 border-t border-border pt-4">
              <Button variant="outline" onClick={closeResetPasswordModal} disabled={isResettingPassword}>
                Cancel
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={isResettingPassword || !resetPasswordValue}
                className="bg-primary hover:bg-primary/90"
              >
                {isResettingPassword ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
}
