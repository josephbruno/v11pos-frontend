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
  updateUser,
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
  role: "super_admin" | "admin" | "supervisor" | "user";
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
  const usersForView = authUser?.role === "super_admin" ? apiUsers : users;

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
    loadSuperAdminUsers();
  }, [authUser?.role]);

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
      case "super_admin":
        return "bg-purple-600 text-white";
      case "admin":
        return "bg-red-500 text-white";
      case "supervisor":
        return "bg-yellow-500 text-black";
      case "user":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
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

  const handleCreateUser = async (newUser: any) => {
    if (authUser?.role === "super_admin") {
      try {
        const selectedStatus = newUser.status as User["status"];
        const createdUserResponse: any = await createUser({
          full_name: newUser.name,
          username: newUser.username,
          email: newUser.email,
          ...(newUser.phone ? { phone: newUser.phone } : {}),
          restaurant_id: newUser.restaurantId || undefined,
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

        await loadSuperAdminUsers();
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

      const sortedUsersData = [...usersData].sort((a: any, b: any) => {
        const aDate = new Date(
          a?.created_at || a?.createdAt || a?.updated_at || a?.updatedAt || 0,
        ).getTime();
        const bDate = new Date(
          b?.created_at || b?.createdAt || b?.updated_at || b?.updatedAt || 0,
        ).getTime();
        return bDate - aDate;
      });

      const mappedUsers: User[] = sortedUsersData.map((user: any) => {
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

      setApiUsers(mappedUsers);
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

    if (authUser?.role === "super_admin") {
      try {
        await updateUser(editingUser.id, {
          full_name: updatedUser.name,
          username: updatedUser.username,
          email: updatedUser.email,
          ...(updatedUser.phone ? { phone: updatedUser.phone } : {}),
          restaurant_id: (updatedUser as any).restaurantId || undefined,
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

    if (authUser?.role === "super_admin") {
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
      "";
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
          if (!normalizedValue) return "Please select a restaurant.";
          return "";
        case "role":
          if (!normalizedValue) return "Please select a role.";
          return "";
        case "password":
          if (!user) {
            return validatePassword(normalizedValue, formData.username);
          }
          return "";
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
      > = [
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
          <div className="space-y-2">
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
                {roles.map((role) => (
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
          {!user ? (
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
          ) : (
            <div />
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
                    placeholder="Search users by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                      <TableHead className="text-right">Actions</TableHead>
                      <TableHead>Status</TableHead>
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
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingUser(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
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
            <DialogContent className="bg-background border-border max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  Add New User
                </DialogTitle>
              </DialogHeader>
              <UserForm
                onSave={handleCreateUser}
                onCancel={closeAddUserModal}
              />
            </DialogContent>
          </Dialog>
        )}

        {editingUser && (
          <Dialog
            open={!!editingUser}
            onOpenChange={(open) => {
              if (!open) {
                setEditingUser(null);
              }
            }}
          >
            <DialogContent className="bg-background border-border max-w-2xl">
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
      </>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage staff accounts, roles, and permissions
          </p>
        </div>

        {/* Tab-specific Add Button */}
        <Button
          onClick={handleAddAction}
          className="bg-primary hover:bg-primary/90 justify-center lg:justify-start"
        >
          <ButtonIcon className="mr-2 h-4 w-4" />
          {tabConfig.buttonText}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border-border mb-6">
          <TabsTrigger
            value="users"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Users className="mr-2 h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger
            value="roles"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Shield className="mr-2 h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger
            value="schedules"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Schedules
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <AnimatePresence>
            <motion.div
              key="users-content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Filters */}
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-background border-border text-foreground"
                      />
                    </div>
                    <Select
                      value={selectedRole}
                      onValueChange={setSelectedRole}
                    >
                      <SelectTrigger className="w-full sm:w-48 bg-background border-border text-foreground">
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
                    <Select
                      value={selectedStatus}
                      onValueChange={setSelectedStatus}
                    >
                      <SelectTrigger className="w-full sm:w-48 bg-background border-border text-foreground">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Users Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: { delay: index * 0.1 },
                    }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Card className="bg-card border-border hover:shadow-lg transition-all duration-200">
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-lg text-foreground">
                                {user.name}
                              </CardTitle>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge className={getRoleColor(user.role)}>
                                  {user.role}
                                </Badge>
                                {getStatusIcon(user.status)}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground">
                              {user.email}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground">
                              {user.phone}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Last login: {user.lastLogin}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                          <div className="text-center">
                            <div className="text-lg font-bold text-foreground">
                              {user.performance.ordersHandled}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Orders
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-foreground">
                              ${user.performance.avgOrderValue}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Avg Order
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-foreground">
                              ★ {user.performance.customerRating}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Rating
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-foreground">
                              {user.performance.punctualityScore}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Punctuality
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-border text-foreground hover:bg-accent"
                            onClick={() => setEditingUser(user)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-border text-foreground hover:bg-accent"
                          >
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-border text-destructive hover:bg-destructive/10"
                            onClick={() => setUserToDelete(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          <AnimatePresence>
            <motion.div
              key="roles-content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {roles.map((role, index) => (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { delay: index * 0.1 },
                  }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="bg-card border-border hover:shadow-lg transition-all duration-200">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-foreground">
                          {role.name}
                        </CardTitle>
                        <Badge className="bg-primary text-primary-foreground">
                          {role.userCount} users
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4">
                        {role.description}
                      </p>
                      <div className="space-y-2">
                        <Label className="text-foreground text-sm font-medium">
                          Permissions:
                        </Label>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.map((permission) => (
                            <Badge
                              key={permission}
                              variant="outline"
                              className="text-xs border-border"
                            >
                              {permission.replace("_", " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-border text-foreground hover:bg-accent"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Role
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-6">
          <AnimatePresence>
            <motion.div
              key="schedules-content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">
                    Weekly Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
                    {[
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                      "Sunday",
                    ].map((day, dayIndex) => (
                      <motion.div
                        key={day}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          transition: { delay: dayIndex * 0.1 },
                        }}
                        className="space-y-2"
                      >
                        <h4 className="font-medium text-foreground text-center text-sm">
                          {day}
                        </h4>
                        <div className="space-y-1">
                          {users
                            .flatMap((user) => user.shifts)
                            .filter((shift) => shift.day === day)
                            .map((shift) => {
                              const user = users.find((u) =>
                                u.shifts.some((s) => s.id === shift.id),
                              );
                              return (
                                <motion.div
                                  key={shift.id}
                                  whileHover={{ scale: 1.02 }}
                                  className="p-2 bg-muted/50 border border-border rounded text-xs cursor-pointer hover:bg-muted/70 transition-colors"
                                >
                                  <div className="font-medium text-foreground">
                                    {user?.name}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {shift.startTime} - {shift.endTime}
                                  </div>
                                  <div className="text-primary font-medium">
                                    {shift.position}
                                  </div>
                                </motion.div>
                              );
                            })}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </TabsContent>
      </Tabs>

      {/* Modals with Center Zoom Animation */}
      <AnimatePresence>
        {/* Add User Modal */}
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
            <DialogContent className="bg-background border-border max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  Add New User
                </DialogTitle>
              </DialogHeader>
              <UserForm
                onSave={handleCreateUser}
                onCancel={closeAddUserModal}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Add Role Modal */}
        {isAddingRole && (
          <Dialog open={isAddingRole} onOpenChange={setIsAddingRole}>
            <DialogContent className="bg-background border-border max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  Add New Role
                </DialogTitle>
              </DialogHeader>
              <RoleForm
                onSave={(role) => {
                  console.log("Creating new role:", role);
                  setIsAddingRole(false);
                  addToast({
                    type: "success",
                    title: "Role Created",
                    description: "New role has been defined successfully.",
                  });
                }}
                onCancel={() => setIsAddingRole(false)}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Add Schedule Modal */}
        {isAddingSchedule && (
          <Dialog open={isAddingSchedule} onOpenChange={setIsAddingSchedule}>
            <DialogContent className="bg-background border-border max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  Add New Schedule
                </DialogTitle>
              </DialogHeader>
              <ScheduleForm
                onSave={(schedule) => {
                  console.log("Creating new schedule:", schedule);
                  setIsAddingSchedule(false);
                  addToast({
                    type: "success",
                    title: "Schedule Created",
                    description: "New shift schedule has been added.",
                  });
                }}
                onCancel={() => setIsAddingSchedule(false)}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <Dialog
            open={!!editingUser}
            onOpenChange={(open) => {
              if (!open) {
                setEditingUser(null);
              }
            }}
          >
            <DialogContent className="bg-background border-border max-w-2xl">
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
      </AnimatePresence>
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
    </motion.div>
  );
}
