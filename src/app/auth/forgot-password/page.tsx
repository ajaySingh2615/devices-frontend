"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { HiArrowLeft, HiMail } from "react-icons/hi";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { authApi } from "@/lib/api";

interface ForgotPasswordFormData {
  email: string;
}

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormData>();

  const handleSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(data);
      setEmailSent(true);
      toast.success("Password reset link sent to your email");
    } catch (error) {
      console.error("Forgot password failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-3xl mb-2">
          {emailSent ? "Check your email" : "Forgot password?"}
        </CardTitle>
        <CardDescription className="text-base">
          {emailSent
            ? "We've sent a password reset link to your email address"
            : "Enter your email address and we'll send you a link to reset your password"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {!emailSent ? (
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              {...form.register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Invalid email address",
                },
              })}
              error={form.formState.errors.email?.message}
            />

            <Button type="submit" className="w-full" loading={isLoading}>
              <HiMail className="w-4 h-4" />
              Send reset link
            </Button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
              <HiMail className="w-8 h-8 text-secondary" />
            </div>
            <div className="space-y-2">
              <p className="text-foreground-secondary">
                We've sent a password reset link to:
              </p>
              <p className="font-medium text-foreground">
                {form.getValues("email")}
              </p>
            </div>
            <div className="text-sm text-foreground-muted space-y-1">
              <p>Didn't receive the email? Check your spam folder.</p>
              <button
                onClick={() => setEmailSent(false)}
                className="text-primary hover:text-primary-dark font-medium"
              >
                Try a different email
              </button>
            </div>
          </div>
        )}

        <div className="text-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium"
          >
            <HiArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
