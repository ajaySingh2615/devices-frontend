"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [
        statsData,
        salesChartData,
        topProductsData,
        activityData,
        alertsData,
      ] = await Promise.all([
        adminApi.getDashboardStats(),
        adminApi.getSalesChart(30),
        adminApi.getTopProducts(5),
        adminApi.getRecentActivity(10),
        adminApi.getLowStockAlerts(),
      ]);

      setStats(statsData);
      setSalesData(salesChartData);
      setTopProducts(topProductsData);
      setRecentActivity(activityData);
      setLowStockAlerts(alertsData);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display text-foreground">
          Dashboard
        </h1>
        <p className="text-foreground-secondary">
          Overview of your e-commerce platform
        </p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Products"
            value={stats.totalProducts}
            change={stats.productGrowthPercentage}
            icon={HiViewGrid}
            color="blue"
          />
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            change={stats.userGrowthPercentage}
            icon={HiUsers}
            color="green"
          />
          <StatsCard
            title="Categories"
            value={stats.totalCategories}
            icon={HiCollection}
            color="purple"
          />
          <StatsCard
            title="Brands"
            value={stats.totalBrands}
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
                {stats.inStockItems}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-warning">Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">
                {stats.lowStockItems}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-error">Out of Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-error">
                {stats.outOfStockItems}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Overview (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {salesData.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm text-foreground-secondary">
                  Revenue trend over the last 30 days
                </div>
                <div className="h-64 flex items-end justify-between space-x-1">
                  {salesData.slice(-7).map((day, index) => (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center"
                    >
                      <div
                        className="w-full bg-primary rounded-t"
                        style={{
                          height: `${
                            (day.revenue /
                              Math.max(...salesData.map((d) => d.revenue))) *
                            200
                          }px`,
                        }}
                      />
                      <div className="text-xs text-foreground-muted mt-2">
                        {new Date(day.date).getDate()}
                      </div>
                    </div>
                  ))}
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
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <div
                    key={product.productId}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{product.title}</div>
                      <div className="text-sm text-foreground-secondary">
                        {product.unitsSold} units sold
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">
                        ₹{product.totalRevenue.toLocaleString()}
                      </div>
                      <div className="text-sm text-foreground-secondary">
                        #{index + 1}
                      </div>
                    </div>
                  </div>
                ))
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
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                    <div className="flex-1">
                      <div className="text-sm">{activity.description}</div>
                      <div className="text-xs text-foreground-muted">
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
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
              {lowStockAlerts.length > 0 ? (
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
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground-secondary">
              {title}
            </p>
            <p className="text-3xl font-bold text-foreground">
              {value.toLocaleString()}
            </p>
            {change !== undefined && (
              <div
                className={`flex items-center mt-2 text-sm ${
                  change >= 0 ? "text-secondary" : "text-error"
                }`}
              >
                {change >= 0 ? (
                  <HiTrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <HiTrendingDown className="w-4 h-4 mr-1" />
                )}
                {Math.abs(change).toFixed(1)}%
              </div>
            )}
          </div>
          <Icon className={`w-8 h-8 ${colorClasses[color]}`} />
        </div>
      </CardContent>
    </Card>
  );
}
