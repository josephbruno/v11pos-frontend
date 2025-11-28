import { useState, useEffect } from "react";
import {
  CheckCircle,
  Clock,
  ChefHat,
  Coffee,
  IceCream,
  MapPin,
  Phone,
  MessageCircle,
  RefreshCw,
  ArrowLeft,
  Bell,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { QROrderStatus, QROrderWithDetails } from "@/shared/api";

// Mock order data
const mockOrder: QROrderWithDetails = {
  id: "qr-order-001",
  orderId: "qr-order-001",
  orderNumber: "QR-101",
  qrOrderNumber: "QR-101",
  tableId: "table-1",
  sessionId: "session-123",
  deviceFingerprint: "device-abc",
  customerId: undefined,
  customerName: "Guest",
  customerPhone: "+1 (555) 123-4567",
  items: [
    {
      id: "item-1",
      productId: "1",
      quantity: 1,
      unitPrice: 12.99,
      totalPrice: 14.49,
      modifiers: [
        {
          modifierId: "cooking-1",
          name: "Medium",
          price: 0,
          selectedOptions: ["medium"],
        },
        {
          modifierId: "extras-1",
          name: "Extra Cheese",
          price: 1.5,
          selectedOptions: ["cheese"],
        },
      ],
      notes: "No onions please",
      kotGroup: "kitchen",
      product: {
        id: "1",
        name: "Classic Burger",
        description: "Juicy beef patty with fresh ingredients",
        price: 12.99,
        category: "burgers",
        stock: 25,
        minStock: 5,
        available: true,
        featured: true,
        image:
          "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
        cost: 5.5,
        margin: 57,
        tags: ["popular"],
        modifiers: ["cooking-level", "extras"],
        department: "kitchen",
        printerTag: "grill",
      },
    },
    {
      id: "item-2",
      productId: "2",
      quantity: 1,
      unitPrice: 4.99,
      totalPrice: 4.99,
      modifiers: [
        {
          modifierId: "size-1",
          name: "Large",
          price: 2,
          selectedOptions: ["large"],
        },
      ],
      kotGroup: "kitchen",
      product: {
        id: "2",
        name: "French Fries",
        description: "Crispy golden fries",
        price: 4.99,
        category: "sides",
        stock: 50,
        minStock: 10,
        available: true,
        featured: false,
        cost: 1.2,
        margin: 76,
        tags: ["side"],
        modifiers: ["size"],
        department: "kitchen",
        printerTag: "fryer",
      },
    },
    {
      id: "item-3",
      productId: "3",
      quantity: 1,
      unitPrice: 2.99,
      totalPrice: 3.99,
      modifiers: [
        {
          modifierId: "size-drink",
          name: "Medium",
          price: 1,
          selectedOptions: ["medium"],
        },
      ],
      kotGroup: "bar",
      product: {
        id: "3",
        name: "Coca Cola",
        description: "Classic refreshing cola",
        price: 2.99,
        category: "beverages",
        stock: 100,
        minStock: 20,
        available: true,
        featured: false,
        cost: 0.8,
        margin: 73,
        tags: ["beverage"],
        modifiers: ["size"],
        department: "bar",
        printerTag: "beverage_station",
      },
    },
  ],
  subtotal: 23.47,
  taxes: [
    {
      taxRuleId: "tax-1",
      taxName: "GST",
      taxableAmount: 23.47,
      taxAmount: 2.35,
      taxPercentage: 10,
    },
  ],
  totalTax: 2.35,
  loyaltyPointsUsed: 0,
  loyaltyDiscount: 0,
  finalTotal: 25.82,
  orderType: "qr_order",
  status: "preparing",
  paymentStatus: "pending",
  paymentMethod: "pay_at_table",
  createdAt: new Date("2024-01-21T12:30:00"),
  updatedAt: new Date("2024-01-21T12:35:00"),
  estimatedTime: 20,
  actualTime: 5,
  kotGroups: [
    {
      id: "kot-1",
      orderId: "qr-order-001",
      department: "kitchen",
      printerName: "Kitchen Printer",
      items: [
        {
          id: "item-1",
          productId: "1",
          quantity: 1,
          unitPrice: 12.99,
          totalPrice: 14.49,
          modifiers: [],
          notes: "No onions please",
          kotGroup: "kitchen",
        },
        {
          id: "item-2",
          productId: "2",
          quantity: 1,
          unitPrice: 4.99,
          totalPrice: 4.99,
          modifiers: [],
          kotGroup: "kitchen",
        },
      ],
      status: "preparing",
      createdAt: new Date("2024-01-21T12:30:00"),
      acknowledgedAt: new Date("2024-01-21T12:32:00"),
      estimatedTime: 18,
      priority: "normal",
    },
    {
      id: "kot-2",
      orderId: "qr-order-001",
      department: "bar",
      printerName: "Bar Printer",
      items: [
        {
          id: "item-3",
          productId: "3",
          quantity: 1,
          unitPrice: 2.99,
          totalPrice: 3.99,
          modifiers: [],
          kotGroup: "bar",
        },
      ],
      status: "ready",
      createdAt: new Date("2024-01-21T12:30:00"),
      acknowledgedAt: new Date("2024-01-21T12:31:00"),
      readyAt: new Date("2024-01-21T12:33:00"),
      estimatedTime: 3,
      priority: "normal",
    },
  ],
  modifications: [],
  table: {
    id: "table-1",
    tableNumber: "T-05",
    tableName: "Table 5",
    location: "Main Floor",
    capacity: 4,
    qrCodeUrl: "https://yourpos.com/qr-order/TABLE-05-abc123",
    qrToken: "abc123def456",
    isActive: true,
    isOccupied: true,
    currentSessionId: "session-123",
    createdAt: new Date("2024-01-01"),
    lastUsed: new Date("2024-01-21"),
  },
  session: {
    id: "session-123",
    tableId: "table-1",
    deviceFingerprint: "device-abc",
    ipAddress: "192.168.1.100",
    startTime: new Date("2024-01-21T12:00:00"),
    lastActivity: new Date("2024-01-21T12:35:00"),
    expiresAt: new Date("2024-01-21T13:00:00"),
    status: "active",
    ordersCount: 1,
    totalAmount: 25.82,
    customerInfo: {
      phone: "+1 (555) 123-4567",
    },
  },
};

const statusSteps = [
  { key: "placed", label: "Order Placed", icon: CheckCircle },
  { key: "confirmed", label: "Order Confirmed", icon: CheckCircle },
  { key: "preparing", label: "Preparing", icon: ChefHat },
  { key: "ready", label: "Ready for Pickup", icon: Bell },
  { key: "served", label: "Served", icon: CheckCircle },
];

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIndex = statusSteps.findIndex(
    (step) => step.key === currentStatus,
  );

  return (
    <div className="space-y-4">
      {statusSteps.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <motion.div
            key={step.key}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center space-x-3"
          >
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                isCompleted
                  ? "bg-green-500 border-green-500 text-white"
                  : isCurrent
                    ? "bg-blue-500 border-blue-500 text-white"
                    : "bg-gray-100 border-gray-300 text-gray-400"
              }`}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div
                className={`font-medium ${
                  isCompleted || isCurrent ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {step.label}
              </div>
              {isCurrent && (
                <div className="text-sm text-blue-600">In progress...</div>
              )}
            </div>
            {isCurrent && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-blue-500"
              >
                <RefreshCw className="h-4 w-4" />
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function KOTGroupStatus({
  kotGroups,
}: {
  kotGroups: QROrderWithDetails["kotGroups"];
}) {
  const getDepartmentIcon = (department: string) => {
    switch (department) {
      case "kitchen":
        return ChefHat;
      case "bar":
        return Coffee;
      case "dessert":
        return IceCream;
      default:
        return ChefHat;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "text-green-600 bg-green-100";
      case "preparing":
        return "text-blue-600 bg-blue-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="space-y-3">
      {kotGroups.map((kotGroup) => {
        const Icon = getDepartmentIcon(kotGroup.department);
        return (
          <motion.div
            key={kotGroup.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full border border-gray-200">
                <Icon className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900 capitalize">
                  {kotGroup.department}
                </div>
                <div className="text-sm text-gray-600">
                  {kotGroup.items.length} item
                  {kotGroup.items.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
            <Badge
              className={`${getStatusColor(kotGroup.status)} border-0 font-medium`}
            >
              {kotGroup.status.charAt(0).toUpperCase() +
                kotGroup.status.slice(1)}
            </Badge>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function OrderTracking() {
  const [order, setOrder] = useState<QROrderWithDetails>(mockOrder);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
      // In a real app, this would fetch the latest order status
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getEstimatedTimeRemaining = () => {
    if (!order.estimatedTime || !order.createdAt) return null;
    const estimatedFinishTime = new Date(
      order.createdAt.getTime() + order.estimatedTime * 60000,
    );
    const now = new Date();
    const remaining = Math.max(
      0,
      Math.ceil((estimatedFinishTime.getTime() - now.getTime()) / 60000),
    );
    return remaining;
  };

  const getElapsedTime = () => {
    if (!order.createdAt) return 0;
    const now = new Date();
    return Math.floor((now.getTime() - order.createdAt.getTime()) / 60000);
  };

  const timeRemaining = getEstimatedTimeRemaining();
  const elapsedTime = getElapsedTime();
  const progressPercentage = order.estimatedTime
    ? Math.min(100, (elapsedTime / order.estimatedTime) * 100)
    : 0;

  const callWaiter = () => {
    // In a real app, this would send a notification to staff
    alert("Waiter has been notified. They will be with you shortly!");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Order Tracking
              </h1>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Order #{order.qrOrderNumber}</span>
                <span>•</span>
                <MapPin className="h-3 w-3" />
                <span>
                  {order.table.tableName} • {order.table.location}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
              className="text-gray-600"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Order Status */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900">Order Status</CardTitle>
              <Badge
                className={`${
                  order.status === "ready"
                    ? "bg-green-100 text-green-800"
                    : order.status === "preparing"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
                } border-0`}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusTimeline currentStatus={order.status} />

            {/* Time Information */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Estimated Time:</span>
                <span className="font-medium text-gray-900">
                  {order.estimatedTime} minutes
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Elapsed Time:</span>
                <span className="font-medium text-gray-900">
                  {elapsedTime} minutes
                </span>
              </div>
              {timeRemaining !== null && timeRemaining > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Time Remaining:</span>
                  <span className="font-medium text-blue-600">
                    ~{timeRemaining} minutes
                  </span>
                </div>
              )}
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Kitchen Status */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Kitchen Status</CardTitle>
          </CardHeader>
          <CardContent>
            <KOTGroupStatus kotGroups={order.kotGroups} />
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Your Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                  {item.product.image && (
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {item.product.name}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Quantity: {item.quantity}
                  </p>
                  {item.modifiers.length > 0 && (
                    <div className="text-sm text-gray-500 mt-1">
                      {item.modifiers.map((mod) => mod.name).join(", ")}
                    </div>
                  )}
                  {item.notes && (
                    <div className="text-sm text-gray-500 mt-1 italic">
                      Note: {item.notes}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    ${item.totalPrice.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              {order.taxes.map((tax) => (
                <div
                  key={tax.taxRuleId}
                  className="flex justify-between text-sm"
                >
                  <span>{tax.taxName}:</span>
                  <span>${tax.taxAmount.toFixed(2)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>${order.finalTotal.toFixed(2)}</span>
              </div>
            </div>

            {order.paymentMethod === "pay_at_table" && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center space-x-2 text-blue-800">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Payment: Pay at Table
                  </span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  You can pay when your order is ready
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={callWaiter}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Users className="h-4 w-4 mr-2" />
              Call Waiter
            </Button>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1 border-gray-200 text-gray-600"
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Restaurant
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-gray-200 text-gray-600"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            </div>
            <div className="text-center text-xs text-gray-500 mt-4">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
