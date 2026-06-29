/**
 * API Services - Organized API calls by domain
 * Aligned with OpenAPI specification v1.0.0
 */

import {
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
  apiUpload,
  apiUploadTo,
  apiUploadPut,
  API_BASE_URL,
  ApiError,
} from "./apiClient";
import {
  User, LoginRequest, LoginResponse, Restaurant, Category, Product, Order,
  SubscriptionPlan, Subscription, SubscriptionInvoice, UsageLimits, SubscriptionCheckoutResponse,
  CategoryFilters, ProductFilters, OrderFilters, ModifierFilters,
  CategoryListResponse, ProductListResponse, OrderListResponse, Homebanner, RowManagement, RowType,
  Customer, QRCart, OrderStatistics, BackendCustomer, BackendCustomerListResponse,
  StaffMember, SalesReport, ItemWiseReport, CategoryWiseReport,
  ApiResponse,
} from "@shared/api";
import { validateUserPayload } from "./userValidation";
import { encodeBookingNotes } from "./tableBooking";

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
 * Get users for a specific restaurant
 * GET /api/v1/users/restaurant/{restaurant_id}
 */
export async function getUsersByRestaurant(
  restaurantId: string,
  skip = 0,
  limit = 100,
) {
  return apiGet<{ restaurant_id: string; count: number; users: User[] }>(
    `/users/restaurant/${restaurantId}?skip=${skip}&limit=${limit}`,
  );
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
  const candidate = userData as Record<string, any>;
  const email = String(candidate.email ?? "").trim();
  const restaurantId = String(candidate.restaurant_id ?? candidate.restaurantId ?? "").trim();
  const role = String(candidate.role ?? "").trim();
  const status = String(candidate.status ?? "").trim();
  const validation = validateUserPayload(
    {
      fullName: String(candidate.full_name ?? candidate.name ?? ""),
      username: String(candidate.username ?? ""),
      password: String(candidate.password ?? ""),
    },
    { requirePassword: true },
  );
  const firstError = validation.name || validation.username || validation.password;
  if (firstError) {
    throw new Error(firstError);
  }
  if (!email) {
    throw new Error("Email is required.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }
  if (!restaurantId) {
    throw new Error("Please select a restaurant.");
  }
  if (!role) {
    throw new Error("Please select a role.");
  }
  if (!status) {
    throw new Error("Please select a status.");
  }
  return apiPost<User>("/users", userData);
}

/**
 * Update user info
 * PUT /api/v1/users/{user_id}
 */
export async function updateUser(userId: string, userData: Partial<User>) {
  const candidate = userData as Record<string, any>;
  const validation = validateUserPayload(
    {
      fullName:
        candidate.full_name !== undefined || candidate.name !== undefined
          ? String(candidate.full_name ?? candidate.name ?? "")
          : undefined,
      username: candidate.username !== undefined ? String(candidate.username ?? "") : undefined,
      password: candidate.password !== undefined ? String(candidate.password ?? "") : undefined,
    },
    { validatePasswordIfProvided: true },
  );
  const firstError = validation.name || validation.username || validation.password;
  if (firstError) {
    throw new Error(firstError);
  }
  return apiPut<User>(`/users/${userId}`, userData);
}

/**
 * Delete user
 * DELETE /api/v1/users/{user_id}
 */
export async function deleteUser(userId: string) {
  return apiDelete(`/users/${userId}`);
}

/**
 * Update user password
 * PATCH /api/v1/users/{user_id}/password
 */
export async function updateUserPassword(userId: string, newPassword: string) {
  return apiPatch(`/users/${userId}/password`, { new_password: newPassword });
}

// ==================== Restaurant Management ====================

/**
 * Get list of restaurants for current user
 * GET /api/v1/restaurants/my-restaurants
 */
export async function getMyRestaurants(skip = 0, limit = 100): Promise<ApiResponse<Restaurant[]>> {
  return apiGet<ApiResponse<Restaurant[]>>(`/restaurants/my-restaurants?skip=${skip}&limit=${limit}`);
}

/** Superadmin: list ALL restaurants in the system */
export async function getAllRestaurantsAdmin(skip = 0, limit = 500) {
  return apiGet<Restaurant[]>(`/restaurants/all?skip=${skip}&limit=${limit}`);
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

/**
 * Upload a file and return its public URL
 * POST /upload
 */
export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  // Upload router is mounted without the `/api/v1` prefix (see backend `app/main.py`).
  // So we must call `<host>/upload`, not `<host>/api/v1/upload`.
  const baseUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, "");
  return apiUploadTo<{ success: boolean; file_name: string; url: string }>(
    baseUrl,
    "/upload",
    formData,
  );
}

/**
 * Update restaurant info with multipart/form-data (for logo/banner uploads)
 * PUT /api/v1/restaurants/{restaurant_id}
 */
export async function updateRestaurantWithUpload(restaurantId: string, formData: FormData) {
  return apiUploadPut<Restaurant>(`/restaurants/${restaurantId}`, formData);
}

/**
 * Partially update restaurant info
 * PATCH /api/v1/restaurants/{restaurant_id}
 */
export async function patchRestaurant(restaurantId: string, restaurantData: Partial<Restaurant> | any) {
  return apiPatch<Restaurant>(`/restaurants/${restaurantId}`, restaurantData);
}

/**
 * Delete restaurant
 * DELETE /api/v1/restaurants/{restaurant_id}
 */
export async function deleteRestaurant(restaurantId: string) {
  return apiDelete(`/restaurants/${restaurantId}`);
}

// ==================== Subscription & Billing ====================

export async function getSubscriptionPlans() {
  return apiGet<SubscriptionPlan[]>("/restaurants/subscription-plans");
}

export async function getAllSubscriptionPlansAdmin() {
  return apiGet<SubscriptionPlan[]>("/restaurants/subscription-plans/all");
}

export async function createSubscriptionPlan(plan: Partial<SubscriptionPlan>) {
  return apiPost<SubscriptionPlan>("/restaurants/subscription-plans", plan);
}

export async function updateSubscriptionPlan(planId: string, plan: Partial<SubscriptionPlan>) {
  return apiPut<SubscriptionPlan>(`/restaurants/subscription-plans/${planId}`, plan);
}

export async function updateSubscriptionPlanStatus(planId: string, isActive: boolean) {
  return apiPatch<SubscriptionPlan>(
    `/restaurants/subscription-plans/${planId}/status?is_active=${isActive}`,
    {},
  );
}

export async function getAllSubscriptionsAdmin(params?: {
  skip?: number;
  limit?: number;
  status?: string;
  plan?: string;
}) {
  const q = new URLSearchParams();
  if (params?.skip != null) q.set("skip", String(params.skip));
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.status) q.set("status", params.status);
  if (params?.plan) q.set("plan", params.plan);
  const query = q.toString();
  return apiGet<Subscription[]>(`/restaurants/subscriptions${query ? `?${query}` : ""}`);
}

export async function getRestaurantSubscription(restaurantId: string) {
  return apiGet<Subscription | Record<string, unknown>>(
    `/restaurants/${restaurantId}/subscription`,
  );
}

export async function createSubscriptionCheckout(
  restaurantId: string,
  planId: string,
  billingCycle: "monthly" | "yearly" = "monthly",
) {
  return apiPost<SubscriptionCheckoutResponse>(
    `/restaurants/${restaurantId}/subscriptions/checkout`,
    { plan_id: planId, billing_cycle: billingCycle },
  );
}

export async function verifySubscriptionCheckout(
  restaurantId: string,
  razorpaySubscriptionId: string,
) {
  return apiPost<Subscription>(
    `/restaurants/${restaurantId}/subscriptions/verify`,
    { razorpay_subscription_id: razorpaySubscriptionId },
  );
}

export async function cancelSubscription(
  subscriptionId: string,
  reason?: string,
  immediate = false,
) {
  const q = new URLSearchParams();
  if (reason) q.set("reason", reason);
  if (immediate) q.set("immediate", "true");
  const query = q.toString();
  return apiPost<Subscription>(
    `/restaurants/subscriptions/${subscriptionId}/cancel${query ? `?${query}` : ""}`,
    {},
  );
}

