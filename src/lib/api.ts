import axios from "axios";
import { toast } from "react-hot-toast";

// API Base URL - Use Next.js proxy to avoid CORS issues
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";
  createdAt: string; // ISO 8601 formatted date string
  avatarUrl?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleAuthRequest {
  idToken: string;
}

export interface PhoneStartRequest {
  phone: string;
}

export interface PhoneVerifyRequest {
  phone: string;
  otp: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface UpdateProfileRequest {
  name: string;
  phone?: string;
  avatarUrl?: string;
}

// Token management
let accessToken: string | null = null;
let refreshToken: string | null = null;

// Initialize tokens from localStorage on app startup
if (typeof window !== "undefined") {
  accessToken = localStorage.getItem("accessToken");
  refreshToken = localStorage.getItem("refreshToken");
}

export const setTokens = (access: string, refresh: string) => {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem("accessToken", access);
  localStorage.setItem("refreshToken", refresh);

  // Dispatch custom event to notify components
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("authStateChanged"));
  }
};

export const getTokens = () => {
  if (typeof window !== "undefined") {
    return {
      accessToken: localStorage.getItem("accessToken"),
      refreshToken: localStorage.getItem("refreshToken"),
    };
  }
  return { accessToken: null, refreshToken: null };
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    // Dispatch custom event to notify components
    window.dispatchEvent(new CustomEvent("authStateChanged"));
  }
};

// Utility function to check if user is authenticated
export const isAuthenticated = (): boolean => {
  const tokens = getTokens();
  return !!(tokens.accessToken && tokens.refreshToken);
};

