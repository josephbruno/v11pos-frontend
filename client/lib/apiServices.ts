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
  CategoryFilters, ProductFilters, OrderFilters, ModifierFilters,
  CategoryListResponse, ProductListResponse, OrderListResponse, Homebanner, RowManagement, RowType
} from "@shared/api";
import { validateUserPayload } from "./userValidation";

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

/**
 * Get all tables for a restaurant
 * GET /api/v1/tables/restaurant/{restaurant_id}
 */
export async function getTables(restaurantId: string) {
  return apiGet(`/tables/restaurant/${restaurantId}`);
}

/**
 * Create a new table
 * POST /api/v1/tables
 */
export async function createTable(tableData: any) {
  return apiPost("/tables", tableData);
}

/**
 * Update a table
 */
export async function updateTable(tableId: string, tableData: any) {
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