export async function getRestaurantInvoices(restaurantId: string, skip = 0, limit = 100) {
  return apiGet<SubscriptionInvoice[]>(
    `/restaurants/${restaurantId}/invoices?skip=${skip}&limit=${limit}`,
  );
}

export async function getUsageLimits(restaurantId: string) {
  return apiGet<UsageLimits>(`/restaurants/${restaurantId}/usage-limits`);
}

export async function assignRestaurantSubscription(
  restaurantId: string,
  planName: string,
  billingCycle: "monthly" | "yearly" = "monthly",
) {
  return apiPost<Subscription>(`/restaurants/${restaurantId}/subscriptions/assign`, {
    plan_name: planName,
    billing_cycle: billingCycle,
  });
}

export async function updateRestaurantSubscriptionStatus(
  restaurantId: string,
  payload: {
    subscription_status: string;
    is_suspended: boolean;
    suspension_reason?: string;
  },
) {
  return apiPatch<Restaurant>(`/restaurants/${restaurantId}/subscription-status`, payload);
}

// ==================== Homebanner Services ====================

/**
 * Get homebanners (optionally filtered by restaurant)
 * GET /api/v1/homebanners
 */
export async function getHomebanners(restaurantId?: string, skip = 0, limit = 200) {
  const trimmedRestaurantId = String(restaurantId || "").trim();

  const withQuery = (base: string, params: URLSearchParams) => {
    const query = params.toString();
    return query ? `${base}?${query}` : base;
  };

  const baseParams = new URLSearchParams();
  if (trimmedRestaurantId) baseParams.append("restaurant_id", trimmedRestaurantId);
  baseParams.append("skip", String(skip));
  baseParams.append("limit", String(limit));

  const candidates: string[] = [];

  // Common pattern: list endpoint with query param filter.
  candidates.push(withQuery(`/homebanners`, baseParams));

  // Common pattern: restaurant-scoped list endpoint.
  if (trimmedRestaurantId) {
    const paramsWithoutRestaurant = new URLSearchParams();
    paramsWithoutRestaurant.append("skip", String(skip));
    paramsWithoutRestaurant.append("limit", String(limit));
    candidates.push(withQuery(`/homebanners/restaurant/${trimmedRestaurantId}`, paramsWithoutRestaurant));
    candidates.push(withQuery(`/restaurants/${trimmedRestaurantId}/homebanners`, paramsWithoutRestaurant));
    candidates.push(`/homebanners/restaurant/${trimmedRestaurantId}`);
    candidates.push(`/restaurants/${trimmedRestaurantId}/homebanners`);
  }

  let lastError: any;
  for (const endpoint of candidates) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await apiGet<any>(endpoint);
    } catch (error: any) {
      lastError = error;
      const status = Number(error?.status ?? error?.response?.status ?? 0);
      // If the endpoint doesn't exist or doesn't support GET, try the next candidate.
      if (status === 404 || status === 405) continue;
      throw error;
    }
  }

  throw lastError;
}

async function compressImageFileForUpload(
  file: File,
  options: {
    maxWidth: number;
    maxHeight: number;
    targetMaxBytes: number;
    initialQuality?: number;
    minQuality?: number;
  },
): Promise<File> {
  if (!file?.type?.startsWith("image/")) return file;

  const {
    maxWidth,
    maxHeight,
    targetMaxBytes,
    initialQuality = 0.82,
    minQuality = 0.55,
  } = options;

  // If already small enough, skip work.
  if (file.size <= targetMaxBytes) return file;

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image for compression."));
      img.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    const computeDims = (scale: number) => {
      const width = image.naturalWidth || image.width;
      const height = image.naturalHeight || image.height;
      const widthScale = maxWidth / width;
      const heightScale = maxHeight / height;
      const baseScale = Math.min(1, widthScale, heightScale);
      const finalScale = Math.max(0.05, baseScale * scale);
      return {
        outW: Math.max(1, Math.round(width * finalScale)),
        outH: Math.max(1, Math.round(height * finalScale)),
      };
    };

    let scale = 1;
    let quality = initialQuality;
    let bestBlob: Blob | null = null;

    for (let attempt = 0; attempt < 7; attempt++) {
      const { outW, outH } = computeDims(scale);
      canvas.width = outW;
      canvas.height = outH;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.clearRect(0, 0, outW, outH);
      ctx.drawImage(image, 0, 0, outW, outH);

      // eslint-disable-next-line no-await-in-loop
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", quality),
      );

      if (!blob) break;
      bestBlob = blob;
      if (blob.size <= targetMaxBytes) break;

      // First reduce quality down to min; then start scaling down further.
      if (quality > minQuality) quality = Math.max(minQuality, quality - 0.08);
      else scale = scale * 0.85;
    }

    if (!bestBlob) return file;

    const originalName = file.name || "image";
    const nextName = originalName.replace(/\.(png|jpe?g|webp|gif|bmp|tiff?)$/i, "") + ".jpg";
    return new File([bestBlob], nextName, { type: "image/jpeg" });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function appendMaybeFormValue(formData: FormData, key: string, value: any) {
  if (value === undefined || value === null) return;
  if (value instanceof File) {
    formData.append(key, value);
    return;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return;
    formData.append(key, trimmed);
    return;
  }
  if (typeof value === "object") {
    formData.append(key, JSON.stringify(value));
    return;
  }
  formData.append(key, String(value));
}

/**
 * Create homebanner (supports JSON payload or multipart/form-data for image upload)
 * POST /api/v1/homebanners
 */
export async function createHomebanner(
  bannerData:
    | (Partial<Homebanner> & {
        mobile_image?: File | string | null;
        desktop_image?: File | string | null;
      })
    | FormData,
) {
  if (bannerData && "append" in bannerData && typeof bannerData.append === "function") {
    return apiUpload<Homebanner>("/homebanners", bannerData as FormData);
  }

  const payload: Record<string, any> = { ...(bannerData as Record<string, any>) };

  const uploadResponseToUrl = (response: any) => {
    const candidate = response?.data ?? response;
    const url = candidate?.url ?? candidate?.file_url ?? candidate?.location;
    return url ? String(url) : "";
  };

  const MAX_BANNER_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

  // Avoid hitting request-size limits on `/homebanners` by uploading files first,
  // then sending a JSON payload with the resulting URLs.
  const mobileCandidate = payload.mobile_image;
  const desktopCandidate = payload.desktop_image;
  if (mobileCandidate instanceof File) {
    const compressed = await compressImageFileForUpload(mobileCandidate, {
      maxWidth: 1080,
      maxHeight: 1920,
      targetMaxBytes: MAX_BANNER_IMAGE_BYTES,
    });
    if (compressed.size > MAX_BANNER_IMAGE_BYTES) {
      throw new Error("Mobile image must be 2MB or less.");
    }
    const uploaded = await uploadFile(compressed);
    const url = uploadResponseToUrl(uploaded);
    if (!url) throw new Error("Mobile image upload failed.");
    payload.mobile_image = url;
  }
  if (desktopCandidate instanceof File) {
    const compressed = await compressImageFileForUpload(desktopCandidate, {
      maxWidth: 1920,
      maxHeight: 1080,
      targetMaxBytes: MAX_BANNER_IMAGE_BYTES,
    });
    if (compressed.size > MAX_BANNER_IMAGE_BYTES) {
      throw new Error("Desktop image must be 2MB or less.");
    }
    const uploaded = await uploadFile(compressed);
    const url = uploadResponseToUrl(uploaded);
    if (!url) throw new Error("Desktop image upload failed.");
    payload.desktop_image = url;
  }

  Object.entries(payload).forEach(([key, value]) => {
    if (typeof value !== "string") return;
    const trimmed = value.trim();
    if (!trimmed) delete payload[key];
    else payload[key] = trimmed;
  });

  return apiPost<Homebanner>("/homebanners", payload);
}

/**
 * Update homebanner (supports JSON payload or multipart/form-data for image upload)
 * PUT/PATCH /api/v1/homebanners/{homebanner_id}
 */
