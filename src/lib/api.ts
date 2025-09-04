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
  console.log(
    "Setting tokens - Access:",
    access ? "Token received" : "No access token"
  );
  console.log(
    "Setting tokens - Refresh:",
    refresh ? "Token received" : "No refresh token"
  );
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem("accessToken", access);
  localStorage.setItem("refreshToken", refresh);
  console.log("Tokens stored in localStorage");
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
  }
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const tokens = getTokens();
    console.log(
      "API Request - Access Token:",
      tokens.accessToken ? "Token exists" : "No token"
    );
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

// Health check API
export const healthApi = {
  check: async () => {
    const response = await api.get("/actuator/health");
    return response.data;
  },
};

export default api;
