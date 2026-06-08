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
  role: 'super_admin' | 'admin' | 'supervisor' | 'user' | 'cashier' | 'waiter' | 'mobile-kds' | 'kitchen-kds' | 'kiosk-machine';
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

export type SubscriptionPlanType = 'trial' | 'basic' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'suspended' | 'cancelled' | 'expired' | 'past_due';
export type InvoiceStatus = 'pending' | 'paid' | 'failed' | 'refunded';

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
  logo?: string;
  logo_url?: string;
  banner_image?: string;
  banner_url?: string;
  website_url?: string;
  status?: 'active' | 'inactive' | 'suspended';
  subscription_plan?: SubscriptionPlanType;
  subscription_status?: SubscriptionStatus;
  trial_ends_at?: string | null;
  max_users?: number;
  max_products?: number;
  max_orders_per_month?: number;
  current_users?: number;
  current_products?: number;
  current_orders_this_month?: number;
  features?: string[] | null;
  is_suspended?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description?: string | null;
  tagline?: string | null;
  price_monthly: number;
  price_yearly: number;
  discount_yearly: number;
  max_users: number;
  max_products: number;
  max_orders_per_month: number;
  max_locations: number;
  max_storage_gb: number;
  features?: string[] | null;
  is_active: boolean;
  is_public: boolean;
  is_featured: boolean;
  sort_order: number;
  badge?: string | null;
  trial_days: number;
  razorpay_plan_id_monthly?: string | null;
  razorpay_plan_id_yearly?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  restaurant_id: string;
  plan: SubscriptionPlanType;
  plan_name: string;
  status: SubscriptionStatus;
  price_per_month: number;
  price_per_year: number;
  billing_cycle: string;
  started_at: string;
  current_period_start?: string | null;
  current_period_end?: string | null;
  trial_end?: string | null;
  cancelled_at?: string | null;
  cancel_at_period_end: boolean;
  cancellation_reason?: string | null;
  payment_method?: string | null;
  next_payment_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionInvoice {
  id: string;
  subscription_id: string;
  restaurant_id: string;
  invoice_number: string;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  status: InvoiceStatus;
  invoice_date: string;
  due_date?: string | null;
  paid_at?: string | null;
  payment_method?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsageLimitMetric {
  current: number;
  max: number;
  available: number;
  percentage: number;
}

export interface UsageLimits {
  subscription_plan?: SubscriptionPlanType;
  subscription_status?: SubscriptionStatus;
  trial_ends_at?: string | null;
  is_operational?: boolean;
  users: UsageLimitMetric;
  products: UsageLimitMetric;
  orders: UsageLimitMetric;
}

export interface SubscriptionCheckoutResponse {
  subscription_id: string;
  razorpay_subscription_id: string;
  razorpay_key_id: string;
  plan_name: string;
  amount: number;
  currency: string;
  billing_cycle: string;
  prefill: { name?: string; email?: string; contact?: string };
}

// ==================== Homebanner Types ====================

export interface Homebanner {
  id: string;
  restaurant_id: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;

  // Image fields: may be URLs returned by backend; uploads use File on client side.
  mobile_image?: string | null;
  desktop_image?: string | null;
  mobile_image_url?: string | null; // compatibility
  desktop_image_url?: string | null; // compatibility

  redirect_url?: string | null;
  button_text?: string | null;
  active: boolean;
  featured: boolean;
  sort_order?: number | null;
  start_at?: string | null;
  end_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ==================== Row Management Types ====================

export type RowType =
  | "category"
  | "product"
  | "combo_product"
  | "single_banner"
  | "ads_banner"
  | "ads_video";

export interface RowManagement {
  id: string;
  restaurant_id: string;
  name: string;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  row_type: RowType;

  active: boolean;
  show_title?: boolean;
  sort_order?: number | null;
  layout_style?: string | null;
  items_per_view?: number | null;
  auto_scroll?: boolean;
  redirect_url?: string | null;
  button_text?: string | null;
  background_color?: string | null;
  text_color?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  metadata?: Record<string, any> | null;

  category_ids?: string[] | null;
  product_ids?: string[] | null;
  combo_product_ids?: string[] | null;

  image?: string | null;
  mobile_image?: string | null;
  desktop_image?: string | null;
  thumbnail_image?: string | null;
  video_url?: string | null;

  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
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

// ==================== Order Statistics ====================

export interface OrderStatistics {
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  pending_orders: number;
  confirmed_orders: number;
  preparing_orders: number;
  ready_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
}

// ==================== Backend Customer (API response) ====================

export interface BackendCustomer {
  id: string;
  restaurant_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  addresses?: any[];
}

export interface BackendCustomerListResponse {
  total: number;
  customers: BackendCustomer[];
}

// ==================== Staff ====================

export interface StaffMember {
  id: string;
  restaurant_id: string;
  user_id?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  department?: string | null;
  status?: string;
  is_active?: boolean;
  hourly_rate?: number | null;
  created_at?: string;
  updated_at?: string;
}

// ==================== Sales Report ====================

export interface SalesReport {
  id: string;
  restaurant_id: string;
  report_date?: string | null;
  report_month?: number | null;
  report_year?: number | null;
  period_type: 'daily' | 'monthly';
  total_orders: number;
  total_revenue: number;
  total_tax: number;
  total_discount: number;
  net_revenue: number;
  avg_order_value: number;
  created_at: string;
}

export interface ItemWiseReport {
  id: string;
  restaurant_id: string;
  product_id?: string;
  product_name?: string;
  category_name?: string;
  quantity_sold: number;
  total_revenue: number;
  total_cost?: number;
  profit?: number;
  report_date?: string;
  created_at: string;
}

export interface CategoryWiseReport {
  id: string;
  restaurant_id: string;
  category_id?: string;
  category_name?: string;
  total_revenue: number;
  quantity_sold: number;
  report_date?: string;
  created_at: string;
}
