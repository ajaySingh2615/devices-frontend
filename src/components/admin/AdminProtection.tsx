"use client";

import { useAdminAuth } from "@/hooks/useAdminAuth";
import { HiShieldExclamation, HiLockClosed } from "react-icons/hi";

interface AdminProtectionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AdminProtection({
  children,
  fallback,
}: AdminProtectionProps) {
  const { user, isAdmin, loading, error } = useAdminAuth();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Verifying Access...
          </h2>
          <p className="text-foreground-secondary">Checking admin privileges</p>
        </div>
      </div>
    );
  }

  // Error state or not admin
  if (error || !isAdmin) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full p-8">
            <div className="text-center">
              <HiShieldExclamation className="h-16 w-16 text-error mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Access Denied
              </h1>
              <p className="text-foreground-secondary mb-6">
                {error === "Not authenticated"
                  ? "You must be logged in to access the admin panel."
                  : "You don't have permission to access the admin panel. Admin privileges required."}
              </p>

              <div className="space-y-3">
                {error === "Not authenticated" ? (
                  <a
                    href="/auth/login?redirect=/admin"
                    className="block w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <HiLockClosed className="inline w-5 h-5 mr-2" />
                    Login to Continue
                  </a>
                ) : (
                  <a
                    href="/"
                    className="block w-full bg-primary text-white py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Return to Home
                  </a>
                )}

                <div className="text-sm text-foreground-muted">
                  <p>Need admin access?</p>
                  <p>Contact your system administrator.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    );
  }

  // User is authenticated and has admin role
  return <>{children}</>;
}