// Utility function to manually refresh token
export const refreshAuthToken = async (): Promise<boolean> => {
  try {
    const tokens = getTokens();
    if (!tokens.refreshToken) {
      return false;
    }

    const response = await api.post("/api/v1/auth/refresh", {
      refreshToken: tokens.refreshToken,
    });

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      response.data;
    setTokens(newAccessToken, newRefreshToken);
    return true;
  } catch (error) {
    console.error("Manual token refresh failed:", error);
    clearTokens();
    return false;
  }
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const tokens = getTokens();
    if (tokens.accessToken) {
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle both 401 (Unauthorized) and 403 (Forbidden) as potential token expiration
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const tokens = getTokens();
        if (tokens.refreshToken) {
          console.log("Attempting to refresh token...");
          const response = await api.post("/api/v1/auth/refresh", {
            refreshToken: tokens.refreshToken,
          });

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            response.data;
          setTokens(newAccessToken, newRefreshToken);
          console.log("Token refreshed successfully");

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } else {
          console.log("No refresh token available.");
          clearTokens();
          // Do not force redirect here to avoid navigation loops
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        clearTokens();
        // Notify user once; avoid hard redirects that can cause loops
        toast.error("Session expired. Please login again.");
        return Promise.reject(refreshError);
      }
    }

    // Show error toast for API errors (but not for auth errors as they're handled above)
    if (error.response?.status !== 401 && error.response?.status !== 403) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message) {
        toast.error(error.message);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post("/api/v1/auth/register", data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post("/api/v1/auth/login", data);
    return response.data;
  },

  googleAuth: async (data: GoogleAuthRequest): Promise<AuthResponse> => {
    const response = await api.post("/api/v1/auth/google", data);
    return response.data;
  },

  phoneStart: async (data: PhoneStartRequest): Promise<void> => {
    await api.post("/api/v1/auth/phone/start", data);
  },

  phoneVerify: async (data: PhoneVerifyRequest): Promise<AuthResponse> => {
    const response = await api.post("/api/v1/auth/phone/verify", data);
    return response.data;
  },

  refresh: async (data: RefreshRequest): Promise<AuthResponse> => {
    const response = await api.post("/api/v1/auth/refresh", data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    const tokens = getTokens();
    if (tokens.refreshToken) {
      await api.post(
        "/api/v1/auth/logout",
        {},
        {
          headers: {
            "X-Refresh-Token": tokens.refreshToken,
          },
        }
      );
    }
    clearTokens();
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<void> => {
    await api.post("/api/v1/auth/password/forgot", data);
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<void> => {
    await api.post("/api/v1/auth/password/reset", data);
  },
};

// User API
export const userApi = {
  getProfile: async (): Promise<User> => {
    const response = await api.get("/api/v1/users/me");
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await api.patch("/api/v1/users/me", data);
    return response.data;
  },
};

// Media Upload Types
export type MediaOwnerType =
  | "PRODUCT"
  | "VARIANT"
  | "BRAND"
  | "CATEGORY"
  | "USER";
export type MediaType = "IMAGE" | "VIDEO" | "DOCUMENT";

export interface MediaUploadRequest {
  ownerType: MediaOwnerType;
  ownerId: string;
  mediaType: MediaType;
  alt?: string;
  sortOrder?: number;
}

export interface MediaUploadResponse {
  id: string;
  url: string;
  publicId?: string;
  type: MediaType;
  alt?: string;
  sortOrder: number;
}

export interface SignedUploadUrlRequest {
  ownerType: MediaOwnerType;
  ownerId: string;
  mediaType: MediaType;
}

export interface SignedUploadUrlResponse {
  uploadUrl: string;
  uploadParameters: Record<string, any>;
  expiresAt: number;
}

// Media API
export const mediaApi = {
  generateUploadUrl: async (
    data: SignedUploadUrlRequest
  ): Promise<SignedUploadUrlResponse> => {
    const response = await api.post("/api/v1/media/upload-url", data);
    return response.data;
  },

  uploadFile: async (
    file: File,
    data: MediaUploadRequest
  ): Promise<MediaUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });

    const response = await api.post("/api/v1/media/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  saveMediaMetadata: async (
    data: MediaUploadRequest,
    cloudinaryUrl: string,
    publicId: string
  ): Promise<MediaUploadResponse> => {
    const response = await api.post(
      `/api/v1/media/metadata?cloudinaryUrl=${encodeURIComponent(
        cloudinaryUrl
      )}&publicId=${encodeURIComponent(publicId)}`,
      data
    );
    return response.data;
  },

  getMediaByOwner: async (
    ownerType: MediaOwnerType,
    ownerId: string
  ): Promise<MediaUploadResponse[]> => {
    const response = await api.get(
      `/api/v1/media/owner/${ownerType}/${ownerId}`
    );
    return response.data;
  },

  deleteMedia: async (mediaId: string): Promise<void> => {
    await api.delete(`/api/v1/media/${mediaId}`);
  },

  updateMediaOrder: async (
    mediaId: string,
    sortOrder: number
  ): Promise<void> => {
    await api.put(`/api/v1/media/${mediaId}/order?sortOrder=${sortOrder}`);
  },
};

// Admin Dashboard Types
export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalCategories: number;
  totalBrands: number;
  totalUsers: number;
  inStockItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalInventoryValue: number;
  productGrowthPercentage: number;
  userGrowthPercentage: number;
  // Growth percentages for analytics (optional since backend may not provide them)
  productGrowth?: number;
  userGrowth?: number;
  categoryGrowth?: number;
  brandGrowth?: number;
  inventory?: {
    totalStock: number;
    totalValue: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
    reserved: number;
  };
}

export interface SalesChartData {
  date: string;
  revenue?: number;
  orders?: number;
  sales?: number; // Added for analytics compatibility
}

export interface TopProductData {
  productId: string;
  title: string;
  productTitle?: string; // Added for analytics compatibility
  totalRevenue?: number;
  revenue?: number; // Added for analytics compatibility
  unitsSold?: number;
  sales?: number; // Added for analytics compatibility
  averageRating: number;
}

export interface RecentActivityData {
  id: string;
  type: string;
  action?: string; // Added for analytics compatibility
  description: string;
  details?: string; // Added for analytics compatibility
  timestamp?: string;
  user: string;
}

