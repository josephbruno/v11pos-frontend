/**
 * API Services - Organized API calls by domain
 * Import these functions to make API calls with automatic authentication
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "./apiClient";

// ==================== Auth Services ====================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    avatar: string | null;
    permissions: string[];
    join_date: string;
    created_at: string;
    updated_at: string;
  };
}

// Note: Login is handled in AuthContext, but keeping this for reference
export async function loginUser(email: string, password: string) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });

  if (!response.ok) throw new Error("Login failed");
  return response.json() as Promise<LoginResponse>;
}

// ==================== User Services ====================

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  avatar?: string | null;
  permissions?: string[];
  join_date?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getCurrentUser() {
  return apiGet<User>("/users/me");
}

export async function getUsers() {
  return apiGet<User[]>("/users");
}

export async function getUserById(userId: string) {
  return apiGet<User>(`/users/${userId}`);
}

export async function createUser(userData: Partial<User>) {
  return apiPost<User>("/users", userData);
}

export async function updateUser(userId: string, userData: Partial<User>) {
  return apiPut<User>(`/users/${userId}`, userData);
}

export async function deleteUser(userId: string) {
  return apiDelete(`/users/${userId}`);
}

// ==================== Product Services ====================

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: number; // Price in cents
  cost?: number; // Cost in cents
  category_id?: string | null;
  sku?: string | null;
  stock: number;
  min_stock?: number;
  available: boolean;
  featured: boolean;
  image?: string | null;
  images?: string[];
  tags?: string[];
  department?: string | null;
  printer_tag?: string | null;
  preparation_time?: number | null;
  nutritional_info?: any | null;
  created_at: string;
  updated_at: string;
}

export interface ProductListResponse {
  status: string;
  message: string;
  data: Product[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

export interface ProductFilters {
  page?: number;
  page_size?: number;
  search?: string;
  category_id?: string;
  available?: boolean;
  featured?: boolean;
  min_price?: number;
  max_price?: number;
}

/**
 * Get paginated list of products with optional filters
 */
export async function getProducts(filters?: ProductFilters) {
  const params = new URLSearchParams();
  
  if (filters) {
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.page_size) params.append("page_size", filters.page_size.toString());
    if (filters.search) params.append("search", filters.search);
    if (filters.category_id) params.append("category_id", filters.category_id);
    if (filters.available !== undefined) params.append("available", filters.available.toString());
    if (filters.featured !== undefined) params.append("featured", filters.featured.toString());
    if (filters.min_price) params.append("min_price", filters.min_price.toString());
    if (filters.max_price) params.append("max_price", filters.max_price.toString());
  }

  const queryString = params.toString();
  const endpoint = queryString ? `/products/?${queryString}` : "/products/";
  
  return apiGet<ProductListResponse>(endpoint);
}

/**
 * Get a single product by ID
 */
export async function getProductById(productId: string) {
  return apiGet<Product>(`/products/${productId}`);
}

/**
 * Create a new product
 */
