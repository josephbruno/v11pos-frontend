/**
 * API Services - Organized API calls by domain
 * Aligned with OpenAPI specification v1.0.0
 */

import {
  apiGet, apiPost, apiPut, apiPatch, apiDelete, apiUpload, apiUploadPut
} from "./apiClient";
import {
  User, LoginRequest, LoginResponse, Restaurant, Category, Product, Order,
  CategoryFilters, ProductFilters, OrderFilters, ModifierFilters,
  CategoryListResponse, ProductListResponse, OrderListResponse
} from "@shared/api";

// ==================== Health & System ====================

export async function checkHealth() {
  return apiGet("/health");
}

// ==================== Authentication ====================

/**
 * Handle user login
 * POST /api/v1/auth/login
 */
export async function loginUser(credentials: LoginRequest) {
  return apiPost<LoginResponse>("/auth/login", credentials);
}

/**
 * Refresh access token
 * POST /api/v1/auth/refresh
 */
export async function refreshToken(refresh_token: string) {
  return apiPost<LoginResponse>("/auth/refresh", { refresh_token });
}

/**
 * Request password reset
 * POST /api/v1/auth/forgot-password
 */
export async function forgotPassword(email: string) {
  return apiPost("/auth/forgot-password", { email });
}

/**
 * Verify OTP without resetting password
 * POST /api/v1/auth/verify-otp
 */
export async function verifyOTP(email: string, otp: string) {
  return apiPost("/auth/verify-otp", { email, otp });
}

/**
 * Reset password with OTP
 * POST /api/v1/auth/reset-password
 */
export async function resetPassword(email: string, otp: string, newPassword: string) {
  return apiPost("/auth/reset-password", {
    email,
    otp,
    new_password: newPassword
  });
}

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
export async function logoutUser() {
  return apiPost("/auth/logout");
}

/**
 * Get login logs for current user
 * GET /api/v1/auth/login-logs/me
 */
export async function getMyLoginLogs(skip = 0, limit = 50) {
  return apiGet(`/auth/login-logs/me?skip=${skip}&limit=${limit}`);
}

// ==================== User Management ====================

/**
 * Get current authenticated user info
 * GET /api/v1/users/me
 */
export async function getCurrentUser() {
  return apiGet<User>("/users/me");
}

/**
 * Get list of users (requires auth)
 * GET /api/v1/users
 */
export async function getUsers(skip = 0, limit = 100) {
  return apiGet<User[]>(`/users?skip=${skip}&limit=${limit}`);
}

/**
 * Get user by ID
 * GET /api/v1/users/{user_id}
 */
export async function getUserById(userId: string) {
  return apiGet<User>(`/users/${userId}`);
}

/**
 * Create a new user
 * POST /api/v1/users
 */
export async function createUser(userData: Partial<User>) {
  return apiPost<User>("/users", userData);
}

/**
 * Update user info
 * PUT /api/v1/users/{user_id}
 */
export async function updateUser(userId: string, userData: Partial<User>) {
  return apiPut<User>(`/users/${userId}`, userData);
}

/**
 * Delete user
 * DELETE /api/v1/users/{user_id}
 */
export async function deleteUser(userId: string) {
  return apiDelete(`/users/${userId}`);
}

// ==================== Restaurant Management ====================

/**
 * Get list of restaurants for current user
 * GET /api/v1/restaurants/my-restaurants
 */
export async function getMyRestaurants(skip = 0, limit = 100) {
  return apiGet<Restaurant[]>(`/restaurants/my-restaurants?skip=${skip}&limit=${limit}`);
}

/**
 * Get restaurant by ID
 * GET /api/v1/restaurants/{restaurant_id}
 */
export async function getRestaurantById(restaurantId: string) {
  return apiGet<Restaurant>(`/restaurants/${restaurantId}`);
}

/**
 * Create a new restaurant
 * POST /api/v1/restaurants
 */
export async function createRestaurant(restaurantData: Partial<Restaurant>) {
  return apiPost<Restaurant>("/restaurants", restaurantData);
}

/**
 * Update restaurant info
 * PUT /api/v1/restaurants/{restaurant_id}
 */
