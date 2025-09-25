"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  HiUser,
  HiLogout,
  HiCog,
  HiShoppingCart,
  HiHeart,
  HiStar,
  HiCurrencyRupee,
} from "react-icons/hi";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  userApi,
  authApi,
  getTokens,
  clearTokens,
  User,
  orderApi,
  wishlistApi,
  reviewApi,
} from "@/lib/api";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [kpiLoading, setKpiLoading] = useState(true);
  const [ordersCount, setOrdersCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [totalSpend, setTotalSpend] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const tokens = getTokens();

        if (!tokens.accessToken) {
          router.push("/auth/login");
          return;
        }

        const userData = await userApi.getProfile();
        setUser(userData);
        // Load KPIs after user is confirmed
        try {
          setKpiLoading(true);
          const [ordersPage, wishlist, reviewsPage] = await Promise.all([
            orderApi.getUserOrdersPaginated(0, 1),
            wishlistApi.getWishlist(),
            reviewApi.getUserReviews(0, 1),
          ]);
          setOrdersCount(ordersPage.totalElements || 0);
          setWishlistCount(wishlist.totalItems || 0);
          setReviewsCount(reviewsPage.totalElements || 0);
          // For spend, fetch all orders (shallow) and sum grandTotal
          try {
            const orders = await orderApi.getUserOrders();
            const spend = (orders || []).reduce(
              (sum, o) => sum + Number(o.grandTotal || 0),
              0
            );
            setTotalSpend(spend);
          } catch {}
        } catch (e) {
          // Soft-fail KPIs; not critical
        } finally {
          setKpiLoading(false);
        }
      } catch (error: any) {
        console.error("Failed to fetch user:", error);

        // Check if it's a 403 error (unauthorized)
        if (error.response?.status === 403) {
          clearTokens();
        }

        router.push("/auth/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      toast.success("Logged out successfully");
      router.push("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Header */}
      <header className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-primary">D</span>
              </div>
              <span className="text-xl font-bold font-display text-foreground">
                DeviceHub
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {user.name}
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-foreground-muted hover:text-foreground"
              >
                <HiLogout className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground font-display">
            Welcome back, {user.name}!
          </h1>
          <p className="text-foreground-muted">
            Manage your profile and explore our refurbished devices
          </p>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <KpiMini
            label="Orders"
            value={ordersCount}
            tone="primary"
            icon={<HiShoppingCart className="w-5 h-5" />}
            loading={kpiLoading}
          />
          <KpiMini
            label="Wishlist"
            value={wishlistCount}
            tone="secondary"
            icon={<HiHeart className="w-5 h-5" />}
            loading={kpiLoading}
          />
          <KpiMini
            label="Reviews"
            value={reviewsCount}
            tone="accent"
            icon={<HiStar className="w-5 h-5" />}
            loading={kpiLoading}
          />
          <KpiMini
            label="Total Spend"
            value={totalSpend}
            format="inr"
            tone="warning"
            icon={<HiCurrencyRupee className="w-5 h-5" />}
            loading={kpiLoading}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HiUser className="w-5 h-5 text-primary" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-foreground-muted">Name</p>
                <p className="font-medium">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-foreground-muted">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              {user.phone && (
                <div>
                  <p className="text-sm text-foreground-muted">Phone</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-foreground-muted">Role</p>
                <p className="font-medium capitalize">
                  {user.role.toLowerCase()}
                </p>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                <HiCog className="w-4 h-4" />
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          {/* Placeholder column: we can add addresses, payments, or orders next */}
          <Card>
            <CardHeader>
              <CardTitle>Shortcuts</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="sm">
                Track Order
              </Button>
              <Button variant="outline" size="sm">
                Manage Addresses
              </Button>
              <Button variant="outline" size="sm">
                Payment Methods
              </Button>
              <Button variant="outline" size="sm">
                Support
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <p className="text-foreground-muted">No recent activity</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Browse Devices
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Section */}
        <div className="mt-12">
          <Card>
            <CardContent className="text-center py-12">
              <h2 className="text-2xl font-bold text-foreground mb-4 font-display">
                Device Marketplace Coming Soon!
              </h2>
              <p className="text-foreground-muted mb-6 max-w-2xl mx-auto">
                We're working hard to bring you the best selection of
                refurbished devices. Stay tuned for smartphones, laptops,
                tablets, and more at unbeatable prices.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="bg-background-secondary px-4 py-2 rounded-lg">
                  <span className="text-sm font-medium text-foreground">
                    📱 Smartphones
                  </span>
                </div>
                <div className="bg-background-secondary px-4 py-2 rounded-lg">
                  <span className="text-sm font-medium text-foreground">
                    💻 Laptops
                  </span>
                </div>
                <div className="bg-background-secondary px-4 py-2 rounded-lg">
                  <span className="text-sm font-medium text-foreground">
                    📱 Tablets
                  </span>
                </div>
                <div className="bg-background-secondary px-4 py-2 rounded-lg">
                  <span className="text-sm font-medium text-foreground">
                    🎧 Accessories
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function KpiMini({
  label,
  value,
  icon,
  tone = "primary",
  format,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "primary" | "secondary" | "accent" | "warning";
  format?: "inr";
  loading?: boolean;
}) {
  const toneClass =
    tone === "secondary"
      ? "text-secondary bg-secondary/10"
      : tone === "accent"
      ? "text-accent bg-accent/10"
      : tone === "warning"
      ? "text-warning bg-warning/10"
      : "text-primary bg-primary/10";

  const display =
    format === "inr"
      ? `₹${Number(value || 0).toLocaleString("en-IN")}`
      : String(value || 0);

  return (
    <div className={`p-4 rounded-xl border border-border bg-surface`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-foreground-muted">{label}</p>
          {loading ? (
            <div className="h-6 w-16 bg-background-secondary rounded mt-2" />
          ) : (
            <p className="text-2xl font-bold text-foreground mt-1">{display}</p>
          )}
        </div>
        <div
          className={`h-10 w-10 rounded-lg grid place-items-center ${toneClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