export async function createProduct(productData: {
  name: string;
  slug: string;
  category_id: string;
  price: number; // in cents
  description?: string;
  sku?: string;
  stock?: number;
  is_available?: boolean;
  image?: File | null;
}) {
  console.log('Creating product with data:', productData);
  
  const formData = new FormData();
  formData.append("name", productData.name);
  formData.append("slug", productData.slug);
  formData.append("category_id", productData.category_id);
  formData.append("price", String(productData.price));
  
  if (productData.description) {
    formData.append("description", productData.description);
  }
  if (productData.sku) {
    formData.append("sku", productData.sku);
  }
  if (productData.stock !== undefined) {
    formData.append("stock", String(productData.stock));
  }
  if (productData.is_available !== undefined) {
    formData.append("is_available", String(productData.is_available));
  }
  if (productData.image) {
    formData.append("image", productData.image);
    console.log('Image file attached:', productData.image.name, productData.image.size);
  }

  // Log FormData contents
  console.log('FormData entries:');
  for (const [key, value] of formData.entries()) {
    console.log(`${key}:`, value);
  }

  // Import apiUpload from apiClient
  const { apiUpload } = await import('./apiClient');
  
  interface ProductResponse {
    id: string;
    name: string;
    slug: string;
    description?: string;
    price: number;
    category_id: string;
    sku?: string;
    stock: number;
    is_available: boolean;
    image_url?: string;
    created_at: string;
    updated_at: string;
  }
  
  try {
    // Use fetch directly to ensure proper multipart/form-data handling
    const token = localStorage.getItem("token");
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
    
    const response = await fetch(`${API_BASE_URL}/products/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Don't set Content-Type - browser will set it with boundary for multipart/form-data
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Failed to create product' }));
      console.error('API Error:', errorData);
      throw new Error(errorData.detail || 'Failed to create product');
    }

    const result = await response.json();
    console.log('Product created successfully:', result);
    return result;
  } catch (error) {
    console.error('Error creating product:', error);
    throw error;
  }
}

/**
 * Update an existing product with optional image upload
 */
export async function updateProduct(
  productId: string, 
  productData: {
    name?: string;
    slug?: string;
    category_id?: string;
    price?: number;
    description?: string;
    sku?: string;
    stock?: number;
    is_available?: boolean;
    image?: File | null;
  }
) {
  const formData = new FormData();
  
  if (productData.name) formData.append("name", productData.name);
  if (productData.slug) formData.append("slug", productData.slug);
  if (productData.category_id) formData.append("category_id", productData.category_id);
  if (productData.price !== undefined) formData.append("price", String(productData.price));
  if (productData.description) formData.append("description", productData.description);
  if (productData.sku) formData.append("sku", productData.sku);
  if (productData.stock !== undefined) formData.append("stock", String(productData.stock));
  if (productData.is_available !== undefined) formData.append("is_available", String(productData.is_available));
  if (productData.image) formData.append("image", productData.image);

  // Use custom fetch for PUT with FormData
  const token = localStorage.getItem("token");
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";
  
  const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to update product");
  }

  return response.json();
}

/**
 * Delete a product
 */
export async function deleteProduct(productId: string) {
  return apiDelete(`/products/${productId}`);
}

/**
 * Search products
 */
export async function searchProducts(query: string, limit = 20) {
  return getProducts({ search: query, page_size: limit, page: 1 });
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(limit = 10) {
  return getProducts({ featured: true, available: true, page_size: limit, page: 1 });
}

/**
 * Get available products
 */
export async function getAvailableProducts(filters?: Omit<ProductFilters, 'available'>) {
  return getProducts({ ...filters, available: true });
}

// ==================== Order Services ====================

export interface Order {
  id: string;
  order_number: string;
  customer_name?: string;
  table_number?: string;
  items: OrderItem[];
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export async function getOrders() {
  return apiGet<Order[]>("/orders");
}

export async function getOrderById(orderId: string) {
  return apiGet<Order>(`/orders/${orderId}`);
}

export async function createOrder(orderData: Partial<Order>) {
  return apiPost<Order>("/orders", orderData);
}

export async function updateOrderStatus(orderId: string, status: string) {
  return apiPatch<Order>(`/orders/${orderId}`, { status });
}

// ==================== Table Booking Services ====================

export interface TableBooking {
  id: string;
  booking_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  table_id: string;
  party_size: number;
  booking_date: string;
  booking_time: string;
  duration: number;
  status: string;
  occasion?: string;
  special_requests?: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export async function getBookings() {
  return apiGet<TableBooking[]>("/bookings");
}

export async function getBookingById(bookingId: string) {
  return apiGet<TableBooking>(`/bookings/${bookingId}`);
}

export async function createBooking(bookingData: Partial<TableBooking>) {
  return apiPost<TableBooking>("/bookings", bookingData);
}

export async function updateBooking(bookingId: string, bookingData: Partial<TableBooking>) {
  return apiPut<TableBooking>(`/bookings/${bookingId}`, bookingData);
}

export async function updateBookingStatus(bookingId: string, status: string) {
  return apiPatch<TableBooking>(`/bookings/${bookingId}`, { status });
}

export async function deleteBooking(bookingId: string) {
  return apiDelete(`/bookings/${bookingId}`);
}

// ==================== Analytics Services ====================

export interface AnalyticsData {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  popular_products: Array<{ name: string; count: number }>;
  revenue_by_period: Array<{ date: string; revenue: number }>;
}

export async function getAnalytics(startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  
  return apiGet<AnalyticsData>(`/analytics?${params.toString()}`);
}

// ==================== Category Services ====================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryListResponse {
  status: string;
  message: string;
  data: Category[];
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface CategoryFilters {
  page?: number;
  page_size?: number;
  active?: boolean;
}

/**
 * Get paginated list of categories with optional filters
 */
export async function getCategories(filters?: CategoryFilters) {
  const params = new URLSearchParams();
  
  if (filters) {
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.page_size) params.append("page_size", filters.page_size.toString());
    if (filters.active !== undefined) params.append("active", filters.active.toString());
  }

  const queryString = params.toString();
  const endpoint = queryString ? `/categories/?${queryString}` : "/categories/";
  
  return apiGet<CategoryListResponse>(endpoint);
}

/**
 * Get a single category by ID
 */
export async function getCategoryById(categoryId: string) {
  interface CategoryResponse {
    status: string;
    message: string;
    data: Category;
  }
  const response = await apiGet<CategoryResponse>(`/categories/${categoryId}`);
  return response.data;
}

/**
 * Create a new category with optional image upload
 */
export async function createCategory(categoryData: {
  name: string;
  slug: string;
  description?: string;
  active?: boolean;
  sort_order?: number;
  image?: File | null;
}) {
  const formData = new FormData();
  formData.append("name", categoryData.name);
  formData.append("slug", categoryData.slug);
  if (categoryData.description) {
    formData.append("description", categoryData.description);
  }
  formData.append("active", String(categoryData.active ?? true));
  formData.append("sort_order", String(categoryData.sort_order ?? 0));
  
  // Add image if provided
  if (categoryData.image) {
    formData.append("image", categoryData.image);
  }

  // Import apiUpload from apiClient
  const { apiUpload } = await import('./apiClient');
  
  interface CategoryResponse {
    status: string;
    message: string;
    data: Category;
  }
  
  const response = await apiUpload<CategoryResponse>("/categories/", formData);
  return response.data;
}

/**
 * Update an existing category with optional new image
 */
export async function updateCategory(
  categoryId: string,
  categoryData: {
    name?: string;
    slug?: string;
    description?: string;
    active?: boolean;
    sort_order?: number;
    image?: File | null;
  }
) {
  const formData = new FormData();
  
  // Add only provided fields
  if (categoryData.name !== undefined) {
    formData.append("name", categoryData.name);
  }
  if (categoryData.slug !== undefined) {
    formData.append("slug", categoryData.slug);
  }
  if (categoryData.description !== undefined) {
    formData.append("description", categoryData.description);
  }
  if (categoryData.active !== undefined) {
    formData.append("active", String(categoryData.active));
  }
  if (categoryData.sort_order !== undefined) {
    formData.append("sort_order", String(categoryData.sort_order));
  }
  
  // Add new image if provided
  if (categoryData.image) {
    formData.append("image", categoryData.image);
  }

  // Use custom fetch with PUT method for FormData
  const token = localStorage.getItem("restaurant-pos-token");
  const tokenType = localStorage.getItem("restaurant-pos-token-type") || "bearer";
  
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"}/categories/${categoryId}`,
    {
      method: "PUT",
      headers: {
        ...(token ? { Authorization: `${tokenType} ${token}` } : {}),
        // Don't set Content-Type for FormData
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: "Failed to update category" }));
    throw new Error(errorData.detail || "Failed to update category");
  }

  interface CategoryResponse {
    status: string;
    message: string;
    data: Category;
  }
  
  const result = await response.json() as CategoryResponse;
  return result.data;
}