export async function updateRestaurant(restaurantId: string, restaurantData: Partial<Restaurant>) {
  return apiPut<Restaurant>(`/restaurants/${restaurantId}`, restaurantData);
}

// ==================== Product & Category Services ====================

/**
 * Get categories for a restaurant
 * GET /api/v1/products/categories/restaurant/{restaurant_id}
 */
export async function getCategories(restaurantId: string, filters?: CategoryFilters) {
  const params = new URLSearchParams();
  if (filters) {
    if (filters.active !== undefined) params.append("active_only", String(filters.active));
    if (filters.page !== undefined) params.append("page", String(filters.page));
    if (filters.page_size !== undefined) params.append("page_size", String(filters.page_size));
  }

  const query = params.toString();
  const endpoint = `/products/categories/restaurant/${restaurantId}${query ? `?${query}` : ""}`;

  // If we have pagination filters, it likely returns a paginated response
  // but the current spec/code might expect Category[]
  // I'll return Category[] for now or handle both if needed.
  // Actually, I'll return CategoryListResponse if filters have page/page_size, else Category[]

  return apiGet<any>(endpoint);
}

/**
 * Create a new product category
 * POST /api/v1/products/categories
 */
export async function createCategory(categoryData: Partial<Category>) {
  return apiPost<Category>("/products/categories", categoryData);
}

/**
 * Get category by ID
 * GET /api/v1/products/categories/{category_id}
 */
export async function getCategoryById(categoryId: string) {
  return apiGet<Category>(`/products/categories/${categoryId}`);
}

/**
 * Update product category
 * PUT /api/v1/products/categories/{category_id}
 */
export async function updateCategory(categoryId: string, categoryData: Partial<Category>) {
  return apiPut<Category>(`/products/categories/${categoryId}`, categoryData);
}

/**
 * Delete product category
 * DELETE /api/v1/products/categories/{category_id}
 */
export async function deleteCategory(categoryId: string) {
  return apiDelete(`/products/categories/${categoryId}`);
}

/**
 * Get products for a restaurant
 * GET /api/v1/products/restaurant/{restaurant_id}
 */
export async function getProducts(restaurantId: string, filters?: any) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
  }
  return apiGet<Product[]>(`/products/restaurant/${restaurantId}?${params.toString()}`);
}

/**
 * Get product by ID
 * GET /api/v1/products/{product_id}
 */
export async function getProductById(productId: string) {
  return apiGet<Product>(`/products/${productId}`);
}

/**
 * Create product (handles both object and FormData for image)
 * POST /api/v1/products/
 */
export async function createProduct(data: Partial<Product> | FormData) {
  if (data && 'append' in data && typeof data.append === 'function') {
    return apiUpload<Product>("/products/", data as FormData);
  }

  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (Array.isArray(value)) {
        value.forEach(v => formData.append(`${key}[]`, String(v)));
      } else {
        formData.append(key, String(value));
      }
    }
  });

  return apiUpload<Product>("/products/", formData);
}

/**
 * Update product (handles both object and FormData for image)
 * PUT /api/v1/products/{product_id}
 */
export async function updateProduct(productId: string, data: Partial<Product> | FormData) {
  if (data && 'append' in data && typeof data.append === 'function') {
    return apiUploadPut<Product>(`/products/${productId}`, data as FormData);
  }

  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (Array.isArray(value)) {
        value.forEach(v => formData.append(`${key}[]`, String(v)));
      } else {
        formData.append(key, String(value));
      }
    }
  });

  return apiUploadPut<Product>(`/products/${productId}`, formData);
}

/**
 * Delete product
 * DELETE /api/v1/products/{product_id}
 */
export async function deleteProduct(productId: string) {
  return apiDelete(`/products/${productId}`);
}

// ==================== Modifier Services ====================

/**
 * Get modifiers for a restaurant
 * GET /api/v1/products/modifiers/restaurant/{restaurant_id}
 */
export async function getModifiers(restaurantId: string, filters?: ModifierFilters) {
  const params = new URLSearchParams();
  if (filters?.active !== undefined) params.append("active_only", String(filters.active));

  return apiGet(`/products/modifiers/restaurant/${restaurantId}?${params.toString()}`);
}

/**
 * Get modifier by ID
 */
export async function getModifierById(modifierId: string) {
  return apiGet(`/products/modifiers/${modifierId}`);
}

