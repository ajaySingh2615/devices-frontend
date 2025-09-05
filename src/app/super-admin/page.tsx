"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { HiShieldCheck, HiEye, HiEyeOff } from "react-icons/hi";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function SuperAdminPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    secretKey: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminStatus, setAdminStatus] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const response = await fetch("/api/v1/super-admin/check", {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        setAdminStatus(data);
      } else {
        // Handle XML response as fallback
        const text = await response.text();
        console.log("Received non-JSON response:", text);

        // Parse XML response manually
        const adminExists = text.includes("<adminExists>true</adminExists>");
        setAdminStatus({
          adminExists,
          adminCount: adminExists ? 1 : 0,
          status: adminExists
            ? "Admin users exist. Super admin initialization not available."
            : "No admin users found. Super admin initialization available.",
        });
      }
    } catch (error) {
      console.error("Failed to check admin status:", error);
      // Set default state if check fails
      setAdminStatus({
        adminExists: false,
        adminCount: 0,
        status: "Unable to check admin status. Assuming no admin exists.",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/v1/super-admin/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          secretKey: formData.secretKey,
        }),
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // Handle non-JSON response
        const text = await response.text();
        data = { message: text };
      }

      if (response.ok) {
        toast.success("Super Admin created successfully!");
        setTimeout(() => {
          router.push("/auth/login?message=Super admin created. Please login.");
        }, 2000);
      } else {
        toast.error(data.message || "Failed to create super admin");
      }
    } catch (error) {
      console.error("Super admin creation failed:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // If admin already exists, show message
  if (adminStatus?.adminExists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-secondary px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <HiShieldCheck className="w-16 h-16 text-secondary mx-auto mb-4" />
            <CardTitle>Admin Already Exists</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-foreground-secondary">
              Super admin initialization has already been completed.
            </p>
            <p className="text-sm text-foreground-muted">
              {adminStatus.adminCount} admin user(s) found in the system.
            </p>
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => router.push("/auth/login")}
              >
                Go to Login
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/")}
              >
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-secondary px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <HiShieldCheck className="w-16 h-16 text-primary mx-auto mb-4" />
          <CardTitle>Initialize Super Admin</CardTitle>
          <p className="text-foreground-secondary">
            Create the first admin user for DeviceHub
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Full Name
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
                placeholder="Admin Full Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                required
                placeholder="admin@devicehub.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Phone (Optional)
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  required
                  placeholder="Minimum 8 characters"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <HiEyeOff className="w-5 h-5 text-foreground-muted" />
                  ) : (
                    <HiEye className="w-5 h-5 text-foreground-muted" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  required
                  placeholder="Confirm password"
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <HiEyeOff className="w-5 h-5 text-foreground-muted" />
                  ) : (
                    <HiEye className="w-5 h-5 text-foreground-muted" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Secret Key
              </label>
              <Input
                type="password"
                value={formData.secretKey}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    secretKey: e.target.value,
                  }))
                }
                required
                placeholder="Super admin secret key"
              />
              <p className="text-xs text-foreground-muted mt-1">
                Contact your system administrator for the secret key
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Super Admin..." : "Initialize Super Admin"}
            </Button>

            <div className="text-center space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => router.push("/")}
              >
                Back to Home
              </Button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-accent/10 rounded-lg">
            <h4 className="font-medium text-accent mb-2">
              Security Information:
            </h4>
            <ul className="text-sm text-foreground-secondary space-y-1">
              <li>• This page can only be used once</li>
              <li>• Requires a secret key for additional security</li>
              <li>• Creates the first admin user for the system</li>
              <li>• After creation, use regular login to access admin panel</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