export async function updateHomebanner(
  homebannerId: string,
  bannerData:
    | (Partial<Homebanner> & {
        mobile_image?: File | string | null;
        desktop_image?: File | string | null;
      })
    | FormData,
) {
  if (bannerData && "append" in bannerData && typeof bannerData.append === "function") {
    return apiUploadPut<Homebanner>(`/homebanners/${homebannerId}`, bannerData as FormData);
  }

  const payload: Record<string, any> = { ...(bannerData as Record<string, any>) };

  const uploadResponseToUrl = (response: any) => {
    const candidate = response?.data ?? response;
    const url = candidate?.url ?? candidate?.file_url ?? candidate?.location;
    return url ? String(url) : "";
  };

  const MAX_BANNER_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

  const mobileCandidate = payload.mobile_image;
  const desktopCandidate = payload.desktop_image;
  if (mobileCandidate instanceof File) {
    const compressed = await compressImageFileForUpload(mobileCandidate, {
      maxWidth: 1080,
      maxHeight: 1920,
      targetMaxBytes: MAX_BANNER_IMAGE_BYTES,
    });
    if (compressed.size > MAX_BANNER_IMAGE_BYTES) {
      throw new Error("Mobile image must be 2MB or less.");
    }
    const uploaded = await uploadFile(compressed);
    const url = uploadResponseToUrl(uploaded);
    if (!url) throw new Error("Mobile image upload failed.");
    payload.mobile_image = url;
  }
  if (desktopCandidate instanceof File) {
    const compressed = await compressImageFileForUpload(desktopCandidate, {
      maxWidth: 1920,
      maxHeight: 1080,
      targetMaxBytes: MAX_BANNER_IMAGE_BYTES,
    });
    if (compressed.size > MAX_BANNER_IMAGE_BYTES) {
      throw new Error("Desktop image must be 2MB or less.");
    }
    const uploaded = await uploadFile(compressed);
    const url = uploadResponseToUrl(uploaded);
    if (!url) throw new Error("Desktop image upload failed.");
    payload.desktop_image = url;
  }

  Object.entries(payload).forEach(([key, value]) => {
    if (typeof value !== "string") return;
    const trimmed = value.trim();
    if (!trimmed) delete payload[key];
    else payload[key] = trimmed;
  });

  // Prefer PATCH for partial updates; fallback to PUT if backend doesn't support PATCH.
  try {
    return await apiPatch<Homebanner>(`/homebanners/${homebannerId}`, payload);
  } catch {
    return apiPut<Homebanner>(`/homebanners/${homebannerId}`, payload);
  }
}

/**
 * Delete homebanner
 * DELETE /api/v1/homebanners/{homebanner_id}
 */
export async function deleteHomebanner(homebannerId: string) {
  return apiDelete(`/homebanners/${homebannerId}`);
}

// ==================== Row Management Services ====================

function normalizeRowManagementListResponse(response: any): RowManagement[] {
  const source = response?.data ?? response;
  if (Array.isArray(source)) return source as RowManagement[];
  if (Array.isArray(source?.items)) return source.items as RowManagement[];
  if (Array.isArray(source?.rows)) return source.rows as RowManagement[];
  return [];
}

function isRowManagementMetadataResponseValidationError(error: unknown) {
  if (!(error instanceof ApiError)) return false;
  if (error.status !== 400) return false;

  const details = String(
    error.data?.error?.details ?? error.data?.details ?? "",
  );

  return (
    details.includes("RowManagementResponse") &&
    details.includes("\nmetadata\n") &&
    details.includes("dict_type") &&
    details.includes("MetaData")
  );
}

/**
 * Get row management list for a restaurant
 * GET /api/v1/row-management/restaurant/{restaurant_id}
 */
export async function getRowManagementList(
  restaurantId: string,
  options?: {
    row_type?: RowType | "";
    active_only?: boolean;
    skip?: number;
    limit?: number;
  },
) {
  const params = new URLSearchParams();
  const rowType = options?.row_type ? String(options.row_type) : "";
  if (rowType) params.append("row_type", rowType);
  if (options?.active_only !== undefined) params.append("active_only", String(options.active_only));
  params.append("skip", String(options?.skip ?? 0));
  params.append("limit", String(options?.limit ?? 100));
  const query = params.toString();
  try {
    return await apiGet<any>(`/row-management/restaurant/${restaurantId}${query ? `?${query}` : ""}`);
  } catch (error) {
    if (isRowManagementMetadataResponseValidationError(error)) {
      throw new ApiError(
        "Backend bug: row-management list cannot be retrieved because `metadata` is not serialized as a JSON object (dict).",
        400,
        (error as any)?.data ?? (error as any),
      );
    }
    throw error;
  }
}

/**
 * Get row management by id
 * GET /api/v1/row-management/{row_id}
 */
export async function getRowManagementById(rowId: string) {
  return apiGet<RowManagement>(`/row-management/${rowId}`);
}

/**
 * Create row management
 * POST /api/v1/row-management
 *
 * Supports JSON payload or multipart uploads (client will upload media to `/upload` first and send URLs).
 */
export async function createRowManagement(
  rowData:
    | (Partial<RowManagement> & {
        image?: File | string | null;
        mobile_image?: File | string | null;
        desktop_image?: File | string | null;
        thumbnail_image?: File | string | null;
        video_file?: File | null;
      })
    | FormData,
) {
  if (rowData && "append" in rowData && typeof rowData.append === "function") {
    return apiUpload<RowManagement>("/row-management", rowData as FormData);
  }

  const payload: Record<string, any> = { ...(rowData as Record<string, any>) };

  const uploadResponseToUrl = (response: any) => {
    const candidate = response?.data ?? response;
    const url = candidate?.url ?? candidate?.file_url ?? candidate?.location;
    return url ? String(url) : "";
  };

  const maybeUpload = async (key: string) => {
    const candidate = payload[key];
    if (!(candidate instanceof File)) return;
    const uploaded = await uploadFile(candidate);
    const url = uploadResponseToUrl(uploaded);
    if (!url) throw new Error(`${key} upload failed.`);
    payload[key] = url;
  };

  await maybeUpload("image");
  await maybeUpload("mobile_image");
  await maybeUpload("desktop_image");
  await maybeUpload("thumbnail_image");
  await maybeUpload("video_file");

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      payload[key] = value.filter(Boolean).map((v) => String(v));
      return;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) delete payload[key];
      else payload[key] = trimmed;
      return;
    }
  });

  // Backend workaround: some deployments validate `metadata` as a dict in the response model,
  // but may expose SQLAlchemy's `MetaData()` when `metadata` is omitted.
  // Always send an object to keep response validation stable.
  if (payload.metadata === undefined || payload.metadata === null) {
    payload.metadata = {};
  }

  try {
    return await apiPost<RowManagement>("/row-management", payload);
  } catch (error) {
    // Backend bug workaround: some deployments fail response-model validation for `metadata`
    // even though the row is successfully created in DB.
    if (isRowManagementMetadataResponseValidationError(error) && payload.restaurant_id) {
      try {
        const list = await getRowManagementList(String(payload.restaurant_id), { skip: 0, limit: 200 });
        const rows = normalizeRowManagementListResponse(list);

        const name = String(payload.name ?? "").trim();
        const rowType = String(payload.row_type ?? "").trim();
        const title = String(payload.title ?? "").trim();

        const match = rows.find((row) => {
          if (name && String(row.name ?? "").trim() !== name) return false;
          if (rowType && String(row.row_type ?? "").trim() !== rowType) return false;
          if (title && String(row.title ?? "").trim() !== title) return false;
          return true;
        });

        if (match) return match;
      } catch {
        // Fall through to return best-effort local payload
      }

      // If the backend created the row but failed response serialization, treat as success so the UI can proceed.
      // The list endpoint may also be broken on the backend until fixed.
      return payload as any;
    }

    throw error;
  }
}

/**
 * Update row management
 * PATCH /api/v1/row-management/{row_id}
 */
