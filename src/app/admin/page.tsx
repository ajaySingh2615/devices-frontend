"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import {
  HiTrendingUp,
  HiTrendingDown,
  HiUsers,
  HiViewGrid,
  HiCollection,
  HiTag,
  HiExclamationCircle,
  HiClock,
  HiRefresh,
  HiDownload,
} from "react-icons/hi";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  adminApi,
  DashboardStats,
  SalesChartData,
  TopProductData,
  RecentActivityData,
} from "@/lib/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesData, setSalesData] = useState<SalesChartData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductData[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityData[]>(
    []
  );
  const [lowStockAlerts, setLowStockAlerts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<7 | 14 | 30>(30);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [
        statsData,
        salesChartData,
        topProductsData,
        activityData,
        alertsData,
      ] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getSalesChart(period),
        adminApi.getTopProducts(5),
        adminApi.getRecentActivity(10),
        adminApi.getLowStockAlerts(),
      ]);

      setStats(statsData ?? null);
      setSalesData(Array.isArray(salesChartData) ? salesChartData : []);
      setTopProducts(Array.isArray(topProductsData) ? topProductsData : []);
      setRecentActivity(Array.isArray(activityData) ? activityData : []);
      setLowStockAlerts(Array.isArray(alertsData) ? alertsData : []);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const currency = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n || 0);

  const safeRevenueSeries = useMemo(
    () =>
      (salesData ?? []).map((d) => ({
        date: d.date,
        value: (d as any).revenue ?? (d as any).sales ?? 0,
      })),
    [salesData]
  );

  const maxRevenue = useMemo(
    () => Math.max(1, ...safeRevenueSeries.map((d) => d.value || 0)),
    [safeRevenueSeries]
  );

  const exportSalesCsv = () => {
    try {
      if (!safeRevenueSeries.length) {
        toast("No sales to export");
        return;
      }
      const header = "Date,Revenue\n";
      const rows = safeRevenueSeries
        .map((d) => `${new Date(d.date).toISOString().slice(0, 10)},${d.value}`)
        .join("\n");
      const blob = new Blob([header + rows], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales_last_${period}_days.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to export CSV");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full px-4 sm:px-6 lg:px-8 py-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">
            Dashboard
          </h1>
          <p className="text-foreground-secondary">
            Overview of your e-commerce platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value) as 7 | 14 | 30)}
            className="p-2 border border-border rounded-lg bg-surface"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <button
            onClick={loadDashboardData}
            className="inline-flex items-center px-3 py-2 border rounded-lg text-sm hover:bg-background-secondary"
            title="Refresh"
          >
            <HiRefresh className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Products"
            value={stats.totalProducts ?? 0}
            change={stats.productGrowthPercentage ?? stats.productGrowth ?? 0}
            icon={HiViewGrid}
            color="blue"
          />
          <StatsCard
            title="Total Users"
            value={stats.totalUsers ?? 0}
            change={stats.userGrowthPercentage ?? stats.userGrowth ?? 0}
            icon={HiUsers}
            color="green"
          />
          <StatsCard
            title="Categories"
            value={stats.totalCategories ?? 0}
            icon={HiCollection}
            color="purple"
          />
          <StatsCard
            title="Brands"
            value={stats.totalBrands ?? 0}
            icon={HiTag}
            color="orange"
          />
        </div>
      )}

      {/* Inventory Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-secondary">In Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">
                {Number(stats.inStockItems ?? 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-warning">Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">
                {Number(stats.lowStockItems ?? 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-error">Out of Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-error">
                {Number(stats.outOfStockItems ?? 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Sales Overview (Last {period} Days)</CardTitle>
            <button
              onClick={exportSalesCsv}
              className="inline-flex items-center px-3 py-1.5 text-sm border rounded-md hover:bg-background-secondary"
            >
              <HiDownload className="w-4 h-4 mr-1" /> CSV
            </button>
          </CardHeader>
          <CardContent>
            {safeRevenueSeries.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm text-foreground-secondary">
                  Revenue trend for the selected period
                </div>
                <div className="h-64 flex items-end justify-between gap-1">
                  {safeRevenueSeries
                    .slice(-Math.min(14, safeRevenueSeries.length))
                    .map((day, i) => {
                      const heightPx = Math.round(
                        (day.value / maxRevenue) * 200
                      ); // 0–200px
                      return (
                        <div
                          key={day.date ?? i}
                          className="flex-1 flex flex-col items-center group"
                        >
                          <div
                            className="w-full bg-primary rounded-t transition-all duration-200 group-hover:opacity-80"
                            style={{ height: `${heightPx}px` }}
                            title={`${new Date(
                              day.date
                            ).toLocaleDateString()} • ${currency(day.value)}`}
                          />
                          <div className="text-[10px] text-foreground-muted mt-2">
                            {new Date(day.date).getDate()}
                          </div>
                        </div>
                      );
                    })}
                </div>
                <div className="flex items-center justify-between text-xs text-foreground-secondary">
                  <span>Total</span>
                  <span className="font-medium">
                    {currency(
                      safeRevenueSeries.reduce(
                        (acc, d) => acc + (d.value || 0),
                        0
                      )
                    )}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center text-foreground-secondary py-8">
                No sales data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts && topProducts.length > 0 ? (
                [...topProducts]
                  .sort((a: any, b: any) => {
                    const ra = a.totalRevenue ?? a.revenue ?? 0;
                    const rb = b.totalRevenue ?? b.revenue ?? 0;
                    return rb - ra;
                  })
                  .map((product: any, index) => {
                    const title = product.productTitle ?? product.title ?? "—";
                    const units = product.unitsSold ?? product.sales ?? 0;
                    const revenue =
                      product.totalRevenue ?? product.revenue ?? 0;
                    return (
                      <div
                        key={product.productId ?? product.id ?? index}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium">{title}</div>
                          <div className="text-sm text-foreground-secondary">
                            {Number(units).toLocaleString()} units sold
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary">
                            {currency(revenue)}
                          </div>
                          <div className="text-sm text-foreground-secondary">
                            #{index + 1}
                          </div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center text-foreground-secondary py-4">
                  No product data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HiClock className="w-5 h-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((activity: any, index) => {
                  const desc =
                    activity.description ??
                    [activity.action, activity.details]
                      .filter(Boolean)
                      .join(" — ") ??
                    "—";
                  const ts = activity.timestamp;
                  return (
                    <div
                      key={activity.id ?? index}
                      className="flex items-start space-x-3"
                    >
                      <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                      <div className="flex-1">
                        <div className="text-sm">{desc}</div>
                        <div className="text-xs text-foreground-muted">
                          {ts ? new Date(ts).toLocaleString() : "N/A"}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-foreground-secondary py-4">
                  No recent activity
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-warning">
              <HiExclamationCircle className="w-5 h-5 mr-2" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockAlerts && lowStockAlerts.length > 0 ? (
                lowStockAlerts.map((alert, index) => (
                  <div
                    key={index}
                    className="p-3 bg-warning/10 rounded-lg border border-warning/20"
                  >
                    <div className="text-sm text-warning">{alert}</div>
                  </div>
                ))
              ) : (
                <div className="text-center text-foreground-secondary py-4">
                  No low stock alerts
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: "blue" | "green" | "purple" | "orange";
}

function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  color,
}: StatsCardProps) {
  const colorClasses = {
    blue: "text-primary",
    green: "text-secondary",
    purple: "text-purple-600",
    orange: "text-orange-600",
  } as const;

  const hasChange = typeof change === "number" && !Number.isNaN(change);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground-secondary">
              {title}
            </p>
            <p className="text-3xl font-bold text-foreground">
              {Number(value || 0).toLocaleString()}
            </p>
            {hasChange && (
              <div
                className={`flex items-center mt-2 text-sm ${
                  (change as number) >= 0 ? "text-secondary" : "text-error"
                }`}
              >
                {(change as number) >= 0 ? (
                  <HiTrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <HiTrendingDown className="w-4 h-4 mr-1" />
                )}
                {Math.abs(change as number).toFixed(1)}%
              </div>
            )}
          </div>
          <Icon className={`w-8 h-8 ${colorClasses[color]}`} />
        </div>
      </CardContent>
    </Card>
  );
}
