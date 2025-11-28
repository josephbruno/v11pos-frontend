import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/contexts/ToastContext";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "manager" | "staff" | "cashier";
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
    },
  },
  exit: {
    opacity: 0,
    scale: 0.75,
    y: 0,
    transition: {
      duration: 0.2,
    },
  },
};

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [activeTab, setActiveTab] = useState("users");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { addToast } = useToast();

  // Mock data
  const roles: Role[] = [
    {
      id: "admin",
      name: "Administrator",
      description: "Full system access and management",
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
      id: "manager",
      name: "Manager",
      description: "Operations management and staff supervision",
      permissions: [
        "manage_products",
        "view_analytics",
        "manage_orders",
        "manage_staff_schedules",
        "process_payments",
      ],
      userCount: 3,
    },
    {
      id: "staff",
      name: "Staff",
      description: "General restaurant operations",
      permissions: ["manage_orders", "process_payments", "view_menu"],
      userCount: 8,
    },
    {
      id: "cashier",
      name: "Cashier",
      description: "Point of sale operations only",
      permissions: ["process_payments", "view_menu"],
      userCount: 4,
    },
  ];

  const users: User[] = [
    {
      id: "1",
      name: "Alex Johnson",
      email: "alex.johnson@restaurant.com",
      phone: "+1 (555) 123-4567",
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
      role: "manager",
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
      role: "staff",
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
      role: "cashier",
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

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    const matchesStatus =
      selectedStatus === "all" || user.status === selectedStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

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
      case "admin":
        return "bg-red-500 text-white";
      case "manager":
        return "bg-yellow-500 text-black";
      case "staff":
        return "bg-green-500 text-white";
      case "cashier":
        return "bg-blue-500 text-white";
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
    onSave: (user: Partial<User>) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      role: user?.role || "staff",
      status: user?.status || "active",
    });

    const [showPassword, setShowPassword] = useState(false);

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
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="bg-background border-border text-foreground"
              placeholder="Enter full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="bg-background border-border text-foreground"
              placeholder="Enter email address"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-foreground">
              Phone Number
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="bg-background border-border text-foreground"
              placeholder="Enter phone number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role" className="text-foreground">
              Role
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData({ ...formData, role: value as any })
              }
            >
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-foreground">Status</Label>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.status === "active"}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    status: checked ? "active" : "inactive",
                  })
                }
              />
              <span className="text-foreground text-sm">Active</span>
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
          <Dialog open={isAddingUser} onOpenChange={setIsAddingUser}>
            <DialogContent className="bg-background border-border max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-foreground">
                  Add New User
                </DialogTitle>
              </DialogHeader>
              <UserForm
                onSave={(user) => {
                  console.log("Creating new user:", user);
                  setIsAddingUser(false);
                  addToast({
                    type: "success",
                    title: "User Created",
                    description: "New user has been added successfully.",
                  });
                }}
                onCancel={() => setIsAddingUser(false)}
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
            onOpenChange={() => setEditingUser(null)}
          >
            <DialogContent className="bg-background border-border max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-foreground">Edit User</DialogTitle>
              </DialogHeader>
              <UserForm
                user={editingUser}
                onSave={(updatedUser) => {
                  console.log("Updating user:", updatedUser);
                  setEditingUser(null);
                  addToast({
                    type: "success",
                    title: "User Updated",
                    description: "User information has been updated.",
                  });
                }}
                onCancel={() => setEditingUser(null)}
              />
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
