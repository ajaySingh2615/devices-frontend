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
import { PhoneInput } from "@/components/ui/PhoneInput";
import { OtpInput } from "@/components/ui/OtpInput";
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

interface PhoneStepData {
  phone: string;
}

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("email");
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [currentPhone, setCurrentPhone] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

  const emailForm = useForm<LoginFormData>();
  const phoneStepForm = useForm<PhoneStepData>();

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

  // Countdown timer for resend OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

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

  const handlePhoneStart = async (data: PhoneStepData) => {
    setIsLoading(true);
    try {
      await authApi.phoneStart({ phone: data.phone });
      setCurrentPhone(data.phone);
      setOtpSent(true);
      setCountdown(60); // 60-second cooldown
      toast.success("OTP sent to your phone! Check your messages.");
    } catch (error: any) {
      console.error("Phone OTP failed:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to send OTP";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpComplete = async (otp: string) => {
    if (otp.length !== 6) return;

    setIsLoading(true);
    try {
      const response = await authApi.phoneVerify({
        phone: currentPhone,
        otp: otp,
      });
      setTokens(response.accessToken, response.refreshToken);
      toast.success("Welcome! Login successful.");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Phone verification failed:", error);

      // Handle different error types with user-friendly messages
      let errorMessage = "Invalid OTP. Please try again.";

      if (error.response?.status === 500) {
        errorMessage = "Authentication failed. Please try again.";
      } else if (error.response?.status === 400) {
        errorMessage =
          error.response?.data?.message ||
          "Invalid OTP. Please check your code.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage);
      setOtpValue(""); // Clear OTP on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;

    setIsLoading(true);
    try {
      await authApi.phoneStart({ phone: currentPhone });
      setCountdown(60);
      setOtpValue(""); // Clear current OTP
      toast.success("New OTP sent!");
    } catch (error: any) {
      console.error("Resend OTP failed:", error);
      toast.error("Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setOtpSent(false);
    setOtpValue("");
    setCurrentPhone("");
    setCountdown(0);
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
          <div className="space-y-6">
            {!otpSent ? (
              /* Step 1: Phone Number Input */
              <div className="space-y-4">
                <div className="text-center text-foreground-muted mb-4">
                  <p>Enter your phone number to receive a verification code</p>
                </div>

                <form
                  onSubmit={phoneStepForm.handleSubmit(handlePhoneStart)}
                  className="space-y-4"
                >
                  <PhoneInput
                    label="Phone Number"
                    {...phoneStepForm.register("phone", {
                      required: "Phone number is required",
                      pattern: {
                        value: /^\+[1-9]\d{10,14}$/,
                        message:
                          "Please enter a valid international phone number",
                      },
                    })}
                    error={phoneStepForm.formState.errors.phone?.message}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    loading={isLoading}
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Verification Code"}
                  </Button>
                </form>
              </div>
            ) : (
              /* Step 2: OTP Verification */
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">
                    Verify Your Phone
                  </h3>
                  <p className="text-sm text-foreground-muted">
                    Enter the 6-digit code sent to{" "}
                    <span className="font-medium text-foreground">
                      {currentPhone}
                    </span>
                  </p>
                </div>

                <OtpInput
                  value={otpValue}
                  onChange={setOtpValue}
                  onComplete={handleOtpComplete}
                  disabled={isLoading}
                />

                {/* Resend OTP */}
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-foreground-muted">
                      Resend code in{" "}
                      <span className="font-medium text-primary">
                        {countdown}s
                      </span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      className="text-sm text-primary hover:text-primary-dark disabled:opacity-50"
                    >
                      Resend verification code
                    </button>
                  )}
                </div>

                {/* Back button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleBackToPhone}
                  disabled={isLoading}
                >
                  ← Use different phone number
                </Button>
              </div>
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
