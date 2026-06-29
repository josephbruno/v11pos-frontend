import type { QRSettings } from "@/shared/api";

const mockQRSettings: QRSettings = {
  id: "settings-1",
  restaurantName: "RestaurantPOS",
  primaryColor: "#00A19D",
  accentColor: "#FF6D00",
  enableOnlineOrdering: true,
  enablePaymentAtTable: true,
  enableOnlinePayment: false,
  serviceChargePercentage: 10,
  autoConfirmOrders: false,
  orderTimeoutMinutes: 30,
  maxOrdersPerSession: 10,
  enableCustomerInfo: false,
  enableSpecialInstructions: true,
  enableOrderTracking: true,
  welcomeMessage:
    "Welcome! Please scan the QR code to view our menu and place your order.",
  contactInfo: {
    phone: "+1 (555) 123-4567",
    email: "orders@restaurantpos.com",
    address: "123 Restaurant Street, Food City, FC 12345",
  },
  businessHours: {
    monday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
    tuesday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
    wednesday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
    thursday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
    friday: { isOpen: true, openTime: "09:00", closeTime: "23:00" },
    saturday: { isOpen: true, openTime: "09:00", closeTime: "23:00" },
    sunday: { isOpen: true, openTime: "10:00", closeTime: "21:00" },
  },
  paymentGateways: [],
};

export { mockQRSettings };

export type EditTableFormValues = {
  restaurant_id: string;
  table_number: string;
  table_name: string;
  capacity: number;
  min_capacity: number | "";
  floor: string;
  section: string;
  position_x: number | "";
  position_y: number | "";
  image: string;
  qr_code: string;
  status: string;
  is_bookable: boolean;
  is_outdoor: boolean;
  is_accessible: boolean;
  has_power_outlet: boolean;
  minimum_spend: number | "";
  description: string;
  notes: string;
  is_active: boolean;
  image_file?: File | null;
};