export async function updateRowManagement(
  rowId: string,
  rowData:
    | (Partial<RowManagement> & {
        image?: File | string | null;
        mobile_image?: File | string | null;
        desktop_image?: File | string | null;
        thumbnail_image?: File | string | null;
        video_file?: File | null;
      })
    | FormData,
) {
  if (rowData && "append" in rowData && typeof rowData.append === "function") {
    // Some backends support POST/PUT with multipart for updates; try PUT by default via uploadPut.
    return apiUploadPut<RowManagement>(`/row-management/${rowId}`, rowData as FormData);
  }

  const payload: Record<string, any> = { ...(rowData as Record<string, any>) };

  const uploadResponseToUrl = (response: any) => {
    const candidate = response?.data ?? response;
    const url = candidate?.url ?? candidate?.file_url ?? candidate?.location;
    return url ? String(url) : "";
  };

  const maybeUpload = async (key: string) => {
    const candidate = payload[key];
    if (!(candidate instanceof File)) return;
    const uploaded = await uploadFile(candidate);
    const url = uploadResponseToUrl(uploaded);
    if (!url) throw new Error(`${key} upload failed.`);
    payload[key] = url;
  };

  await maybeUpload("image");
  await maybeUpload("mobile_image");
  await maybeUpload("desktop_image");
  await maybeUpload("thumbnail_image");
  await maybeUpload("video_file");

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      payload[key] = value.filter(Boolean).map((v) => String(v));
      return;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) delete payload[key];
      else payload[key] = trimmed;
      return;
    }
  });

  // Keep `metadata` consistently an object to avoid backend response validation issues.
  if (payload.metadata === undefined || payload.metadata === null) {
    payload.metadata = {};
  }

  try {
    return await apiPatch<RowManagement>(`/row-management/${rowId}`, payload);
  } catch (error) {
    if (isRowManagementMetadataResponseValidationError(error)) {
      try {
        return await getRowManagementById(rowId);
      } catch {
        // Treat as success: backend may have persisted the update but failed response serialization.
        return ({ id: rowId, ...payload } as any) satisfies RowManagement;
      }
    }
    try {
      return await apiPost<RowManagement>(`/row-management/${rowId}`, payload);
    } catch (error2) {
      if (isRowManagementMetadataResponseValidationError(error2)) {
        try {
          return await getRowManagementById(rowId);
        } catch {
          return ({ id: rowId, ...payload } as any) satisfies RowManagement;
        }
      }
      return apiPut<RowManagement>(`/row-management/${rowId}`, payload);
    }
  }
}

/**
 * Delete row management
 * DELETE /api/v1/row-management/{row_id}
 */
export async function deleteRowManagement(rowId: string) {
  return apiDelete(`/row-management/${rowId}`);
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
  const payload: Record<string, any> = { ...(categoryData as Record<string, any>) };
  const hasFile = Object.values(payload).some((value) => value instanceof File);
  const imageValue = payload.image;
  if (hasFile) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (value instanceof File) {
        formData.append(key, value);
        return;
      }
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return;
        formData.append(key, trimmed);
        return;
      }
      if (typeof value === "object") {
        formData.append(key, JSON.stringify(value));
        return;
      }
      formData.append(key, String(value));
    });
    return apiUpload<Category>("/products/categories", formData);
  } else if (typeof imageValue === "string") {
    const trimmed = imageValue.trim();
    if (!trimmed) delete payload.image;
    else payload.image = trimmed;
  } else {
    delete payload.image;
  }

  return apiPost<Category>("/products/categories", payload);
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
  const payload: Record<string, any> = { ...(categoryData as Record<string, any>) };
  const hasFile = Object.values(payload).some((value) => value instanceof File);
  const imageValue = payload.image;
  if (hasFile) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (value instanceof File) {
        formData.append(key, value);
        return;
      }
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return;
        formData.append(key, trimmed);
        return;
      }
      if (typeof value === "object") {
        formData.append(key, JSON.stringify(value));
        return;
      }
      formData.append(key, String(value));
    });
    return apiUploadPut<Category>(`/products/categories/${categoryId}`, formData);
  } else if (typeof imageValue === "string") {
    const trimmed = imageValue.trim();
    if (!trimmed) delete payload.image;
    else payload.image = trimmed;
  } else if (imageValue !== undefined) {
    delete payload.image;
  }

  // Category update is partial in UI, so prefer PATCH.
  // Fallback to PUT for backends that do not support PATCH on this endpoint.
  try {
    return await apiPatch<Category>(`/products/categories/${categoryId}`, payload);
  } catch {
    return apiPut<Category>(`/products/categories/${categoryId}`, payload);
  }
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
    if (filters.page !== undefined) params.append("page", String(filters.page));
    if (filters.page_size !== undefined) params.append("page_size", String(filters.page_size));
    if (filters.search) params.append("search", String(filters.search));
    if (filters.category_id) params.append("category_id", String(filters.category_id));
    if (filters.featured_only !== undefined) {
      params.append("featured_only", String(filters.featured_only));
    }
    if (
      filters.available_only === true ||
      filters.available === true ||
      filters.active === true
    ) {
      params.append("available_only", "true");
    }
    Object.entries(filters).forEach(([key, value]) => {
      if (
        value === undefined ||
        value === null ||
        key === "page" ||
        key === "page_size" ||
        key === "search" ||
        key === "category_id" ||
        key === "featured_only" ||
        key === "available_only" ||
        key === "available" ||
        key === "active"
      ) {
        return;
      }
      params.append(key, String(value));
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
    return apiUpload<Product>("/products", data as FormData);
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

  return apiUpload<Product>("/products", formData);
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
  if (filters?.page !== undefined) params.append("page", String(filters.page));
  if (filters?.page_size !== undefined) params.append("page_size", String(filters.page_size));

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
  if (modifierData && typeof modifierData === "object" && "append" in modifierData) {
    return apiUpload("/products/modifiers", modifierData as FormData);
  }

  if (modifierData && typeof modifierData === "object") {
    const payload: Record<string, any> = { ...(modifierData as Record<string, any>) };
    const iconValue = payload.icon;

    if (iconValue instanceof File) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (key === "icon" && value instanceof File) {
          formData.append("icon", value);
          return;
        }
        if (typeof value === "string") {
          const trimmed = value.trim();
          if (!trimmed) return;
          formData.append(key, trimmed);
          return;
        }
        formData.append(key, String(value));
      });

      return apiUpload("/products/modifiers", formData);
    }
  }

  return apiPost("/products/modifiers", modifierData);
}

/**
 * Delete a modifier
 */
export async function deleteModifier(modifierId: string) {
  return apiDelete(`/products/modifiers/${modifierId}`);
}

// ==================== Combo Services ====================

/**
 * Create a new combo
 * POST /api/v1/products/combos
 */
export async function createCombo(comboData: any) {
  if (comboData && typeof comboData === "object" && "append" in comboData) {
    return apiUpload("/products/combos", comboData as FormData);
  }
  return apiPost("/products/combos", comboData);
}

/**
 * Update an existing combo
 * PATCH/PUT /api/v1/products/combos/{combo_id}
 */
export async function updateCombo(comboId: string, comboData: any) {
  const endpoint = `/products/combos/${comboId}`;

  if (comboData && typeof comboData === "object" && "append" in comboData) {
    return apiUploadPut(endpoint, comboData as FormData);
  }

  try {
    return await apiPatch(endpoint, comboData);
  } catch {
    return apiPut(endpoint, comboData);
  }
}

/**
 * Upsert combo items
 * POST /api/v1/products/combos/{combo_id}/items
 */
export async function upsertComboItems(
  comboId: string,
  payload: {
    items: Array<{
      product_id: string;
      quantity: number;
      required?: boolean;
      choice_group?: string;
      choices?: string[];
      sort_order?: number;
    }>;
  },
) {
  return apiPost(`/products/combos/${comboId}/items`, payload);
}

/**
 * Get combo items
 * GET /api/v1/products/combos/{combo_id}/items
 */
export async function getComboItems(comboId: string) {
  return apiGet<any>(`/products/combos/${comboId}/items`);
}

/**
 * Get combos for a restaurant
 * GET /api/v1/products/combos/restaurant/{restaurant_id}
 */