// Admin API
export const adminApi = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get("/api/v1/admin/dashboard/stats");
    return response.data;
  },

  getSalesChart: async (days: number = 30): Promise<SalesChartData[]> => {
    const response = await api.get(
      `/api/v1/admin/dashboard/sales-chart?days=${days}`
    );
    return response.data;
  },

  getTopProducts: async (limit: number = 10): Promise<TopProductData[]> => {
    const response = await api.get(
      `/api/v1/admin/dashboard/top-products?limit=${limit}`
    );
    return response.data;
  },

  getRecentActivity: async (
    limit: number = 20
  ): Promise<RecentActivityData[]> => {
    const response = await api.get(
      `/api/v1/admin/dashboard/recent-activity?limit=${limit}`
    );
    return response.data;
  },

  getLowStockAlerts: async (): Promise<string[]> => {
    const response = await api.get("/api/v1/admin/dashboard/low-stock-alerts");
    return response.data;
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get("/api/v1/admin/categories");
    return response.data;
  },

  createCategory: async (data: CreateCategoryRequest): Promise<Category> => {
    const response = await api.post("/api/v1/admin/categories", data);
    return response.data;
  },

  updateCategory: async (
    id: string,
    data: UpdateCategoryRequest
  ): Promise<Category> => {
    const response = await api.put(`/api/v1/admin/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/admin/categories/${id}`);
  },

  // Brands
  getBrands: async (): Promise<Brand[]> => {
    const response = await api.get("/api/v1/admin/brands");
    return response.data;
  },

  createBrand: async (data: CreateBrandRequest): Promise<Brand> => {
    const response = await api.post("/api/v1/admin/brands", data);
    return response.data;
  },

  updateBrand: async (id: string, data: UpdateBrandRequest): Promise<Brand> => {
    const response = await api.put(`/api/v1/admin/brands/${id}`, data);
    return response.data;
  },

  // Products
  getAllProducts: async (): Promise<Product[]> => {
    const response = await api.get("/api/v1/admin/products");
    return response.data;
  },

  getProductById: async (id: string): Promise<Product> => {
    const response = await api.get(`/api/v1/admin/products/${id}`);
    return response.data;
  },

  createProduct: async (data: CreateProductRequest): Promise<Product> => {
    const response = await api.post("/api/v1/admin/products", data);
    return response.data;
  },

  updateProduct: async (
    id: string,
    data: UpdateProductRequest
  ): Promise<Product> => {
    const response = await api.put(`/api/v1/admin/products/${id}`, data);
    return response.data;
  },

  // Variants
  addVariant: async (
    productId: string,
    data: CreateVariantRequest
  ): Promise<ProductVariant> => {
    const response = await api.post(
      `/api/v1/admin/products/${productId}/variants`,
      data
    );
    return response.data;
  },

  updateVariant: async (
    id: string,
    data: UpdateVariantRequest
  ): Promise<ProductVariant> => {
    const response = await api.put(`/api/v1/admin/variants/${id}`, data);
    return response.data;
  },

  // Inventory
  updateInventory: async (
    variantId: string,
    data: UpdateInventoryRequest
  ): Promise<Inventory> => {
    const response = await api.put(
      `/api/v1/admin/inventory/${variantId}`,
      data
    );
    return response.data;
  },

  // Users Management
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get("/api/v1/admin/users");
    return response.data;
  },

  updateUserRole: async (
    userId: string,
    role: "ADMIN" | "USER"
  ): Promise<User> => {
    const response = await api.put(`/api/v1/admin/users/${userId}/role`, {
      role,
    });
    return response.data;
  },

  updateUserStatus: async (
    userId: string,
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED"
  ): Promise<User> => {
    const response = await api.put(`/api/v1/admin/users/${userId}/status`, {
      status,
    });
    return response.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`/api/v1/admin/users/${userId}`);
  },
};

