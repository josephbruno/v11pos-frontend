import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CreditCard,
  Banknote,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  Edit,
  Trash2,
  Plus,
  Minus,
  Phone,
  Mail,
  User,
  FileText,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { QRCart, QRTable, QRSettings } from "@/shared/api";

// Mock data
const mockTable: QRTable = {
  id: "table-1",
  tableNumber: "T-05",
  tableName: "Table 5",
  location: "Main Floor",
  capacity: 4,
  qrCodeUrl: "https://yourpos.com/qr-order/TABLE-05-abc123",
  qrToken: "abc123def456",
  isActive: true,
  isOccupied: false,
  createdAt: new Date("2024-01-01"),
  lastUsed: new Date("2024-01-21"),
};

const mockSettings: QRSettings = {
  id: "settings-1",
  restaurantName: "Bella Vista Restaurant",
  primaryColor: "#00A19D",
  accentColor: "#FF6D00",
  enableOnlineOrdering: true,
  enablePaymentAtTable: true,
  enableOnlinePayment: true,
  serviceChargePercentage: 10,
  autoConfirmOrders: false,
  orderTimeoutMinutes: 30,
  maxOrdersPerSession: 10,
  enableCustomerInfo: true,
  enableSpecialInstructions: true,
  enableOrderTracking: true,
  welcomeMessage: "Welcome!",
  contactInfo: {
    phone: "+1 (555) 123-4567",
    email: "orders@bellavista.com",
  },
  businessHours: {},
  paymentGateways: [
    {
      id: "razorpay",
      name: "Razorpay",
      type: "razorpay",
      enabled: true,
      config: {
        publicKey: "rzp_test_1234567890",
        currency: "USD",
        supportedMethods: ["card", "upi", "netbanking"],
      },
    },
    {
      id: "stripe",
      name: "Stripe",
      type: "stripe",
      enabled: true,
      config: {
        publicKey: "pk_test_1234567890",
        currency: "USD",
        supportedMethods: ["card"],
      },
    },
  ],
};

const mockCart: QRCart = {
  sessionId: "session-123",
  items: [
    {
      id: "item-1",
      productId: "1",
      name: "Classic Burger",
      price: 12.99,
      quantity: 1,
      modifiers: [
        {
          modifierId: "cooking",
          optionId: "medium",
          name: "Medium",
          price: 0,
          quantity: 1,
        },
        {
          modifierId: "extras",
          optionId: "cheese",
          name: "Extra Cheese",
          price: 1.5,
          quantity: 1,
        },
      ],
      specialInstructions: "No onions please",
      itemTotal: 14.49,
    },
    {
      id: "item-2",
      productId: "2",
      name: "French Fries",
      price: 4.99,
      quantity: 1,
      modifiers: [
        {
          modifierId: "size",
          optionId: "large",
          name: "Large",
          price: 2,
          quantity: 1,
        },
      ],
      itemTotal: 6.99,
    },
    {
      id: "item-3",
      productId: "3",
      name: "Coca Cola",
      price: 2.99,
      quantity: 2,
      modifiers: [
        {
          modifierId: "size",
          optionId: "medium",
          name: "Medium",
          price: 1,
          quantity: 2,
        },
      ],
      itemTotal: 7.98,
    },
  ],
  subtotal: 29.46,
  taxes: [
    {
      taxRuleId: "tax-1",
      taxName: "Sales Tax",
      taxableAmount: 29.46,
      taxAmount: 2.36,
      taxPercentage: 8,
    },
  ],
  serviceCharge: 2.95,
  totalAmount: 34.77,
  lastUpdated: new Date(),
};

interface CustomerInfo {
  name?: string;
  phone?: string;
  email?: string;
  guestCount?: number;
}