export async function getCombos(restaurantId: string, filters?: any) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
  }

  const query = params.toString();
  const primary = `/products/combos/restaurant/${restaurantId}${query ? `?${query}` : ""}`;
  try {
    return await apiGet<any>(primary);
  } catch {
    const fallbackParams = new URLSearchParams(params);
    fallbackParams.set("restaurant_id", restaurantId);
    return apiGet<any>(`/products/combos?${fallbackParams.toString()}`);
  }
}

/**
 * Update a modifier
 */
export async function updateModifier(modifierId: string, modifierData: any) {
  if (modifierData && typeof modifierData === "object" && "append" in modifierData) {
    return apiUploadPut(`/products/modifiers/${modifierId}`, modifierData as FormData);
  }
  try {
    return await apiPatch(`/products/modifiers/${modifierId}`, modifierData);
  } catch {
    return apiPut(`/products/modifiers/${modifierId}`, modifierData);
  }
}

/**
 * Get options for a modifier
 */
export async function getModifierOptions(modifierId: string, filters?: any) {
  const baseParams = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined) return;
      baseParams.append(key, String(value));
    });
  }

  // Primary: /products/modifiers/{modifier_id}/options
  const primary = `/products/modifiers/${modifierId}/options${baseParams.toString() ? `?${baseParams.toString()}` : ""}`;

  // Secondary: /products/modifiers/options?modifier_id=...
  const secondaryParams = new URLSearchParams(baseParams);
  secondaryParams.set("modifier_id", modifierId);
  const secondary = `/products/modifiers/options?${secondaryParams.toString()}`;

  // Tertiary: legacy /modifiers/options?modifier_id=...
  const tertiary = `/modifiers/options?${secondaryParams.toString()}`;
  try {
    return await apiGet(primary);
  } catch (error: any) {
    const status = Number(error?.status);
    const shouldFallback =
      error?.name === "ApiError" && (status === 404 || status === 405);
    if (!shouldFallback) throw error;

    try {
      return await apiGet(secondary);
    } catch (fallbackError: any) {
      const fallbackStatus = Number(fallbackError?.status);
      const canFallbackFurther =
        fallbackError?.name === "ApiError" && (fallbackStatus === 404 || fallbackStatus === 405);
      if (!canFallbackFurther) throw fallbackError;

      return apiGet(tertiary);
    }
  }
}

/**
 * Create a modifier option
 */
export async function createModifierOption(modifierId: string, optionData: any) {
  const sanitizePayload = (data: any) => {
    if (!data || typeof data !== "object") return { modifier_id: modifierId };
    const candidate = data as Record<string, any>;
    const result: Record<string, any> = {};
    // allowed fields on /modifiers/options (strict backends may reject unknown keys)
    [
      "restaurant_id",
      "modifier_id",
      "name",
      "price",
      "available",
      "sort_order",
    ].forEach((key) => {
      if (candidate[key] !== undefined) result[key] = candidate[key];
    });
    result.modifier_id = String(result.modifier_id || modifierId);
    return result;
  };
  try {
    return await apiPost(`/products/modifiers/options`, sanitizePayload(optionData));
  } catch (error: any) {
    const status = Number(error?.status);
    const shouldFallback =
      error?.name === "ApiError" && (status === 404 || status === 405);
    if (!shouldFallback) throw error;

    try {
      return await apiPost(`/modifiers/options`, sanitizePayload(optionData));
    } catch (fallbackError: any) {
      const fallbackStatus = Number(fallbackError?.status);
      const canFallbackFurther =
        fallbackError?.name === "ApiError" && (fallbackStatus === 404 || fallbackStatus === 405);
      if (!canFallbackFurther) throw fallbackError;
      return apiPost(`/products/modifiers/${modifierId}/options`, optionData);
    }
  }
}

/**
 * Delete a modifier option
 */
export async function deleteModifierOption(optionId: string) {
  try {
    return await apiDelete(`/products/modifiers/options/${optionId}`);
  } catch (error: any) {
    const status = Number(error?.status);
    const shouldFallback =
      error?.name === "ApiError" && (status === 404 || status === 405);
    if (!shouldFallback) throw error;

    try {
      return await apiDelete(`/modifiers/options/${optionId}`);
    } catch (fallbackError: any) {
      const fallbackStatus = Number(fallbackError?.status);
      const canFallbackFurther =
        fallbackError?.name === "ApiError" && (fallbackStatus === 404 || fallbackStatus === 405);
      if (!canFallbackFurther) throw fallbackError;
      return apiDelete(`/products/modifiers/options/${optionId}`);
    }
  }
}

/**
 * Update a modifier option
 */
export async function updateModifierOption(optionId: string, optionData: any) {
  const sanitizePayload = (data: any) => {
    if (!data || typeof data !== "object") return {};
    const candidate = data as Record<string, any>;
    const result: Record<string, any> = {};
    [
      "restaurant_id",
      "modifier_id",
      "name",
      "price",
      "available",
      "sort_order",
    ].forEach((key) => {
      if (candidate[key] !== undefined) result[key] = candidate[key];
    });
    return result;
  };
  try {
    return await apiPut(
      `/products/modifiers/options/${optionId}`,
      sanitizePayload(optionData),
    );
  } catch (error: any) {
    const status = Number(error?.status);
    const shouldFallback =
      error?.name === "ApiError" && (status === 404 || status === 405);
    if (!shouldFallback) throw error;

    // If this endpoint doesn't exist on a given backend, rethrow (no PATCH fallback by request).
    throw error;
  }
}

/**
 * List modifier options (optionally filter by restaurant/modifier)
 * Prefer `/products/modifiers/options` but keep fallbacks for older routes.
 */
export async function listModifierOptions(filters?: {
  restaurant_id?: string;
  modifier_id?: string;
  page?: number;
  page_size?: number;
  available?: boolean;
  hidden?: boolean;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined) return;
      params.append(key, String(value));
    });
  }
  const query = params.toString();
  const primary = `/products/modifiers/options${query ? `?${query}` : ""}`;
  const secondary = `/modifiers/options${query ? `?${query}` : ""}`;

  try {
    return await apiGet(primary);
  } catch (error: any) {
    const status = Number(error?.status);
    const shouldFallback =
      error?.name === "ApiError" && (status === 404 || status === 405);
    if (!shouldFallback) throw error;
    return apiGet(secondary);
  }
}

// ==================== Order & Table Services ====================

export type TableListFilters = {
  skip?: number;
  limit?: number;
  status?: string;
  floor?: string;
  section?: string;
  is_active?: boolean;
  is_bookable?: boolean;
  min_capacity?: number;
};

/**
 * Get all tables for a restaurant
 * GET /api/v1/tables/restaurant/{restaurant_id}
 */
export async function getTables(
  restaurantId: string,
  filters?: TableListFilters,
) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined) return;
      params.append(key, String(value));
    });
  }
  const query = params.toString();
  return apiGet(
    `/tables/restaurant/${restaurantId}${query ? `?${query}` : ""}`,
  );
}

/**
 * Get available tables for a restaurant
 * GET /api/v1/tables/restaurant/{restaurant_id}/available
 */
export async function getAvailableTables(
  restaurantId: string,
  capacity?: number,
) {
  const params = new URLSearchParams();
  if (capacity !== undefined) {
    params.append("capacity", String(capacity));
  }
  const query = params.toString();
  return apiGet(
    `/tables/restaurant/${restaurantId}/available${query ? `?${query}` : ""}`,
  );
}

/**
 * Get table statistics for a restaurant
 * GET /api/v1/tables/restaurant/{restaurant_id}/statistics
 */
export async function getTableStatistics(restaurantId: string) {
  return apiGet(`/tables/restaurant/${restaurantId}/statistics`);
}

/**
 * Reserve a table with booking metadata stored in notes
 * PATCH /api/v1/tables/{table_id}
 */
export async function reserveTable(
  tableId: string,
  bookingData: {
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    partySize: number;
    bookingDate: Date;
    bookingTime: string;
    occasion?: string;
    specialRequests?: string;
  },
) {
  return updateTable(tableId, {
    status: "reserved",
    notes: encodeBookingNotes({ tableId, ...bookingData }),
  });
}

/**
 * Create a new table
 * POST /api/v1/tables
 */