// Catalog Types
export interface Category {
  id: string;
  parentId?: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  children?: Category[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  categoryId: string;
  brandId: string;
  title: string;
  slug: string;
  description?: string;
  conditionGrade: "A" | "B" | "C";
  warrantyMonths: number;
  isActive: boolean;
  isBestseller?: boolean;
  createdAt: string;
  category?: Category;
  brand?: Brand;
  variants?: ProductVariant[];
  images?: Media[];
  averageRating?: number;
  totalReviews?: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  mpn?: string;
  color?: string;
  storageGb?: number;
  ramGb?: number;
  priceMrp: number;
  priceSale: number;
  taxRate: number;
  weightGrams: number;
  isActive: boolean;
  createdAt: string;
  inventory?: Inventory;
  // CPU info
  cpuVendor?: string;
  cpuSeries?: string;
  cpuGeneration?: string;
  cpuModel?: string;
}

export interface Inventory {
  variantId: string;
  quantity: number;
  safetyStock: number;
  reserved: number;
  available: number;
  inStock: boolean;
  lowStock: boolean;
}

export interface Media {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO" | "DOCUMENT";
  alt?: string;
  sortOrder: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface ProductSearchParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: "asc" | "desc";
  q?: string;
  category?: string;
  brand?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  processorVendor?: string;
  processorSeries?: string;
  processorGeneration?: string;
  bestseller?: boolean;
}

// Admin Types
export type ConditionGrade = "A" | "B" | "C";

// Admin Request Types
export interface CreateCategoryRequest {
  parentId?: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateCategoryRequest {
  parentId?: string;
  name?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CreateBrandRequest {
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
}

export interface UpdateBrandRequest {
  name?: string;
  slug?: string;
  description?: string;
  logoUrl?: string;
  isActive?: boolean;
}

export interface CreateProductRequest {
  categoryId: string;
  brandId: string;
  title: string;
  slug: string;
  description?: string;
  conditionGrade: ConditionGrade;
  warrantyMonths?: number;
  isBestseller?: boolean;
}

export interface UpdateProductRequest {
  categoryId?: string;
  brandId?: string;
  title?: string;
  slug?: string;
  description?: string;
  conditionGrade?: ConditionGrade;
  warrantyMonths?: number;
  isActive?: boolean;
  isBestseller?: boolean;
}

export interface CreateVariantRequest {
  sku: string;
  mpn?: string;
  color?: string;
  storageGb?: number;
  ramGb?: number;
  cpuVendor?: string;
  cpuSeries?: string;
  cpuGeneration?: string;
  cpuModel?: string;
  priceMrp: number;
  priceSale: number;
  taxRate?: number;
  weightGrams?: number;
  isActive?: boolean;
}

export interface UpdateVariantRequest {
  sku?: string;
  mpn?: string;
  color?: string;
  storageGb?: number;
  ramGb?: number;
  cpuVendor?: string;
  cpuSeries?: string;
  cpuGeneration?: string;
  cpuModel?: string;
  priceMrp?: number;
  priceSale?: number;
  taxRate?: number;
  weightGrams?: number;
  isActive?: boolean;
}

export interface UpdateInventoryRequest {
  quantity?: number;
  safetyStock?: number;
  reserved?: number;
}

// Catalog API
export const catalogApi = {
  // Categories
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get("/api/v1/categories");
    return response.data;
  },

  getCategoryTree: async (): Promise<Category[]> => {
    const response = await api.get("/api/v1/categories/tree");
    return response.data;
  },

  getCategoryBySlug: async (slug: string): Promise<Category> => {
    const response = await api.get(`/api/v1/categories/${slug}`);
    return response.data;
  },

  // Brands
  getBrands: async (): Promise<Brand[]> => {
    const response = await api.get("/api/v1/brands");
    return response.data;
  },

  getBrandBySlug: async (slug: string): Promise<Brand> => {
    const response = await api.get(`/api/v1/brands/${slug}`);
    return response.data;
  },

  // Products
  searchProducts: async (
    params: ProductSearchParams
  ): Promise<PageResponse<Product>> => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const response = await api.get(`/api/v1/products?${searchParams}`);
    return response.data;
  },

  getProductBySlug: async (slug: string): Promise<Product> => {
    const response = await api.get(`/api/v1/products/${slug}`);
    return response.data;
  },
};

// Cart Types
export interface CartItem {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  priceSnapshot: number;
  taxRateSnapshot: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  variant?: ProductVariant;
  product?: Product;
}

export interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  taxTotal: number;
  grandTotal: number;

  // Coupon information
  appliedCoupon?: Coupon;
  couponDiscount?: number;
  finalTotal?: number;

  createdAt: string;
  updatedAt: string;
}