/**
 * Delete a category (also deletes associated image)
 */
export async function deleteCategory(categoryId: string) {
  interface DeleteResponse {
    status: string;
    message: string;
    data: null;
  }
  return apiDelete<DeleteResponse>(`/categories/${categoryId}`);
}

// ==================== Customer Services ====================

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export async function getCustomers() {
  return apiGet<Customer[]>("/customers");
}

export async function getCustomerById(customerId: string) {
  return apiGet<Customer>(`/customers/${customerId}`);
}

export async function createCustomer(customerData: Partial<Customer>) {
  return apiPost<Customer>("/customers", customerData);
}

export async function updateCustomer(customerId: string, customerData: Partial<Customer>) {
  return apiPut<Customer>(`/customers/${customerId}`, customerData);
}

export async function deleteCustomer(customerId: string) {
  return apiDelete(`/customers/${customerId}`);
}

// ==================== File Upload Services ====================

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  content_type: string;
}

/**
 * Upload an image file
 * @param file - The file to upload
 * @param folder - Optional folder path (e.g., 'products', 'categories')
 * @returns Upload response with file URL
 */
export async function uploadImage(file: File, folder: string = 'products'): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  // Import apiUpload from apiClient
  const { apiUpload } = await import('./apiClient');
  return apiUpload<UploadResponse>('/upload/image', formData);
}