export async function createTable(tableData: any) {
  if (tableData && tableData.image instanceof File) {
    const formData = new FormData();
    Object.entries(tableData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });
    return apiUpload("/tables", formData);
  }
  return apiPost("/tables", tableData);
}

/**
 * Update a table
 */
export async function updateTable(tableId: string, tableData: any) {
  const isMultipart = Object.values(tableData).some(v => v instanceof File);
  
  if (isMultipart) {
    const formData = new FormData();
    Object.entries(tableData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof File) {
          formData.append(key, value);
        } else {
          formData.append(key, String(value));
        }
      }
    });
    return apiUploadPut(`/tables/${tableId}`, formData);
  }

  try {
    return await apiPatch(`/tables/${tableId}`, tableData);
  } catch {
    return apiPut(`/tables/${tableId}`, tableData);
  }
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

/** @deprecated Use getKdsDisplaysByStation */
export async function getKdsTickets(stationId: string) {
  return getKdsDisplaysByStation(stationId);
}

export async function getKdsStations(restaurantId: string) {
  return apiGet(`/kds/stations/restaurant/${restaurantId}`);
}

export async function getKdsStation(stationId: string) {
  return apiGet(`/kds/stations/${stationId}`);
}

export async function getKdsDisplaysByStation(stationId: string) {
  return apiGet(`/kds/displays/station/${stationId}`);
}

export async function getKdsDisplay(displayId: string) {
  return apiGet(`/kds/displays/${displayId}`);
}

export async function routeOrderToKds(orderId: string) {
  return apiPost(`/kds/displays/route/${orderId}`, {});
}

export async function updateKdsItemStatus(itemId: string, status: string) {
  return apiPatch(`/kds/items/${itemId}/status`, { status });
}

export async function acknowledgeKdsDisplay(displayId: string) {
  return apiPost(`/kds/displays/${displayId}/acknowledge`, {});
}

export async function startKdsDisplay(displayId: string) {
  return apiPost(`/kds/displays/${displayId}/start`, {});
}

export async function completeKdsDisplay(displayId: string) {
  return apiPost(`/kds/displays/${displayId}/complete`, {});
}

export async function bumpKdsDisplay(displayId: string) {
  return apiPost(`/kds/displays/${displayId}/bump`, {});
}

export async function getKotJson(displayId: string) {
  return apiGet(`/kds/displays/${displayId}/kot/json`);
}

export async function printKot(displayId: string, format: "text" | "html" | "json" = "text") {
  return apiPost(`/kds/displays/${displayId}/kot/print?format=${format}`, {});
}

// ==================== Inventory Management ====================

/** Low-stock alerts for dashboard/inventory overview */
export async function getInventoryStock(restaurantId: string) {
  return getLowStockAlerts(restaurantId);
}

export async function getLowStockAlerts(restaurantId: string) {
  return apiGet(`/inventory/alerts/low-stock/restaurant/${restaurantId}`);
}

export async function resolveLowStockAlert(alertId: string) {
  return apiPost(`/inventory/alerts/low-stock/${alertId}/resolve`, {});
}

export async function getIngredients(restaurantId: string, skip = 0, limit = 100) {
  return apiGet(`/inventory/ingredients/restaurant/${restaurantId}?skip=${skip}&limit=${limit}`);
}

export async function createIngredient(data: Record<string, unknown>) {
  return apiPost("/inventory/ingredients", data);
}

export async function updateIngredient(ingredientId: string, data: Record<string, unknown>) {
  return apiPut(`/inventory/ingredients/${ingredientId}`, data);
}

export async function deleteIngredient(ingredientId: string) {
  return apiDelete(`/inventory/ingredients/${ingredientId}`);
}

export async function getStockTransactions(restaurantId: string, skip = 0, limit = 50) {
  return apiGet(`/inventory/stock/transactions/restaurant/${restaurantId}?skip=${skip}&limit=${limit}`);
}

export async function recordStockTransaction(transactionData: Record<string, unknown>) {
  return apiPost("/inventory/stock/transactions", transactionData);
}

export async function adjustStock(data: Record<string, unknown>) {
  return apiPost("/inventory/stock/adjustment", data);
}

export async function getSuppliers(restaurantId: string, skip = 0, limit = 100) {
  return apiGet(`/inventory/suppliers/restaurant/${restaurantId}?skip=${skip}&limit=${limit}`);
}


// ==================== Staff Management ====================

export async function getStaffMembers(restaurantId: string) {
  return apiGet<StaffMember[]>(`/staff/members/restaurant/${restaurantId}`);
}

export async function getStaffRoles(restaurantId: string) {
  return apiGet(`/staff/roles/restaurant/${restaurantId}`);
}

export async function getStaffAttendance(restaurantId: string, startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  const qs = params.toString();
  return apiGet(`/staff/attendance/restaurant/${restaurantId}${qs ? `?${qs}` : ""}`);
}

export async function getStaffShifts(restaurantId: string) {
  return apiGet(`/staff/shifts/restaurant/${restaurantId}`);
}

export async function clockStaff(
  restaurantId: string,
  staffId: string,
  action: "clock_in" | "clock_out",
  attendanceId?: string,
) {
  if (action === "clock_in") {
    return apiPost(`/staff/attendance/check-in?restaurant_id=${restaurantId}`, { staff_id: staffId });
  }
  if (!attendanceId) throw new Error("attendance_id required for clock out");
  return apiPost(`/staff/attendance/${attendanceId}/check-out`, {});
}

// ==================== Reports & Analytics ====================

/**
 * Get sales dashboard data
 * GET /api/v1/reports/dashboard/restaurant/{restaurant_id}
 */
export async function getDashboardStats(restaurantId: string, period = 'today') {
  return apiGet(`/reports/dashboard/restaurant/${restaurantId}?period=${period}`);
}

/** Generate sales report via POST (PDF endpoint not available). */
export async function generateSalesReport(restaurantId: string, startDate: string, endDate: string) {
  return generateSalesReportNew({
    restaurant_id: restaurantId,
    period_type: "daily",
    report_date: startDate,
  });
}

export async function getSuperAdminDashboard(period = "30d") {
  return apiGet(`/reports/dashboard/super-admin?period=${period}`);
}

// ==================== Customer Auth & Profile ====================

/**
 * Request OTP for customer login
 * POST /api/v1/customer-auth/send-otp
 */
export async function requestCustomerOTP(email: string, restaurantId: string) {
  return apiPost("/customer-auth/send-otp", { email, restaurant_id: restaurantId });
}

/**
 * Verify OTP for customer login
 * POST /api/v1/customer-auth/verify-otp
 */
export async function verifyCustomerOTP(email: string, restaurantId: string, otp: string) {
  return apiPost<{ customer: Customer; access_token: string; refresh_token: string; token_type: string }>(
    "/customer-auth/verify-otp",
    { email, restaurant_id: restaurantId, otp }
  );
}

/**
 * Refresh customer access token
 * POST /api/v1/customer-auth/refresh
 */
export async function refreshCustomerToken(refreshToken: string) {
  return apiPost<{ access_token: string; token_type: string }>("/customer-auth/refresh", { refresh_token: refreshToken });
}

/**
 * Get current customer profile
 * GET /api/v1/customer-auth/me
 */
export async function getCustomerProfile(): Promise<ApiResponse<BackendCustomer>> {
  return apiGet<ApiResponse<BackendCustomer>>("/customer-auth/me");
}

/**
 * Update customer profile
 * PATCH /api/v1/customer-auth/me
 */
export async function updateCustomerProfile(data: Partial<BackendCustomer>) {
  return apiPatch<ApiResponse<BackendCustomer>>("/customer-auth/me", data);
}

// ==================== Customer Addresses ====================

export async function getCustomerAddresses() {
  return apiGet<any[]>("/customer-auth/me/addresses");
}

export async function addCustomerAddress(addressData: any) {
  return apiPost<any>("/customer-auth/me/addresses", addressData);
}

export async function updateCustomerAddress(addressId: string, addressData: any) {
  return apiPut<any>(`/customer-auth/me/addresses/${addressId}`, addressData);
}