export interface AddToCartRequest {
  variantId: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

// Wishlist Types
export interface WishlistItem {
  id: string;
  wishlistId: string;
  variantId: string;
  createdAt: string;
  variant?: ProductVariant;
}

export interface Wishlist {
  id: string;
  userId: string;
  items: WishlistItem[];
  totalItems: number;
  createdAt: string;
  updatedAt: string;
}

export interface AddToWishlistRequest {
  variantId: string;
}

// Review Types
export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  title: string;
  content?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface CreateReviewRequest {
  productId: string;
  rating: number;
  title: string;
  content?: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  title?: string;
  content?: string;
}

export interface ProductReviewSummary {
  productId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  recentReviews: Review[];
}

// Cart API
export const cartApi = {
  getCart: async (sessionId?: string): Promise<Cart> => {
    const params = sessionId ? { sessionId } : {};
    const response = await api.get("/api/v1/cart", { params });
    return response.data;
  },

  addToCart: async (
    request: AddToCartRequest,
    sessionId?: string
  ): Promise<Cart> => {
    const params = sessionId ? { sessionId } : {};
    const response = await api.post("/api/v1/cart/items", request, { params });
    return response.data;
  },

  updateCartItem: async (
    itemId: string,
    request: UpdateCartItemRequest,
    sessionId?: string
  ): Promise<Cart> => {
    const params = sessionId ? { sessionId } : {};
    const response = await api.patch(`/api/v1/cart/items/${itemId}`, request, {
      params,
    });
    return response.data;
  },

  removeFromCart: async (itemId: string, sessionId?: string): Promise<Cart> => {
    const params = sessionId ? { sessionId } : {};
    const response = await api.delete(`/api/v1/cart/items/${itemId}`, {
      params,
    });
    return response.data;
  },

  clearCart: async (sessionId?: string): Promise<Cart> => {
    const params = sessionId ? { sessionId } : {};
    const response = await api.delete("/api/v1/cart", { params });
    return response.data;
  },

  mergeCarts: async (sessionId?: string): Promise<Cart> => {
    const params = sessionId ? { sessionId } : {};
    const response = await api.post("/api/v1/cart/merge", {}, { params });
    return response.data;
  },
};

// Wishlist API
export const wishlistApi = {
  getWishlist: async (): Promise<Wishlist> => {
    const response = await api.get("/api/v1/wishlist");
    return response.data;
  },

  addToWishlist: async (request: AddToWishlistRequest): Promise<Wishlist> => {
    const response = await api.post("/api/v1/wishlist/items", request);
    return response.data;
  },

  removeFromWishlist: async (itemId: string): Promise<Wishlist> => {
    const response = await api.delete(`/api/v1/wishlist/items/${itemId}`);
    return response.data;
  },

  removeFromWishlistByVariant: async (variantId: string): Promise<Wishlist> => {
    const response = await api.delete(
      `/api/v1/wishlist/items/variant/${variantId}`
    );
    return response.data;
  },

  clearWishlist: async (): Promise<Wishlist> => {
    const response = await api.delete("/api/v1/wishlist");
    return response.data;
  },

  isInWishlist: async (variantId: string): Promise<boolean> => {
    const response = await api.get(`/api/v1/wishlist/check/${variantId}`);
    return response.data;
  },
};

// Review API
export const reviewApi = {
  createReview: async (request: CreateReviewRequest): Promise<Review> => {
    const response = await api.post("/api/v1/reviews", request);
    return response.data;
  },

  updateReview: async (
    reviewId: string,
    request: UpdateReviewRequest
  ): Promise<Review> => {
    const response = await api.patch(`/api/v1/reviews/${reviewId}`, request);
    return response.data;
  },

  deleteReview: async (reviewId: string): Promise<void> => {
    await api.delete(`/api/v1/reviews/${reviewId}`);
  },

  getProductReviews: async (
    productId: string,
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<Review>> => {
    const response = await api.get(`/api/v1/reviews/product/${productId}`, {
      params: { page, size },
    });
    return response.data;
  },

  getProductReviewSummary: async (
    productId: string
  ): Promise<ProductReviewSummary> => {
    const response = await api.get(
      `/api/v1/reviews/product/${productId}/summary`
    );
    return response.data;
  },

  getUserReviews: async (
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<Review>> => {
    const response = await api.get("/api/v1/reviews/my", {
      params: { page, size },
    });
    return response.data;
  },

  getUserReviewForProduct: async (
    productId: string
  ): Promise<Review | null> => {
    try {
      const response = await api.get(`/api/v1/reviews/my/product/${productId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },
};

// Admin Review API
export const adminReviewApi = {
  getPending: async (
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<Review>> => {
    const response = await api.get("/api/v1/reviews/admin/pending", {
      params: { page, size },
    });
    return response.data;
  },

  moderate: async (
    reviewId: string,
    request: { status: "APPROVED" | "REJECTED"; reason?: string }
  ): Promise<Review> => {
    const response = await api.patch(
      `/api/v1/reviews/admin/${reviewId}/moderate`,
      request
    );
    return response.data;
  },
};

// Coupon Types
export interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startAt: string;
  endAt: string;
  usageLimit: number;
  perUserLimit: number;
  isActive: boolean;
  createdAt: string;
}

export interface ApplyCouponRequest {
  code: string;
}

export interface CouponApplicationResult {
  success: boolean;
  message: string;
  coupon?: Coupon;
  discountAmount: number;
  originalAmount: number;
  finalAmount: number;
}

// Address types
export type AddressDto = {
  id: string;
  name: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  isDefault: boolean;
  createdAt: string;
};

export type CreateAddressRequest = {
  name: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  isDefault?: boolean;
};

export type UpdateAddressRequest = CreateAddressRequest;

// Coupon API
export const couponApi = {
  getActiveCoupons: async (): Promise<Coupon[]> => {
    const response = await api.get("/api/v1/coupons");
    return response.data;
  },

  getCouponByCode: async (code: string): Promise<Coupon> => {
    const response = await api.get(`/api/v1/coupons/${code}`);
    return response.data;
  },

  validateCoupon: async (
    request: ApplyCouponRequest,
    orderAmount: number
  ): Promise<CouponApplicationResult> => {
    const response = await api.post("/api/v1/coupons/validate", request, {
      params: { orderAmount },
    });
    return response.data;
  },
};

// Admin Coupon Types
export interface CreateCouponRequest {
  code: string;
  name: string;
  description?: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  startAt: string;
  endAt: string;
  usageLimit: number;
  perUserLimit: number;
  isActive: boolean;
}

export interface UpdateCouponRequest extends CreateCouponRequest {
  id: string;
}

// Admin Coupon API
export const adminCouponApi = {
  getAllCoupons: async (): Promise<Coupon[]> => {
    const response = await api.get("/api/v1/admin/coupons");
    return response.data;
  },

  getCouponById: async (id: string): Promise<Coupon> => {
    const response = await api.get(`/api/v1/admin/coupons/${id}`);
    return response.data;
  },

  createCoupon: async (request: CreateCouponRequest): Promise<Coupon> => {
    const response = await api.post("/api/v1/admin/coupons", request);
    return response.data;
  },

  updateCoupon: async (
    id: string,
    request: UpdateCouponRequest
  ): Promise<Coupon> => {
    const response = await api.put(`/api/v1/admin/coupons/${id}`, request);
    return response.data;
  },

  deleteCoupon: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/admin/coupons/${id}`);
  },

  toggleCouponStatus: async (
    id: string,
    isActive: boolean
  ): Promise<Coupon> => {
    const requestBody = { isActive };
    console.log("API: Sending toggle request:", { id, requestBody });
    console.log("API: Request body details:", JSON.stringify(requestBody));
    const response = await api.patch(
      `/api/v1/admin/coupons/${id}/status`,
      requestBody
    );
    console.log("API: Toggle response:", response.data);
    return response.data;
  },

  getCouponUsageStats: async (id: string): Promise<any> => {
    const response = await api.get(`/api/v1/admin/coupons/${id}/usage`);
    return response.data;
  },
};

// Enhanced Cart API with Coupon Support
export const cartApiWithCoupons = {
  ...cartApi,

  applyCoupon: async (
    request: ApplyCouponRequest
  ): Promise<CouponApplicationResult> => {
    console.log(
      "API: Sending coupon request to /api/v1/cart/apply-coupon",
      request
    );
    const response = await api.post("/api/v1/cart/apply-coupon", request);
    console.log("API: Coupon response received", response.data);
    return response.data;
  },

  removeCoupon: async (): Promise<void> => {
    await api.delete("/api/v1/cart/apply-coupon");
  },

  getCartWithCoupon: async (couponCode?: string): Promise<Cart> => {
    const response = await api.get("/api/v1/cart/with-coupon", {
      params: couponCode ? { couponCode } : {},
    });
    return response.data;
  },
};

// Checkout types
export type CheckoutSummaryRequest = {
  addressId: string;
  couponCode?: string;
  paymentMethod: string; // e.g., "RAZORPAY"
};

export type CheckoutSummaryResponse = {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  appliedCoupon?: Coupon;
  discount: number;
  grandTotal: number;
};

// Payment Types
export type CreateRazorpayOrderRequest = {
  amount: number;
  currency: string;
  receipt?: string;
  notes?: string;
};

export type CreateRazorpayOrderResponse = {
  id: string;
  entity: string;
  amount: number;
  amountPaid: string;
  amountDue: string;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: string;
  createdAt: number;
};

export type VerifyPaymentRequest = {
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
};

export type VerifyPaymentResponse = {
  verified: boolean;
  message: string;
  orderId: string;
};

// Checkout API
export const checkoutApi = {
  summarize: async (
    body: CheckoutSummaryRequest,
    sessionId?: string
  ): Promise<CheckoutSummaryResponse> => {
    const params = sessionId ? { sessionId } : {};
    const res = await api.post("/api/v1/checkout/summary", body, { params });
    return res.data;
  },
};

// Payment API
export const paymentApi = {
  createRazorpayOrder: async (
    body: CreateRazorpayOrderRequest
  ): Promise<CreateRazorpayOrderResponse> => {
    const res = await api.post("/api/v1/payments/razorpay/order", body);
    return res.data;
  },
  verifyPayment: async (
    body: VerifyPaymentRequest
  ): Promise<VerifyPaymentResponse> => {
    const res = await api.post("/api/v1/payments/razorpay/verify", body);
    return res.data;
  },
};

// Address API
export const addressApi = {
  list: async (): Promise<AddressDto[]> => {
    const res = await api.get("/api/v1/addresses");
    return res.data;
  },
  create: async (payload: CreateAddressRequest): Promise<AddressDto> => {
    const res = await api.post("/api/v1/addresses", payload);
    return res.data;
  },
  update: async (
    id: string,
    payload: UpdateAddressRequest
  ): Promise<AddressDto> => {
    const res = await api.patch(`/api/v1/addresses/${id}`, payload);
    return res.data;
  },
  remove: async (id: string): Promise<void> => {
    await api.delete(`/api/v1/addresses/${id}`);
  },
  makeDefault: async (id: string): Promise<AddressDto> => {
    const res = await api.post(`/api/v1/addresses/${id}/default`);
    return res.data;
  },
};

// Order API types and methods
export interface PlaceOrderRequest {
  addressId: string;
  paymentMethod: string;
  couponCode?: string;
  orderNotes?: string;
  deliveryInstructions?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
}

export interface PlaceOrderResponse {
  orderId: string;
  message: string;
  success: boolean;
  status: string;
  paymentStatus: string;
}

export interface OrderItemDto {
  id: string;
  variantId: string;
  title: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxRate: number;
  taxAmount: number;
  productSnapshot: string;
}

export interface OrderAddressDto {
  id: string;
  type: "BILLING" | "SHIPPING";
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export interface OrderDto {
  id: string;
  userId: string;
  status: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  shippingTotal: number;
  grandTotal: number;
  currency: string;
  paymentStatus: string;
  paymentMethod: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  codFlag: boolean;
  appliedCouponCode: string;
  orderNotes: string;
  deliveryInstructions: string;
  estimatedDeliveryDate: string;
  actualDeliveryDate: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDto[];
  addresses: OrderAddressDto[];
}

export const orderApi = {
  placeOrder: async (
    request: PlaceOrderRequest
  ): Promise<PlaceOrderResponse> => {
    const response = await api.post("/api/v1/orders", request);
    return response.data;
  },
  getUserOrders: async (): Promise<OrderDto[]> => {
    const response = await api.get("/api/v1/orders");
    return response.data;
  },
  getUserOrdersPaginated: async (
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<OrderDto>> => {
    const response = await api.get("/api/v1/orders/paginated", {
      params: { page, size },
    });
    return response.data;
  },
  getOrderById: async (orderId: string): Promise<OrderDto> => {
    const response = await api.get(`/api/v1/orders/${orderId}`);
    return response.data;
  },
};

// Admin Orders API
export const adminOrdersApi = {
  listPaginated: async (
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<OrderDto>> => {
    const response = await api.get("/api/v1/orders/admin/paginated", {
      params: { page, size },
    });
    return response.data;
  },

  getById: async (orderId: string): Promise<OrderDto> => {
    const response = await api.get(`/api/v1/orders/${orderId}`);
    return response.data;
  },

  updateStatus: async (orderId: string, status: string): Promise<OrderDto> => {
    // Placeholder – backend endpoint to be added later
    const response = await api.patch(`/api/v1/orders/admin/${orderId}/status`, {
      status,
    });
    return response.data;
  },
};

// Health check API
export const healthApi = {
  check: async () => {
    const response = await api.get("/actuator/health");
    return response.data;
  },
};

export default api;
