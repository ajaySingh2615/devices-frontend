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
import { OtpInput } from "@/components/ui/OtpInput";
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
  phone: string;
  otp: string;
}

interface PhoneStepData {
  phone: string;
}

export default function RegisterPage() {
  const [registerMethod, setRegisterMethod] = useState<RegisterMethod>("email");
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [currentPhone, setCurrentPhone] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

  const emailForm = useForm<RegisterFormData>();
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
    if (registerMethod === "google" && isGoogleLoaded) {
      setTimeout(() => renderGoogleButton("google-register-button"), 100);
    }
  }, [registerMethod, isGoogleLoaded, renderGoogleButton]);

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
          <div className="space-y-6">
            {!otpSent ? (
              /* Step 1: Phone Number Input */
              <div className="space-y-4">
                <div className="text-center text-foreground-muted mb-4">
                  <p>Enter your phone number to create an account</p>
                </div>

                <form
                  onSubmit={phoneStepForm.handleSubmit(handlePhoneStart)}
                  className="space-y-4"
                >
                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="8808555545 or +918808555545"
                    {...phoneStepForm.register("phone", {
                      required: "Phone number is required",
                      validate: (value) => {
                        console.log("🔍 Validating phone:", value);

                        // Remove all non-digits except the leading +
                        let cleanNumber = value.replace(/[^\d+]/g, "");

                        // Auto-add +91 if number starts with digits (assume Indian number)
                        if (/^\d{10}$/.test(cleanNumber)) {
                          cleanNumber = "+91" + cleanNumber;
                          console.log("🇮🇳 Auto-added +91:", cleanNumber);
                        }

                        console.log("🧹 Clean number:", cleanNumber);

                        // Check if it matches international format: +[country code][number]
                        const isValid = /^\+[1-9]\d{7,14}$/.test(cleanNumber);
                        console.log("✅ Is valid:", isValid);

                        if (!isValid) {
                          return "Please enter phone with country code (e.g., +918808555545) or just 10 digits for India";
                        }

                        // Update the form value with the clean number
                        if (isValid && cleanNumber !== value) {
                          phoneStepForm.setValue("phone", cleanNumber);
                        }

                        return true;
                      },
                    })}
                    error={phoneStepForm.formState.errors.phone?.message}
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
