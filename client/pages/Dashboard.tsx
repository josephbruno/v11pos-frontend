import { useEffect, useState } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Clock,
  AlertTriangle,
  Plus,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/contexts/ToastContext";

interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  activeStaff: number;
  avgOrderValue: number;
  peakHour: string;
  lowStockItems: number;
  salesGrowth: number;
  orderGrowth: number;
  avgGrowth: number;
}

interface RecentOrder {
  id: string;
  table: string;
  amount: number;
  status: "Preparing" | "Ready" | "Delivered" | "Ordered";
  time: string;
  items: string[];
  customer?: string;
  avatar?: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 2850.75,
    todayOrders: 127,
    activeStaff: 8,
    avgOrderValue: 22.45,
    peakHour: "7:30 PM",
    lowStockItems: 3,
    salesGrowth: 12.5,
    orderGrowth: 8.1,
    avgGrowth: 5.2,
  });

  const { addToast } = useToast();

  const recentOrders: RecentOrder[] = [
    {
      id: "#1234",
      table: "Table 5",
      amount: 45.5,
      status: "Preparing",
      time: "2 min ago",
      items: ["Grilled Chicken", "Caesar Salad"],
      customer: "John Smith",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
    },
    {
      id: "#1235",
      table: "Takeaway",
      amount: 28.75,
      status: "Ready",
      time: "5 min ago",
      items: ["Fish & Chips", "Coca Cola"],
      customer: "Sarah Wilson",
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612c29d?w=40&h=40&fit=crop&crop=face",
    },
    {
      id: "#1236",
      table: "Table 2",
      amount: 67.25,
      status: "Delivered",
      time: "8 min ago",
      items: ["Burger Deluxe", "Fries", "Milkshake"],
      customer: "Mike Johnson",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
    },
    {
      id: "#1237",
      table: "Table 8",
      amount: 34.0,
      status: "Ordered",
      time: "12 min ago",
      items: ["Pasta Carbonara"],
      customer: "Emily Davis",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
    },
  ];

  const quickActions = [
    {
      name: "New Order",
      icon: Plus,
      color: "bg-gradient-to-br from-green-500 to-green-600",
      href: "/order",
      description: "Create new order",
    },
    {
      name: "Add Product",
      icon: Plus,
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      href: "/products",
      description: "Add menu item",
    },
    {
      name: "View Reports",
      icon: TrendingUp,
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      href: "/analytics",
      description: "Analytics dashboard",
    },
    {
      name: "Manage Staff",
      icon: Users,
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
      href: "/users",
      description: "Staff management",
    },
  ];

  const handleQuickAction = (action: (typeof quickActions)[0]) => {
    addToast({
      type: "info",
      title: `${action.name}`,
      description: `Navigating to ${action.description}...`,
    });
  };

  const getStatusColor = (status: RecentOrder["status"]) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "Ready":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "Preparing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "Ordered":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <Button variant="outline" className="justify-center">
            Export Data
          </Button>
          <Button className="bg-pos-accent hover:bg-pos-accent/90 justify-center">
            <Zap className="mr-2 h-4 w-4" />
            Quick Order
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
      >
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="bg-card border-border hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Today's Sales
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    ${stats.todaySales.toLocaleString()}
                  </p>
                  <div className="flex items-center mt-1">
                    <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-500 font-medium">
                      +{stats.salesGrowth}%
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="bg-card border-border hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Orders Today
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.todayOrders}
                  </p>
                  <div className="flex items-center mt-1">
                    <ArrowUp className="h-3 w-3 text-blue-500 mr-1" />
                    <span className="text-xs text-blue-500 font-medium">
                      +{stats.orderGrowth}%
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="bg-card border-border hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Staff
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.activeStaff}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All shifts covered
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="bg-card border-border hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Avg Order Value
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    ${stats.avgOrderValue}
                  </p>
                  <div className="flex items-center mt-1">
                    <ArrowUp className="h-3 w-3 text-orange-500 mr-1" />
                    <span className="text-xs text-orange-500 font-medium">
                      +{stats.avgGrowth}%
                    </span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.name}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { delay: index * 0.1 },
              }}
            >
              <Card
                className="bg-card border-border hover:shadow-lg cursor-pointer transition-all duration-300 group"
                onClick={() => handleQuickAction(action)}
              >
                <CardContent className="p-6 text-center">
                  <div
                    className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-lg`}
                  >
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-medium text-foreground group-hover:text-pos-accent transition-colors">
                    {action.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order, index) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      transition: { delay: index * 0.1 },
                    }}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={order.avatar} alt={order.customer} />
                        <AvatarFallback className="bg-pos-accent text-white text-sm">
                          {order.customer
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-foreground">
                            {order.id}
                          </span>
                          <Badge
                            className={`text-xs ${getStatusColor(order.status)}`}
                          >
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.table} • {order.customer}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {order.items.join(", ")}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-foreground">
                        ${order.amount}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {order.time}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats & Alerts */}
        <motion.div variants={itemVariants}>
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Quick Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Peak Hour</div>
                    <div className="text-sm text-muted-foreground">
                      Today's busiest time
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-foreground">
                    {stats.peakHour}
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center justify-between p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">
                      Low Stock Alert
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Items need restocking
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-yellow-600 dark:text-yellow-400">
                    {stats.lowStockItems} items
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">
                      Table Occupancy
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Currently occupied
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-foreground">12/20 tables</div>
                  <div className="text-xs text-green-500">60% occupied</div>
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
