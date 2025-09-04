"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { FcGoogle } from "react-icons/fc";
import { HiPhone, HiMail } from "react-icons/hi";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { authApi, setTokens, RegisterRequest } from "@/lib/api";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

type RegisterMethod = "email" | "google" | "phone";

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

interface PhoneFormData {
  name: string;
  phone: string;
  otp: string;
}

export default function RegisterPage() {
  const [registerMethod, setRegisterMethod] = useState<RegisterMethod>("email");
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const router = useRouter();

  const emailForm = useForm<RegisterFormData>();
  const phoneForm = useForm<PhoneFormData>();

  const {
    renderGoogleButton,
    isLoading: googleLoading,
    isGoogleLoaded,
  } = useGoogleAuth({
    onSuccess: () => router.push("/dashboard"),
    onError: (error) => toast.error(error),
  });

  // Render Google button when method changes to google
  useEffect(() => {
    if (registerMethod === "google" && isGoogleLoaded) {
      setTimeout(() => renderGoogleButton("google-register-button"), 100);
    }
  }, [registerMethod, isGoogleLoaded, renderGoogleButton]);

  const handleEmailRegister = async (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.register({
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
      });
      setTokens(response.accessToken, response.refreshToken);
      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Registration failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    // Google sign-in is now handled by the rendered button
    toast("Please use the Google button above", { icon: "ℹ️" });
  };

  const handlePhoneStart = async (data: { name: string; phone: string }) => {
    setIsLoading(true);
    try {
      await authApi.phoneStart({ phone: data.phone });
      setOtpSent(true);
      toast.success("OTP sent to your phone");
    } catch (error) {
      console.error("Phone OTP failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneVerify = async (data: PhoneFormData) => {
    setIsLoading(true);
    try {
      const response = await authApi.phoneVerify({
        phone: data.phone,
        otp: data.otp,
      });
      setTokens(response.accessToken, response.refreshToken);
      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Phone verification failed:", error);

      // Handle different error types with user-friendly messages
      let errorMessage = "Invalid OTP. Please try again.";

      if (error.response?.status === 500) {
        errorMessage = "Registration failed. Please try again.";
      } else if (error.response?.status === 400) {
        errorMessage =
          error.response?.data?.message ||
          "Invalid OTP. Please check your code.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-3xl mb-2">Create your account</CardTitle>
        <CardDescription className="text-base">
          Join thousands of satisfied customers
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Register Method Selector */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-background-secondary rounded-lg">
          <button
            type="button"
            onClick={() => setRegisterMethod("email")}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              registerMethod === "email"
                ? "bg-primary text-white shadow-sm"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            <HiMail className="w-4 h-4" />
            Email
          </button>
          <button
            type="button"
            onClick={() => setRegisterMethod("google")}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              registerMethod === "google"
                ? "bg-primary text-white shadow-sm"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            <FcGoogle className="w-4 h-4" />
            Google
          </button>
          <button
            type="button"
            onClick={() => setRegisterMethod("phone")}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              registerMethod === "phone"
                ? "bg-primary text-white shadow-sm"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            <HiPhone className="w-4 h-4" />
            Phone
          </button>
        </div>

        {/* Email Registration Form */}
        {registerMethod === "email" && (
          <form
            onSubmit={emailForm.handleSubmit(handleEmailRegister)}
            className="space-y-4"
          >
            <Input
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              {...emailForm.register("name", {
                required: "Name is required",
                minLength: {
                  value: 2,
                  message: "Name must be at least 2 characters",
                },
              })}
              error={emailForm.formState.errors.name?.message}
            />

            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              {...emailForm.register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email address",
                },
              })}
              error={emailForm.formState.errors.email?.message}
            />

            <Input
              label="Phone (Optional)"
              type="tel"
              placeholder="+1 (555) 123-4567"
              {...emailForm.register("phone")}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              {...emailForm.register("password", {
                required: "Password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message:
                    "Password must contain uppercase, lowercase, and number",
                },
              })}
              error={emailForm.formState.errors.password?.message}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              {...emailForm.register("confirmPassword", {
                required: "Please confirm your password",
              })}
              error={emailForm.formState.errors.confirmPassword?.message}
            />

            <div className="text-sm text-foreground-muted">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-border"
                  required
                />
                <span>
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-primary hover:text-primary-dark"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-primary hover:text-primary-dark"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            <Button type="submit" className="w-full" loading={isLoading}>
              Create Account
            </Button>
          </form>
        )}

        {/* Google Registration */}
        {registerMethod === "google" && (
          <div className="space-y-4">
            <div className="text-center text-foreground-muted">
              <p className="mb-4">Create account with your Google account</p>
            </div>

            {/* Google-rendered button */}
            <div className="w-full flex justify-center">
              <div id="google-register-button"></div>
            </div>

            {/* Fallback custom button if Google button doesn't load */}
            {!isGoogleLoaded && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleRegister}
                loading={googleLoading}
              >
                <FcGoogle className="w-5 h-5" />
                Continue with Google
              </Button>
            )}
            <div className="text-sm text-foreground-muted text-center">
              By signing up with Google, you agree to our{" "}
              <Link
                href="/terms"
                className="text-primary hover:text-primary-dark"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-primary hover:text-primary-dark"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        )}

        {/* Phone Registration */}
        {registerMethod === "phone" && (
          <div className="space-y-4">
            {!otpSent ? (
              <form
                onSubmit={phoneForm.handleSubmit(handlePhoneStart)}
                className="space-y-4"
              >
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="Enter your full name"
                  {...phoneForm.register("name", {
                    required: "Name is required",
                    minLength: {
                      value: 2,
                      message: "Name must be at least 2 characters",
                    },
                  })}
                  error={phoneForm.formState.errors.name?.message}
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  {...phoneForm.register("phone", {
                    required: "Phone number is required",
                  })}
                  error={phoneForm.formState.errors.phone?.message}
                />

                <div className="text-sm text-foreground-muted">
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1 rounded border-border"
                      required
                    />
                    <span>
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        className="text-primary hover:text-primary-dark"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="text-primary hover:text-primary-dark"
                      >
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                </div>

                <Button type="submit" className="w-full" loading={isLoading}>
                  Send OTP
                </Button>
              </form>
            ) : (
              <form
                onSubmit={phoneForm.handleSubmit(handlePhoneVerify)}
                className="space-y-4"
              >
                <Input
                  label="Enter OTP"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  {...phoneForm.register("otp", {
                    required: "OTP is required",
                    pattern: {
                      value: /^\d{6}$/,
                      message: "OTP must be 6 digits",
                    },
                  })}
                  error={phoneForm.formState.errors.otp?.message}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setOtpSent(false)}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" loading={isLoading}>
                    Verify & Create Account
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="text-center">
          <p className="text-foreground-muted">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-primary hover:text-primary-dark font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