/**
 * Create a new modifier
 */
export async function createModifier(modifierData: any) {
  return apiPost("/products/modifiers", modifierData);
}

/**
 * Delete a modifier
 */
export async function deleteModifier(modifierId: string) {
  return apiDelete(`/products/modifiers/${modifierId}`);
}

/**
 * Get options for a modifier
 */
export async function getModifierOptions(modifierId: string, filters?: any) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
  }
  return apiGet(`/products/modifiers/${modifierId}/options?${params.toString()}`);
}

/**
 * Create a modifier option
 */
export async function createModifierOption(modifierId: string, optionData: any) {
  return apiPost(`/products/modifiers/${modifierId}/options`, optionData);
}

/**
 * Delete a modifier option
 */
export async function deleteModifierOption(optionId: string) {
  return apiDelete(`/products/modifiers/options/${optionId}`);
}

// ==================== Order & Table Services ====================

/**
 * Get all tables for a restaurant
 * GET /api/v1/tables/restaurant/{restaurant_id}
 */
export async function getTables(restaurantId: string) {
  return apiGet(`/tables/restaurant/${restaurantId}`);
}

/**
 * Get orders for a restaurant
 * GET /api/v1/orders/restaurant/{restaurant_id}
 */
export async function getOrders(restaurantId: string, skip = 0, limit = 100) {
  return apiGet<Order[]>(`/orders/restaurant/${restaurantId}?skip=${skip}&limit=${limit}`);
}

/**
 * Create a new order
 * POST /api/v1/orders/
 */
export async function createOrder(orderData: Partial<Order>) {
  return apiPost<Order>("/orders/", orderData);
}

/**
 * Update order status
 * PATCH /api/v1/orders/{order_id}/status
 */
export async function updateOrderStatus(orderId: string, status: string) {
  return apiPatch<Order>(`/orders/${orderId}/status`, { status });
}

// ==================== Kitchen Display System (KDS) ====================

/**
 * Get active tickets for a kitchen station
 * GET /api/v1/kds/tickets/station/{station_id}
 */
export async function getKdsTickets(stationId: string) {
  return apiGet(`/kds/tickets/station/${stationId}`);
}

/**
 * Update ticket item status (preparing, ready, etc.)
 * PATCH /api/v1/kds/items/{item_id}/status
 */
export async function updateKdsItemStatus(itemId: string, status: string) {
  return apiPatch(`/kds/items/${itemId}/status`, { status });
}

// ==================== Inventory Management ====================

/**
 * Get inventory stock levels for restaurant
 * GET /api/v1/inventory/stock/restaurant/{restaurant_id}
 */
export async function getInventoryStock(restaurantId: string) {
  return apiGet(`/inventory/stock/restaurant/${restaurantId}`);
}

/**
 * Record stock transaction
 * POST /api/v1/inventory/transactions
 */
export async function recordStockTransaction(transactionData: any) {
  return apiPost("/inventory/transactions", transactionData);
}

// ==================== Staff Management ====================

/**
 * Get staff members for restaurant
 * GET /api/v1/staff/restaurant/{restaurant_id}
 */
export async function getStaffMembers(restaurantId: string) {
  return apiGet(`/staff/restaurant/${restaurantId}`);
}

/**
 * Clock in/out for shift
 * POST /api/v1/staff/attendance/clock
 */
export async function clockStaff(staffId: string, action: 'clock_in' | 'clock_out') {
  return apiPost("/staff/attendance/clock", { staff_id: staffId, action });
}

// ==================== Reports & Analytics ====================

/**
 * Get sales dashboard data
 * GET /api/v1/reports/dashboard/restaurant/{restaurant_id}
 */
export async function getDashboardStats(restaurantId: string, period = 'today') {
  return apiGet(`/reports/dashboard/restaurant/${restaurantId}?period=${period}`);
}

/**
 * Generate PDF report
 * GET /api/v1/reports/sales/pdf
 */
export async function generateSalesReport(restaurantId: string, startDate: string, endDate: string) {
  return apiGet(`/reports/sales/pdf?restaurant_id=${restaurantId}&start_date=${startDate}&end_date=${endDate}`, {
    headers: { Accept: "application/pdf" }
  });
}
