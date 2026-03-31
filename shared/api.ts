// Shared API types between client and server

export interface DemoResponse {
  message: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'super_admin' | 'admin' | 'supervisor' | 'user';
  status?: string;
  avatar?: string | null;
  permissions?: string[];
  join_date?: string;
  created_at?: string;
  updated_at?: string;
  organizationId?: string;
  branchId?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  business_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  logo_url?: string;
  banner_url?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  description?: string;
  image_url?: string;
  image?: string | File; // For compatibility and uploads
  icon?: string | null;
  banner_image?: string | null;
  thumbnail?: string | null;

  // Display & Styling
  is_active: boolean;
  active: boolean; // For compatibility
  sort_order: number;
  sort_order_alias?: number;
  is_featured?: boolean;
  display_type?: string | null;
  items_per_row?: number | null;
  color?: string | null;
  background_color?: string | null;
  text_color?: string | null;

  // Visibility
  show_in_menu?: boolean;
  show_in_homepage?: boolean;
  show_in_pos?: boolean;

  // Availability
  available_for_delivery?: boolean;
  available_for_takeaway?: boolean;
  available_for_dine_in?: boolean;
  available_from_time?: string | null;
  available_to_time?: string | null;
  available_days?: Record<string, boolean> | null;

  // SEO & Meta
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;

  product_count?: number; // compatibility
  productCount?: number; // compatibility
}

export interface Product {
  id: string;
  restaurant_id?: string; // compatibility
  category_id?: string; // compatibility
  name: string;
  slug?: string; // compatibility
  description?: string;
  price: number;
  cost?: number;
  sku?: string;
  stock_quantity?: number; // compatibility
  stock: number; // For compatibility
  is_available?: boolean; // compatibility
  available: boolean; // For compatibility
  image_url?: string;
  image?: string | File; // For compatibility and uploads
  featured: boolean;
  tags: string[];
  min_stock?: number;
  minStock?: number; // For compatibility
  updated_at?: string; // compatibility
  department?: string; // For compatibility
  printerTag?: string; // For compatibility
  category?: string; // compatibility
  margin?: number; // compatibility
  modifiers?: string[] | any[]; // compatibility
}

export interface Order {
  id: string;
  restaurant_id?: string; // compatibility
  order_number?: string; // compatibility
  table_id?: string;
  customer_id?: string;
  guest_name?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  total_amount: number;
  created_at?: string | Date; // compatibility
  restaurant_id_alias?: string; // compatibility
  order_number_alias?: string; // compatibility
  table_id_alias?: string; // compatibility
  createdAt?: string | Date; // compatibility
  updatedAt?: string | Date; // compatibility
  subtotal?: number; // compatibility
  taxes?: TaxCalculation[]; // compatibility
  paymentMethod?: string; // compatibility
  paymentStatus?: string; // compatibility
}

// ==================== Tax & Calculation ====================

export interface TaxRule {
  id: string;
  name: string;
  type: 'CGST' | 'SGST' | 'VAT' | 'SERVICE_TAX' | 'CUSTOM';
  percentage: number;
  applicableOn: 'all' | 'dine_in' | 'takeaway' | 'delivery';
  categories?: string[];
  minAmount?: number;
  maxAmount?: number;
  isCompounded: boolean;
  active: boolean;
}

export interface TaxCalculation {
  taxRuleId: string;
  taxName: string;
  taxableAmount: number;
  taxAmount: number;
  taxPercentage: number;
}

// ==================== Filters & Pagination ====================

