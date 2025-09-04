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
import { authApi, setTokens, LoginRequest } from "@/lib/api";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

type LoginMethod = "email" | "google" | "phone";

interface LoginFormData {
  email: string;
  password: string;
}

interface PhoneFormData {
  phone: string;
  otp: string;
}

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("email");
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const router = useRouter();

  const emailForm = useForm<LoginFormData>();
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
    if (loginMethod === "google" && isGoogleLoaded) {
      setTimeout(() => renderGoogleButton("google-signin-button"), 100);
    }
  }, [loginMethod, isGoogleLoaded, renderGoogleButton]);

  const handleEmailLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(data);
      setTokens(response.accessToken, response.refreshToken);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Google sign-in is now handled by the rendered button
    toast("Please use the Google button above", { icon: "ℹ️" });
  };

  const handlePhoneStart = async (data: { phone: string }) => {
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
      toast.success("Welcome!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Phone verification failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-3xl mb-2">Welcome back</CardTitle>
        <CardDescription className="text-base">
          Sign in to your account to continue
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Login Method Selector */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-background-secondary rounded-lg">
          <button
            type="button"
            onClick={() => setLoginMethod("email")}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              loginMethod === "email"
                ? "bg-primary text-white shadow-sm"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            <HiMail className="w-4 h-4" />
            Email
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod("google")}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              loginMethod === "google"
                ? "bg-primary text-white shadow-sm"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            <FcGoogle className="w-4 h-4" />
            Google
          </button>
          <button
            type="button"
            onClick={() => setLoginMethod("phone")}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              loginMethod === "phone"
                ? "bg-primary text-white shadow-sm"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            <HiPhone className="w-4 h-4" />
            Phone
          </button>
        </div>

        {/* Email Login Form */}
        {loginMethod === "email" && (
          <form
            onSubmit={emailForm.handleSubmit(handleEmailLogin)}
            className="space-y-4"
          >
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
              label="Password"
              type="password"
              placeholder="Enter your password"
              {...emailForm.register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
              error={emailForm.formState.errors.password?.message}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded border-border" />
                Remember me
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-primary hover:text-primary-dark"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" loading={isLoading}>
              Sign in with Email
            </Button>
          </form>
        )}

        {/* Google Login */}
        {loginMethod === "google" && (
          <div className="space-y-4">
            <div className="text-center text-foreground-muted">
              <p className="mb-4">Sign in with your Google account</p>
            </div>

            {/* Google-rendered button */}
            <div className="w-full flex justify-center">
              <div id="google-signin-button"></div>
            </div>

            {/* Fallback custom button if Google button doesn't load */}
            {!isGoogleLoaded && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                loading={googleLoading}
              >
                <FcGoogle className="w-5 h-5" />
                Continue with Google
              </Button>
            )}
          </div>
        )}

        {/* Phone Login */}
        {loginMethod === "phone" && (
          <div className="space-y-4">
            {!otpSent ? (
              <form
                onSubmit={phoneForm.handleSubmit(handlePhoneStart)}
                className="space-y-4"
              >
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  {...phoneForm.register("phone", {
                    required: "Phone number is required",
                  })}
                  error={phoneForm.formState.errors.phone?.message}
                />
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
                    Verify OTP
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="text-center">
          <p className="text-foreground-muted">
            Don't have an account?{" "}
            <Link
              href="/auth/register"
              className="text-primary hover:text-primary-dark font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