export default function QRCheckout() {
  const { tableToken } = useParams<{ tableToken: string }>();
  const navigate = useNavigate();
  const [cart, setCart] = useState<QRCart>(mockCart);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({});
  const [paymentMethod, setPaymentMethod] = useState<"online" | "pay_at_table">(
    "pay_at_table",
  );
  const [orderNotes, setOrderNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [selectedPaymentGateway, setSelectedPaymentGateway] =
    useState<string>("");

  useEffect(() => {
    // Load customer info from session storage
    const savedInfo = sessionStorage.getItem("customerInfo");
    if (savedInfo) {
      setCustomerInfo(JSON.parse(savedInfo));
    }

    // Set default payment gateway
    if (mockSettings.paymentGateways.length > 0) {
      setSelectedPaymentGateway(mockSettings.paymentGateways[0].id);
    }
  }, []);

  const updateCartQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart((prev) => {
      const newItems = prev.items.map((item) => {
        if (item.id === itemId) {
          const basePrice =
            item.price +
            item.modifiers.reduce((sum, mod) => sum + mod.price, 0);
          return {
            ...item,
            quantity: newQuantity,
            itemTotal: basePrice * newQuantity,
          };
        }
        return item;
      });

      const subtotal = newItems.reduce((sum, item) => sum + item.itemTotal, 0);
      const serviceCharge =
        subtotal * (mockSettings.serviceChargePercentage / 100);
      const taxes = prev.taxes.map((tax) => ({
        ...tax,
        taxableAmount: subtotal,
        taxAmount: (subtotal * tax.taxPercentage) / 100,
      }));
      const totalTax = taxes.reduce((sum, tax) => sum + tax.taxAmount, 0);
      const totalAmount = subtotal + serviceCharge + totalTax;

      return {
        ...prev,
        items: newItems,
        subtotal,
        serviceCharge,
        taxes,
        totalAmount,
        lastUpdated: new Date(),
      };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const newItems = prev.items.filter((item) => item.id !== itemId);
      const subtotal = newItems.reduce((sum, item) => sum + item.itemTotal, 0);
      const serviceCharge =
        subtotal * (mockSettings.serviceChargePercentage / 100);
      const taxes = prev.taxes.map((tax) => ({
        ...tax,
        taxableAmount: subtotal,
        taxAmount: (subtotal * tax.taxPercentage) / 100,
      }));
      const totalTax = taxes.reduce((sum, tax) => sum + tax.taxAmount, 0);
      const totalAmount = subtotal + serviceCharge + totalTax;

      return {
        ...prev,
        items: newItems,
        subtotal,
        serviceCharge,
        taxes,
        totalAmount,
        lastUpdated: new Date(),
      };
    });
  };

  const handleSubmitOrder = async () => {
    if (!agreedToTerms) {
      alert("Please agree to the terms and conditions");
      return;
    }

    if (paymentMethod === "online" && !selectedPaymentGateway) {
      alert("Please select a payment method");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate order submission
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create order object
      const orderData = {
        tableId: mockTable.id,
        items: cart.items,
        customerInfo,
        paymentMethod,
        paymentGateway:
          paymentMethod === "online" ? selectedPaymentGateway : undefined,
        orderNotes,
        subtotal: cart.subtotal,
        serviceCharge: cart.serviceCharge,
        taxes: cart.taxes,
        totalAmount: cart.totalAmount,
      };

      console.log("Order submitted:", orderData);

      if (paymentMethod === "online") {
        // Simulate payment gateway redirect
        alert("Redirecting to payment gateway...");
        // In real app, integrate with actual payment gateway
      }

      // Navigate to order tracking
      const orderId = "qr-order-" + Date.now();
      navigate(`/qr-order/${orderId}/track`);
    } catch (error) {
      console.error("Order submission failed:", error);
      alert("Failed to submit order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEstimatedTime = () => {
    const baseTime = 15; // Base prep time
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    return baseTime + Math.floor(itemCount / 2) * 5; // Add 5 minutes per 2 items
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Cart is Empty
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Add items to your cart before proceeding to checkout
            </p>
            <Button
              onClick={() => navigate(`/qr-menu/${tableToken}/menu`)}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Back to Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/qr-menu/${tableToken}/menu`)}
                className="text-gray-600"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Checkout</h1>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-3 w-3" />
                  <span>
                    {mockTable.tableName} • {mockTable.location}
                  </span>
                </div>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              {cart.items.reduce((sum, item) => sum + item.quantity, 0)} items
            </Badge>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Order Summary */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900">Order Summary</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/qr-menu/${tableToken}/menu`)}
                className="text-blue-600 border-blue-200"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.items.map((item) => (
              <div
                key={item.id}
                className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  {item.modifiers.length > 0 && (
                    <div className="text-sm text-gray-600 mt-1">
                      {item.modifiers.map((mod) => mod.name).join(", ")}
                    </div>
                  )}
                  {item.specialInstructions && (
                    <div className="text-sm text-gray-500 mt-1 italic">
                      "{item.specialInstructions}"
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateCartQuantity(item.id, item.quantity - 1)
                        }
                        className="h-6 w-6 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-8 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateCartQuantity(item.id, item.quantity + 1)
                        }
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-600 h-6 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    ${item.itemTotal.toFixed(2)}
                  </div>
                </div>
              </div>
            ))}

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${cart.subtotal.toFixed(2)}</span>
              </div>
              {cart.serviceCharge > 0 && (
                <div className="flex justify-between text-sm">
                  <span>
                    Service Charge ({mockSettings.serviceChargePercentage}%):
                  </span>
                  <span>${cart.serviceCharge.toFixed(2)}</span>
                </div>
              )}
              {cart.taxes.map((tax) => (
                <div
                  key={tax.taxRuleId}
                  className="flex justify-between text-sm"
                >
                  <span>
                    {tax.taxName} ({tax.taxPercentage}%):
                  </span>
                  <span>${tax.taxAmount.toFixed(2)}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${cart.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2 text-blue-800 text-sm">
                <Clock className="h-4 w-4" />
                <span>
                  Estimated preparation time: {getEstimatedTime()} minutes
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900">
                Customer Information
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomerForm(!showCustomerForm)}
                className="text-blue-600 border-blue-200"
              >
                <Edit className="h-4 w-4 mr-1" />
                {customerInfo.name ? "Edit" : "Add"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {customerInfo.name || customerInfo.phone ? (
              <div className="space-y-2">
                {customerInfo.name && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{customerInfo.name}</span>
                  </div>
                )}
                {customerInfo.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{customerInfo.phone}</span>
                  </div>
                )}
                {customerInfo.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{customerInfo.email}</span>
                  </div>
                )}
                {customerInfo.guestCount && (
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">
                      {customerInfo.guestCount} guests
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">
                No customer information provided
              </div>
            )}

            <AnimatePresence>
              {showCustomerForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-gray-900">Name</Label>
                      <Input
                        value={customerInfo.name || ""}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            name: e.target.value,
                          })
                        }
                        placeholder="Your name"
                        className="bg-gray-50 border-gray-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-gray-900">Phone</Label>
                      <Input
                        value={customerInfo.phone || ""}
                        onChange={(e) =>
                          setCustomerInfo({
                            ...customerInfo,
                            phone: e.target.value,
                          })
                        }
                        placeholder="+1 (555) 123-4567"
                        type="tel"
                        className="bg-gray-50 border-gray-200"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-900">Email (Optional)</Label>
                    <Input
                      value={customerInfo.email || ""}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          email: e.target.value,
                        })
                      }
                      placeholder="your@email.com"
                      type="email"
                      className="bg-gray-50 border-gray-200"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Special Instructions */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">
              Special Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Any special requests or dietary requirements..."
              className="bg-gray-50 border-gray-200"
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockSettings.enablePaymentAtTable && (
              <div
                onClick={() => setPaymentMethod("pay_at_table")}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === "pay_at_table"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      paymentMethod === "pay_at_table"
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}
                  />
                  <Banknote className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">
                      Pay at Table
                    </div>
                    <div className="text-sm text-gray-600">
                      Pay when your order is ready (Cash or Card)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {mockSettings.enableOnlinePayment && (
              <div
                onClick={() => setPaymentMethod("online")}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === "online"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      paymentMethod === "online"
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}
                  />
                  <CreditCard className="h-5 w-5 text-gray-600" />
                  <div>
                    <div className="font-medium text-gray-900">Pay Online</div>
                    <div className="text-sm text-gray-600">
                      Pay now with credit card or digital wallet
                    </div>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "online" &&
              mockSettings.paymentGateways.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="ml-7 space-y-3"
                >
                  <Label className="text-gray-900">
                    Choose Payment Gateway
                  </Label>
                  <Select
                    value={selectedPaymentGateway}
                    onValueChange={setSelectedPaymentGateway}
                  >
                    <SelectTrigger className="bg-gray-50 border-gray-200">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockSettings.paymentGateways
                        .filter((gateway) => gateway.enabled)
                        .map((gateway) => (
                          <SelectItem key={gateway.id} value={gateway.id}>
                            {gateway.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              )}
          </CardContent>
        </Card>

        {/* Terms and Conditions */}
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Switch
                checked={agreedToTerms}
                onCheckedChange={setAgreedToTerms}
                className="mt-1"
              />
              <div className="flex-1">
                <Label className="text-gray-900 font-medium">
                  I agree to the terms and conditions
                </Label>
                <p className="text-sm text-gray-600 mt-1">
                  By placing this order, you agree to our terms of service and
                  privacy policy. Please inform our staff of any food allergies
                  or dietary restrictions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="sticky bottom-0 bg-gray-50 p-4 -mx-4">
          <Button
            onClick={handleSubmitOrder}
            disabled={isSubmitting || !agreedToTerms}
            className="w-full bg-primary hover:bg-primary/90 text-white py-4 text-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                Placing Order...
              </>
            ) : (
              <>
                <CheckCircle className="mr-3 h-5 w-5" />
                Place Order • ${cart.totalAmount.toFixed(2)}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