export interface Pagination {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface CategoryFilters {
  active?: boolean;
  page?: number;
  page_size?: number;
}

export interface ProductFilters {
  active?: boolean;
  category_id?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface OrderFilters {
  status?: string;
  restaurant_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

export interface ModifierFilters {
  active?: boolean;
  available?: boolean;
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export type CategoryListResponse = PaginatedResponse<Category>;
export type ProductListResponse = PaginatedResponse<Product>;
export type OrderListResponse = PaginatedResponse<Order>;

// ==================== Combo Types ====================

export interface ComboItemInput {
  product_id: string;
  quantity: number;
  required?: boolean;
  choice_group?: string;
  choices?: string[];
  sort_order?: number;
  // Backward compatibility with older payloads
  substitute_options?: string[];
}

export interface Combo {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  category_id: string;
  image?: string;
  available: boolean;
  featured: boolean;
  tags: string[];
  valid_from?: string;
  valid_until?: string;
  max_quantity_per_order?: number;
  restaurant_id: string;
  items?: ComboItemInput[];
}

// ==================== Customer Types ====================

export interface CustomerTag {
  id: string;
  name: string;
  color: string;
  benefits: string[];
}

export interface LoyaltyRule {
  id: string;
  name: string;
  earnRate: number;
  redeemRate: number;
  minRedeemPoints: number;
  maxRedeemPercentage: number;
  expiryDays?: number;
  active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  tags: CustomerTag[];
  loyaltyPoints: number;
  totalSpent: number;
  visitCount: number;
  lastVisit?: Date;
  notes?: string;
  isBlacklisted: boolean;
  createdAt: Date;
}

// ==================== QR & Table Types ====================

export interface QRTable {
  id: string;
  restaurant_id?: string;
  tableNumber: string;
  tableName: string;
  location: string;
  capacity: number;
  min_capacity?: number;
  floor?: string;
  section?: string;
  position_x?: number;
  position_y?: number;
  image?: string;
  qr_code?: string;
  status?: "available" | "occupied" | "reserved" | "cleaning" | "maintenance" | string;
  is_bookable?: boolean;
  is_outdoor?: boolean;
  is_accessible?: boolean;
  has_power_outlet?: boolean;
  minimum_spend?: number;
  description?: string;
  notes?: string;
  qrCodeUrl: string;
  qrToken: string;
  isActive: boolean;
  isOccupied: boolean;
  currentSessionId?: string;
  createdAt: Date;
  lastUsed?: Date;
}

export interface QRSession {
  id: string;
  tableId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'cancelled';
  customerCount?: number; // compatibility
}

export interface QRSettings {
  id: string;
  restaurantName: string;
  primaryColor: string;
  accentColor: string;
  enableOnlineOrdering: boolean;
  enablePaymentAtTable: boolean;
  enableOnlinePayment: boolean;
  serviceChargePercentage: number;
  autoConfirmOrders: boolean;
  orderTimeoutMinutes: number;
  maxOrdersPerSession: number;
  enableCustomerInfo: boolean;
  enableSpecialInstructions: boolean;
  enableOrderTracking: boolean;
  welcomeMessage: string;
  logo?: string;
  termsAndConditions?: string;
  contactInfo: {
    phone: string;
    email: string;
    address?: string;
  };
  businessHours: Record<string, { isOpen: boolean; openTime: string; closeTime: string }>;
  paymentGateways: PaymentGateway[];
}

export interface PaymentGateway {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  config: Record<string, any>;
}

// ==================== QR Cart Types ====================

export interface QRCartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  modifiers: {
    modifierId: string;
    optionId: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  specialInstructions?: string;
  itemTotal: number;
}

export interface QRCart {
  sessionId: string;
  items: QRCartItem[];
  subtotal: number;
  taxes: TaxCalculation[];
  serviceCharge: number;
  totalAmount: number;
  lastUpdated: Date;
}

export interface QRModifier {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  options: {
    id: string;
    name: string;
    price: number;
    available: boolean;
  }[];
}

export interface QRMenuItem {
  id: string;
  productId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  tags: string[];
  available: boolean;
  preparationTime?: number;
  nutritionalInfo?: {
    calories: number;
    allergens: string[];
  };
  modifiers: QRModifier[];
}

export interface SelectedModifier {
  modifierId: string;
  optionId: string;
  name: string;
  price: number;
  quantity: number;
}

// ==================== Live Queue & KOT Types ====================

export interface KOTGroup {
  id?: string;
  orderId?: string;
  department: string;
  status: 'pending' | 'acknowledged' | 'preparing' | 'ready' | 'served' | 'cancelled';
  itemCount?: number;
  items?: any[];
  printerName?: string;
  createdAt?: Date;
  acknowledgedAt?: Date;
  readyAt?: Date;
  estimatedTime?: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface OrderQueueItem {
  orderId: string;
  id?: string; // compatibility
  orderNumber: string;
  customerName?: string;
  tableNumber?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  orderType: 'dine_in' | 'takeaway' | 'delivery' | 'qr_order';
  totalItems: number;
  estimatedTime: number;
  elapsedTime: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  kotGroups: KOTGroup[];
}

// ==================== QR Order Tracking Types ====================

export type QROrderStatus = 'placed' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'cancelled';

export interface QROrderWithDetails extends Order {
  orderId: string;
  qrOrderNumber: string;
  sessionId: string;
  deviceFingerprint?: string;
  customerName?: string;
  customerPhone?: string;
  items: any[];
  totalTax: number;
  loyaltyPointsUsed: number;
  loyaltyDiscount: number;
  finalTotal: number;
  orderType: 'qr_order';
  status: any; // Allow for different status set
  estimatedTime?: number;
  actualTime?: number;
  kotGroups: KOTGroup[];
  table: QRTable;
  session: QRSession & {
    deviceFingerprint?: string;
    ipAddress?: string;
    lastActivity?: Date;
    expiresAt?: Date;
    ordersCount?: number;
    totalAmount?: number;
    customerInfo?: any;
  };
  modifications?: any[];
}

export interface Modifier {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  active: boolean; // compatibility
  created_at: string;
  updated_at: string;
}

export interface ModifierOption {
  id: string;
  restaurant_id?: string;
  modifier_id: string;
  name: string;
  price?: number;
  price_adjustment?: number; // compatibility
  available?: boolean;
  is_available?: boolean; // compatibility
  hidden?: boolean;
  is_hidden?: boolean; // compatibility
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}
