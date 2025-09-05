import axios from "axios";
import { toast } from "react-hot-toast";

// API Base URL - Use Next.js proxy to avoid CORS issues
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

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

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = getTokens();
        if (tokens.refreshToken) {
          const response = await api.post("/api/v1/auth/refresh", {
            refreshToken: tokens.refreshToken,
          });

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            response.data;
          setTokens(newAccessToken, newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        clearTokens();
        window.location.href = "/auth/login";
        return Promise.reject(refreshError);
      }
    }

    // Show error toast for API errors
    if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else if (error.message) {
      toast.error(error.message);
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
}

export interface SalesChartData {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProductData {
  productId: string;
  title: string;
  totalRevenue: number;
  unitsSold: number;
  averageRating: number;
}

export interface RecentActivityData {
  id: string;
  type: string;
  description: string;
  timestamp: string;
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
  createdAt: string;
  category?: Category;
  brand?: Brand;
  variants?: ProductVariant[];
  images?: Media[];
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

// Health check API
export const healthApi = {
  check: async () => {
    const response = await api.get("/actuator/health");
    return response.data;
  },
};

export default api;
