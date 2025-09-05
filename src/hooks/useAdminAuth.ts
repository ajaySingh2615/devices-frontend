"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { userApi, User } from "@/lib/api";
import { toast } from "react-hot-toast";

interface AdminAuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

export function useAdminAuth() {
  const [state, setState] = useState<AdminAuthState>({
    user: null,
    isAdmin: false,
    loading: true,
    error: null,
  });
  const router = useRouter();

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Check if user is logged in
      const user = await userApi.getProfile();

      if (!user) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Not authenticated",
        }));
        router.push("/auth/login?redirect=/admin");
        return;
      }

      // Check if user has admin role
      const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

      if (!isAdmin) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Insufficient privileges",
        }));
        toast.error("Access denied. Admin privileges required.");
        router.push("/"); // Redirect to home page
        return;
      }

      setState({
        user,
        isAdmin: true,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Admin auth check failed:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Authentication failed",
      }));
      toast.error("Authentication failed. Please login again.");
      router.push("/auth/login?redirect=/admin");
    }
  };

  return {
    ...state,
    refetch: checkAdminAuth,
  };
}