export async function deleteCustomerAddress(addressId: string) {
  return apiDelete(`/customer-auth/me/addresses/${addressId}`);
}

// ==================== Customer Orders ====================

export async function getCustomerOrders(skip = 0, limit = 50, status?: string) {
  const query = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
  if (status) query.append("order_status", status);
  return apiGet<{ orders: Order[]; total: number; skip: number; limit: number }>(`/customer-auth/me/orders?${query.toString()}`);
}

export async function getCustomerOrder(orderId: string) {
  return apiGet<Order>(`/customer-auth/me/orders/${orderId}`);
}

// ==================== Server-Side Cart ====================

export async function getCart(restaurantId: string, customerId: string) {
  return apiGet<QRCart>(`/carts/restaurant/${restaurantId}/customer/${customerId}`);
}

export async function addCartItem(data: {
  restaurant_id: string;
  customer_id: string;
  item_type: string;
  product_id?: string | null;
  combo_product_id?: string | null;
  quantity: number;
  modifier_option_ids?: string[];
  notes?: string | null;
}) {
  return apiPost<QRCart>("/carts/items", data);
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  return apiPatch<QRCart>(`/carts/items/${itemId}`, { quantity });
}

export async function removeCartItem(itemId: string, quantity?: number) {
  const query = quantity !== undefined ? `?quantity=${quantity}` : "";
  return apiDelete<QRCart>(`/carts/items/${itemId}${query}`);
}

export async function clearCart(restaurantId: string, customerId: string) {
  return apiDelete(`/carts/restaurant/${restaurantId}/customer/${customerId}`);
}

// ==================== Order Statistics ====================

/**
 * Get order statistics for a restaurant
 * GET /api/v1/orders/restaurant/{restaurant_id}/statistics
 */
export async function getOrderStatistics(
  restaurantId: string,
  startDate?: string,
  endDate?: string,
) {
  const params = new URLSearchParams();
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  const query = params.toString();
  return apiGet<OrderStatistics>(
    `/orders/restaurant/${restaurantId}/statistics${query ? `?${query}` : ""}`,
  );
}

/**
 * Get orders with filters
 * GET /api/v1/orders/restaurant/{restaurant_id}
 */
export async function getFilteredOrders(
  restaurantId: string,
  filters?: {
    status?: string;
    order_type?: string;
    payment_status?: string;
    start_date?: string;
    end_date?: string;
    skip?: number;
    limit?: number;
    search?: string;
  },
) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) params.append(key, String(value));
    });
  }
  const query = params.toString();
  return apiGet<any>(`/orders/restaurant/${restaurantId}${query ? `?${query}` : ""}`);
}

/**
 * Fetch ALL orders for a restaurant by paginating through the API (max 100 per page).
 */
export async function fetchAllFilteredOrders(
  restaurantId: string,
  filters?: Omit<Parameters<typeof getFilteredOrders>[1], "skip" | "limit">,
): Promise<any[]> {
  const PAGE = 100;
  const allOrders: any[] = [];
  let skip = 0;
  while (true) {
    const res = await getFilteredOrders(restaurantId, { ...filters, skip, limit: PAGE });
    const src = (res as any)?.data ?? res;
    const page: any[] = Array.isArray(src)
      ? src
      : Array.isArray(src?.orders)
      ? src.orders
      : Array.isArray(src?.items)
      ? src.items
      : [];
    allOrders.push(...page);
    if (page.length < PAGE) break;
    skip += PAGE;
  }
  return allOrders;
}

/**
 * Cancel an order
 * POST /api/v1/orders/{order_id}/cancel
 */
export async function cancelOrder(orderId: string, reason?: string) {
  return apiPost<Order>(`/orders/${orderId}/cancel`, { reason });
}

/**
 * Update order payment
 * PATCH /api/v1/orders/{order_id}/payment
 */
export async function updateOrderPayment(
  orderId: string,
  paymentData: { payment_status: string; payment_method?: string },
) {
  return apiPatch<Order>(`/orders/${orderId}/payment`, paymentData);
}

/**
 * Get a single order by ID
 * GET /api/v1/orders/{order_id}
 */
export async function getOrderById(orderId: string) {
  return apiGet<Order>(`/orders/${orderId}`);
}

/**
 * Update order fields
 * PUT /api/v1/orders/{order_id}
 */
export async function updateOrder(orderId: string, orderData: Record<string, unknown>) {
  return apiPut<Order>(`/orders/${orderId}`, orderData);
}

/**
 * Update an order line item
 * PUT /api/v1/orders/items/{item_id}
 */
export async function updateOrderItem(
  itemId: string,
  itemData: { quantity?: number; notes?: string; customization?: string },
) {
  return apiPut(`/orders/items/${itemId}`, itemData);
}

// ==================== Table Delete ====================

/**
 * Delete a table
 * DELETE /api/v1/tables/{table_id}
 */
export async function deleteTable(tableId: string) {
  return apiDelete(`/tables/${tableId}`);
}

// ==================== Admin Customer CRUD ====================

function sanitizeAdminCustomerPayload<T extends Record<string, unknown>>(data: T): T {
  const payload = { ...data } as Record<string, unknown>;
  for (const key of ["email", "phone", "address", "notes"]) {
    if (typeof payload[key] === "string" && !String(payload[key]).trim()) {
      delete payload[key];
    }
  }
  return payload as T;
}

/**
 * List customers for a restaurant (admin)
 * GET /api/v1/customers/?restaurant_id=&search=&skip=&limit=
 */
export async function getAdminCustomers(
  restaurantId: string,
  options?: { search?: string; is_active?: boolean; skip?: number; limit?: number },
) {
  const params = new URLSearchParams();
  params.append("restaurant_id", restaurantId);
  if (options?.search) params.append("search", options.search);
  if (options?.is_active !== undefined) params.append("is_active", String(options.is_active));
  params.append("skip", String(options?.skip ?? 0));
  params.append("limit", String(options?.limit ?? 100));
  return apiGet<BackendCustomerListResponse>(`/customers/?${params.toString()}`);
}

/**
 * Get customer by ID (admin)
 * GET /api/v1/customers/{customer_id}
 */
export async function getAdminCustomerById(customerId: string) {
  return apiGet<BackendCustomer>(`/customers/${customerId}`);
}

/**
 * Create customer (admin)
 * POST /api/v1/customers/
 */
export async function createAdminCustomer(data: {
  restaurant_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  is_active?: boolean;
}) {
  return apiPost<BackendCustomer>("/customers/", sanitizeAdminCustomerPayload(data));
}

/**
 * Update customer (admin)
 * PUT /api/v1/customers/{customer_id}
 */
export async function updateAdminCustomer(
  customerId: string,
  data: Partial<{
    name: string;
    email: string;
    phone: string;
    address: string;
    notes: string;
    is_active: boolean;
  }>,
) {
  return apiPut<BackendCustomer>(`/customers/${customerId}`, sanitizeAdminCustomerPayload(data));
}

/**
 * Delete customer (admin)
 * DELETE /api/v1/customers/{customer_id}
 */
export async function deleteAdminCustomer(customerId: string, permanent = false) {
  return apiDelete(`/customers/${customerId}?permanent=${permanent}`);
}

// ==================== Staff Full CRUD ====================

export async function createStaffMember(data: Partial<StaffMember>) {
  return apiPost<StaffMember>("/staff/members", data);
}

export async function updateStaffMember(staffId: string, data: Partial<StaffMember>) {
  return apiPut<StaffMember>(`/staff/members/${staffId}`, data);
}

export async function deleteStaffMember(staffId: string) {
  return apiDelete(`/staff/members/${staffId}`);
}

// ==================== Reports Full Suite ====================

/**
 * Generate daily/monthly sales report
 * POST /api/v1/reports/sales/generate
 */
export async function generateSalesReportNew(data: {
  restaurant_id: string;
  period_type: "daily" | "monthly";
  report_date?: string;
  report_month?: number;
  report_year?: number;
}) {
  return apiPost<SalesReport>("/reports/sales/generate", data);
}

/**
 * List sales reports for a restaurant
 * GET /api/v1/reports/sales?restaurant_id=&period_type=&skip=&limit=
 */
