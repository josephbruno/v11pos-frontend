import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  QrCode,
  MapPin,
  Users,
  Clock,
  Phone,
  Wifi,
  ChefHat,
  Star,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CustomerLoginModal } from "@/components/CustomerLoginModal";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import type { QRTable, QRSettings } from "@/shared/api";

// Mock data - in real app, this would be fetched based on table token
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
  logo: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=200",
  primaryColor: "#00A19D",
  accentColor: "#FF6D00",
  enableOnlineOrdering: true,
  enablePaymentAtTable: true,
  enableOnlinePayment: false,
  serviceChargePercentage: 10,
  autoConfirmOrders: false,
  orderTimeoutMinutes: 30,
  maxOrdersPerSession: 10,
  enableCustomerInfo: true,
  enableSpecialInstructions: true,
  enableOrderTracking: true,
  welcomeMessage:
    "Welcome to Bella Vista! Please make yourself comfortable and enjoy our delicious menu. Scan the QR code to place your order directly from your table.",
  termsAndConditions:
    "By placing an order, you agree to our terms and conditions. Please inform staff of any allergies.",
  contactInfo: {
    phone: "+1 (555) 123-4567",
    email: "orders@bellavista.com",
    address: "123 Restaurant Street, Food City, FC 12345",
  },
  businessHours: {
    monday: { isOpen: true, openTime: "11:00", closeTime: "22:00" },
    tuesday: { isOpen: true, openTime: "11:00", closeTime: "22:00" },
    wednesday: { isOpen: true, openTime: "11:00", closeTime: "22:00" },
    thursday: { isOpen: true, openTime: "11:00", closeTime: "22:00" },
    friday: { isOpen: true, openTime: "11:00", closeTime: "23:00" },
    saturday: { isOpen: true, openTime: "11:00", closeTime: "23:00" },
    sunday: { isOpen: true, openTime: "12:00", closeTime: "21:00" },
  },
  paymentGateways: [],
};

const mockBusinessInfo = {
  rating: 4.8,
  reviewCount: 1247,
  cuisine: "Mediterranean • Italian",
  priceRange: "$$",
  specialties: ["Wood-fired Pizza", "Fresh Pasta", "Grilled Seafood"],
  averagePrepTime: "15-25 min",
  wifi: "BellaVista_Guest",
  wifiPassword: "delicious123",
};

// Removed old CustomerInfoForm as we use CustomerLoginModal now

export default function QRMenuLanding() {
  const { tableToken } = useParams<{ tableToken: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [table, setTable] = useState<QRTable | null>(null);
  const [settings, setSettings] = useState<QRSettings | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { customer, logout } = useCustomerAuth();

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Simulate loading table and restaurant data
  useEffect(() => {
    const loadTableData = async () => {
      setLoading(true);
      try {
        // Simulate API call delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // In real app, validate table token and fetch data
        if (!tableToken) {
          setError("Invalid QR code. Please scan a valid table QR code.");
          return;
        }

        // Mock validation - in real app, this would be an API call
        if (mockTable.isActive) {
          setTable(mockTable);
          setSettings(mockSettings);
        } else {
          setError("This table is currently not available for ordering.");
        }
      } catch (err) {
        setError("Failed to load table information. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadTableData();
  }, [tableToken]);

  const isRestaurantOpen = () => {
    if (!settings) return false;

    const now = new Date();
    const dayName = now
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();
    const businessHour = settings.businessHours[dayName];

    if (!businessHour?.isOpen) return false;

    const currentTime = now.toTimeString().slice(0, 5);
    return (
      currentTime >= businessHour.openTime! &&
      currentTime <= businessHour.closeTime!
    );
  };

  const proceedToMenu = () => {
    if (!customer && settings?.enableCustomerInfo) {
      setIsLoginModalOpen(true);
    } else {
      navigate(`/qr-menu/${tableToken}/menu`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-white border-red-200">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Unable to Load Menu
            </h2>
            <p className="text-gray-600 text-sm mb-4">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!table || !settings) {
    return null;
  }

  const restaurantOpen = isRestaurantOpen();

  // Removed local showCustomerForm view

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative">
        {settings.logo && (
          <div className="h-48 bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800"
              alt="Restaurant"
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40" />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center space-x-3">
                {settings.logo && (
                  <div className="w-16 h-16 bg-white rounded-full p-2">
                    <img
                      src={settings.logo}
                      alt={settings.restaurantName}
                      className="w-full h-full object-cover rounded-full"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-white">
                    {settings.restaurantName}
                  </h1>
                  <div className="flex items-center space-x-2 text-white/90 text-sm">
                    <Star className="h-4 w-4" />
                    <span>{mockBusinessInfo.rating}</span>
                    <span>•</span>
                    <span>{mockBusinessInfo.reviewCount} reviews</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Restaurant Status */}
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${restaurantOpen ? "bg-green-500" : "bg-red-500"}`}
                />
                <div>
                  <div className="font-medium text-gray-900">
                    {restaurantOpen ? "Open Now" : "Closed"}
                  </div>
                  <div className="text-sm text-gray-600">
                    {mockBusinessInfo.cuisine} • {mockBusinessInfo.priceRange}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Prep time</div>
                <div className="font-medium text-gray-900">
                  {mockBusinessInfo.averagePrepTime}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table Information */}
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900">Your Table</h2>
              <QrCode className="h-5 w-5 text-gray-400" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {table.tableName} • {table.location}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  Up to {table.capacity} guests
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Welcome Message */}
        {settings.welcomeMessage && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <ChefHat className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-blue-900 mb-1">Welcome!</div>
                  <p className="text-blue-800 text-sm">
                    {settings.welcomeMessage}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Restaurant Specialties */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Today's Specialties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockBusinessInfo.specialties.map((specialty, index) => (
              <div key={index} className="flex items-center space-x-3">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-gray-700">{specialty}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Wi-Fi Information */}
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Wifi className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="font-medium text-gray-900">Free Wi-Fi</div>
                  <div className="text-sm text-gray-600">
                    Network: {mockBusinessInfo.wifi}
                  </div>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800 text-xs">
                Password: {mockBusinessInfo.wifiPassword}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-gray-900 mb-3">Contact Us</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {settings.contactInfo.phone}
                </span>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <span className="text-gray-600">
                  {settings.contactInfo.address}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="sticky bottom-0 bg-gray-50 p-4 -mx-4">
          {restaurantOpen ? (
            <div className="space-y-2">
              {customer && (
                <div className="text-sm text-center text-gray-600 mb-2">
                  Welcome back, {customer.name || customer.email}!
                  <button onClick={logout} className="ml-2 text-blue-500 hover:underline">Logout</button>
                </div>
              )}
              <Button
                onClick={proceedToMenu}
                className="w-full bg-primary hover:bg-primary/90 text-white py-4 text-lg"
              >
                <ChefHat className="mr-3 h-5 w-5" />
                View Menu & Order
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-4">
                <AlertCircle className="h-5 w-5 mx-auto mb-2" />
                <p className="font-medium">We're currently closed</p>
                <p className="text-sm">
                  Please visit us during our business hours
                </p>
              </div>
              <Button
                disabled
                className="w-full bg-gray-400 text-gray-600 py-4 text-lg"
              >
                Menu Unavailable
              </Button>
            </div>
          )}
        </div>

        {/* Terms */}
        {settings.termsAndConditions && (
          <div className="text-xs text-gray-500 text-center px-4">
            {settings.termsAndConditions}
          </div>
        )}
      </div>

      <CustomerLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        restaurantId={table.restaurant_id || "mock-restaurant-id"}
      />
    </div>
  );
}