// ==================== Modifier Services ====================

export interface ModifierOption {
  id: string;
  modifier_id: string;
  name: string;
  price: number; // in cents
  available: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Modifier {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  category: string;
  required: boolean;
  min_selections: number;
  max_selections: number | null;
  options: ModifierOption[];
  created_at: string;
  updated_at: string;
}

export interface ModifierListResponse {
  success: boolean;
  message: string;
  data: Modifier[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface ModifierFilters {
  page?: number;
  page_size?: number;
  category?: string;
}

/**
 * Get paginated list of modifiers with optional filters
 */
export async function getModifiers(filters?: ModifierFilters) {
  let endpoint = "/modifiers/";
  const params = new URLSearchParams();

  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.page_size) params.append("page_size", String(filters.page_size));
  if (filters?.category) params.append("category", filters.category);

  if (params.toString()) {
    endpoint += `?${params.toString()}`;
  }

  return apiGet<ModifierListResponse>(endpoint);
}

/**
 * Get a single modifier by ID
 */
export async function getModifierById(modifierId: string) {
  return apiGet<Modifier>(`/modifiers/${modifierId}`);
}

/**
 * Create a new modifier
 */
export async function createModifier(modifierData: {
  name: string;
  type: 'single' | 'multiple';
  category?: string;
  required?: boolean;
  min_selections?: number;
  max_selections?: number | null;
}) {
  return apiPost<Modifier>("/modifiers/", modifierData);
}

/**
 * Delete a modifier
 */
export async function deleteModifier(modifierId: string) {
  return apiDelete(`/modifiers/${modifierId}`);
}

/**
 * Create a new modifier option
 */
export async function createModifierOption(
  modifierId: string,
  optionData: {
    name: string;
    price?: number;
    available?: boolean;
    sort_order?: number;
  }
) {
  return apiPost<ModifierOption>(`/modifiers/${modifierId}/options`, optionData);
}

/**
 * Get all options for a modifier
 */
export async function getModifierOptions(
  modifierId: string,
  filters?: { page?: number; page_size?: number }
) {
  let endpoint = `/modifiers/${modifierId}/options`;
  const params = new URLSearchParams();

  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.page_size) params.append("page_size", String(filters.page_size));

  if (params.toString()) {
    endpoint += `?${params.toString()}`;
  }

  interface OptionsResponse {
    success: boolean;
    message: string;
    data: ModifierOption[];
    pagination: {
      page: number;
      page_size: number;
      total_items: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
  }

  return apiGet<OptionsResponse>(endpoint);
}

/**
 * Delete a modifier option
 */
export async function deleteModifierOption(optionId: string) {
  return apiDelete(`/modifier-options/${optionId}`);
}