export async function listSalesReports(
  restaurantId: string,
  options?: { period_type?: "daily" | "monthly"; skip?: number; limit?: number },
) {
  const params = new URLSearchParams();
  params.append("restaurant_id", restaurantId);
  if (options?.period_type) params.append("period_type", options.period_type);
  params.append("skip", String(options?.skip ?? 0));
  params.append("limit", String(options?.limit ?? 30));
  return apiGet<SalesReport[]>(`/reports/sales?${params.toString()}`);
}

/**
 * Generate item-wise sales report
 * POST /api/v1/reports/items/generate
 */
export async function generateItemReport(data: {
  restaurant_id: string;
  start_date?: string;
  end_date?: string;
}) {
  return apiPost<ItemWiseReport[]>("/reports/items/generate", data);
}

/**
 * List item-wise reports
 * GET /api/v1/reports/items?restaurant_id=&skip=&limit=
 */
export async function listItemReports(
  restaurantId: string,
  options?: { skip?: number; limit?: number },
) {
  const params = new URLSearchParams();
  params.append("restaurant_id", restaurantId);
  params.append("skip", String(options?.skip ?? 0));
  params.append("limit", String(options?.limit ?? 50));
  return apiGet<ItemWiseReport[]>(`/reports/items?${params.toString()}`);
}

/**
 * Generate category-wise report
 * POST /api/v1/reports/categories/generate
 */
export async function generateCategoryReport(data: {
  restaurant_id: string;
  start_date?: string;
  end_date?: string;
}) {
  return apiPost<CategoryWiseReport[]>("/reports/categories/generate", data);
}

/**
 * List category reports
 * GET /api/v1/reports/categories?restaurant_id=&skip=&limit=
 */
export async function listCategoryReports(
  restaurantId: string,
  options?: { skip?: number; limit?: number },
) {
  const params = new URLSearchParams();
  params.append("restaurant_id", restaurantId);
  params.append("skip", String(options?.skip ?? 0));
  params.append("limit", String(options?.limit ?? 50));
  return apiGet<CategoryWiseReport[]>(`/reports/categories?${params.toString()}`);
}

// ==================== Data Copy / Migration ====================

export interface DataCopyOptions {
  skip_duplicates?: boolean;
  copy_images?: boolean;
  copy_prices?: boolean;
  copy_stock?: boolean;
  maintain_relationships?: boolean;
  include_inactive?: boolean;
  include_unavailable?: boolean;
}

export interface DataCopyCreatePayload {
  source_restaurant_id: string;
  destination_restaurant_ids: string[];
  copy_type: "category" | "product" | "combo" | "modifier" | "category_products" | "full_menu";
  copy_name?: string;
  notes?: string;
  options?: DataCopyOptions;
}

export interface DataCopyOperation {
  id: string;
  copy_number: string;
  copy_name: string;
  source_restaurant_id: string;
  destination_restaurant_id: string;
  copy_type: string;
  status: "pending" | "processing" | "completed" | "failed" | "partial";
  processing_started_at: string | null;
  processing_completed_at: string | null;
  processing_time: number | null;
  statistics: {
    total_items: number;
    items_copied: number;
    items_skipped: number;
    items_failed: number;
    categories_copied: number;
    products_copied: number;
    combos_copied: number;
    modifiers_copied: number;
    duplicates_found: number;
    duplicates_skipped: number;
  };
  skip_duplicates: boolean;
  copy_images: boolean;
  copy_prices: boolean;
  copy_stock: boolean;
  maintain_relationships: boolean;
  error_message: string | null;
  notes: string | null;
  copied_by: string;
  created_at: string;
  updated_at: string;
}

export async function createDataCopy(payload: DataCopyCreatePayload) {
  return apiPost<{ copies: DataCopyOperation[] }>("/data-copy/copy", payload);
}

export async function listDataCopies(params?: {
  page?: number;
  page_size?: number;
  source_restaurant_id?: string;
  destination_restaurant_id?: string;
  status?: string;
  copy_type?: string;
}) {
  const p = new URLSearchParams();
  if (params?.page) p.append("page", String(params.page));
  if (params?.page_size) p.append("page_size", String(params.page_size));
  if (params?.source_restaurant_id) p.append("source_restaurant_id", params.source_restaurant_id);
  if (params?.destination_restaurant_id) p.append("destination_restaurant_id", params.destination_restaurant_id);
  if (params?.status) p.append("status", params.status);
  if (params?.copy_type) p.append("copy_type", params.copy_type);
  return apiGet<{ items: DataCopyOperation[]; total: number; page: number; pages: number }>(
    `/data-copy/copies?${p.toString()}`
  );
}

export async function getDataCopyDetail(copyId: string) {
  return apiGet<DataCopyOperation & {
    entity_mapping: any;
    copy_summary: any;
    skipped_items: any;
    failed_items: any;
  }>(`/data-copy/copies/${copyId}`);
}

export async function getDataCopyLogs(copyId: string, params?: { page?: number; page_size?: number; status?: string; entity_type?: string }) {
  const p = new URLSearchParams();
  if (params?.page) p.append("page", String(params.page));
  if (params?.page_size) p.append("page_size", String(params.page_size));
  if (params?.status) p.append("status", params.status);
  if (params?.entity_type) p.append("entity_type", params.entity_type);
  return apiGet<{ items: any[]; total: number; page: number; pages: number }>(
    `/data-copy/copies/${copyId}/logs?${p.toString()}`
  );
}

export async function getDataCopyStatistics(restaurantId?: string) {
  const p = restaurantId ? `?restaurant_id=${restaurantId}` : "";
  return apiGet<{
    total_copies: number;
    total_items_copied: number;
    total_items_skipped: number;
    total_categories_copied: number;
    total_products_copied: number;
  }>(`/data-copy/statistics${p}`);
}

// ==================== Table transfer approvals (QR dine-in) ====================

export type TableTransferRequest = {
  id: string;
  old_table_uuid: string;
  new_table_uuid: string;
  customer_uuid: string;
  restaurant_uuid: string;
  order_uuid?: string;
  status: string;
  created_at: string;
};

export async function getPendingTableTransfers(restaurantId: string, skip = 0, limit = 50): Promise<
  ApiResponse<{
    transfers: TableTransferRequest[];
    total: number;
    skip: number;
    limit: number;
  }>
> {
  return apiGet<
    ApiResponse<{
      transfers: TableTransferRequest[];
      total: number;
      skip: number;
      limit: number;
    }>
  >(`/table-transfers/restaurant/${restaurantId}/pending?skip=${skip}&limit=${limit}`);
}

export async function approveTableTransfer(transferId: string) {
  return apiPatch<{ transfer: TableTransferRequest }>(`/table-transfers/${transferId}/approve`, {});
}

export async function rejectTableTransfer(transferId: string) {
  return apiPatch<{ transfer: TableTransferRequest }>(`/table-transfers/${transferId}/reject`, {});
}

// ==================== QR table order approvals ====================

export type QrTableOrderApproval = {
  id: string;
  order_number: string;
  table_id?: string;
  customer_id?: string;
  status: string;
  total_amount: number;
  items: Array<{
    id?: string;
    product_name: string;
    name?: string;
    quantity: number;
    total_price: number;
    unit_price?: number;
  }>;
  created_at: string;
};

export async function getPendingQrTableOrders(restaurantId: string, skip = 0, limit = 50): Promise<
  ApiResponse<{
    orders: QrTableOrderApproval[];
    total: number;
    skip: number;
    limit: number;
  }>
> {
  return apiGet<
    ApiResponse<{
      orders: QrTableOrderApproval[];
      total: number;
      skip: number;
      limit: number;
    }>
  >(`/qr-table-orders/restaurant/${restaurantId}/pending?skip=${skip}&limit=${limit}`);
}

export async function approveQrTableOrder(orderId: string) {
  return apiPatch<{ order: QrTableOrderApproval }>(`/qr-table-orders/${orderId}/approve`, {});
}

export async function rejectQrTableOrder(orderId: string) {
  return apiPatch<{ order: QrTableOrderApproval }>(`/qr-table-orders/${orderId}/reject`, {});
}
