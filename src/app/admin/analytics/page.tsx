"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  HiChartBar,
  HiTrendingUp,
  HiTrendingDown,
  HiUsers,
  HiShoppingCart,
  HiCurrencyDollar,
  HiCalendar,
  HiDownload,
} from "react-icons/hi";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  adminApi,
  DashboardStats,
  SalesChartData,
  TopProductData,
  RecentActivityData,
} from "@/lib/api";

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesData, setSalesData] = useState<SalesChartData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductData[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityData[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<30 | 60 | 90>(30);

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      const [statsData, salesChart, topProductsData, activityData] =
        await Promise.all([
          adminApi.getDashboardStats(),
          adminApi.getSalesChart(selectedPeriod),
          adminApi.getTopProducts(10),
          adminApi.getRecentActivity(20),
        ]);

      setStats(statsData);
      setSalesData(salesChart);
      setTopProducts(topProductsData);
      setRecentActivity(activityData);
    } catch (error) {
      console.error("Failed to load analytics data:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    toast("Export functionality will be implemented soon");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-foreground-secondary">
          Unable to load analytics data
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">
            Analytics & Reports
          </h1>
          <p className="text-foreground-secondary">
            Detailed insights into your e-commerce performance
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) =>
              setSelectedPeriod(Number(e.target.value) as 30 | 60 | 90)
            }
            className="p-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface"
          >
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <Button onClick={exportData} variant="outline">
            <HiDownload className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">
                  Total Products
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.totalProducts}
                </p>
                <div className="flex items-center mt-2">
                  {stats.productGrowth >= 0 ? (
                    <HiTrendingUp className="w-4 h-4 text-secondary mr-1" />
                  ) : (
                    <HiTrendingDown className="w-4 h-4 text-error mr-1" />
                  )}
                  <span
                    className={`text-sm ${
                      stats.productGrowth >= 0 ? "text-secondary" : "text-error"
                    }`}
                  >
                    {stats.productGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
              <HiShoppingCart className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">
                  Total Users
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.totalUsers}
                </p>
                <div className="flex items-center mt-2">
                  {stats.userGrowth >= 0 ? (
                    <HiTrendingUp className="w-4 h-4 text-secondary mr-1" />
                  ) : (
                    <HiTrendingDown className="w-4 h-4 text-error mr-1" />
                  )}
                  <span
                    className={`text-sm ${
                      stats.userGrowth >= 0 ? "text-secondary" : "text-error"
                    }`}
                  >
                    {stats.userGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
              <HiUsers className="w-8 h-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">
                  Categories
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.totalCategories}
                </p>
                <div className="flex items-center mt-2">
                  {stats.categoryGrowth >= 0 ? (
                    <HiTrendingUp className="w-4 h-4 text-secondary mr-1" />
                  ) : (
                    <HiTrendingDown className="w-4 h-4 text-error mr-1" />
                  )}
                  <span
                    className={`text-sm ${
                      stats.categoryGrowth >= 0
                        ? "text-secondary"
                        : "text-error"
                    }`}
                  >
                    {stats.categoryGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
              <HiChartBar className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground-secondary">
                  Brands
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {stats.totalBrands}
                </p>
                <div className="flex items-center mt-2">
                  {stats.brandGrowth >= 0 ? (
                    <HiTrendingUp className="w-4 h-4 text-secondary mr-1" />
                  ) : (
                    <HiTrendingDown className="w-4 h-4 text-error mr-1" />
                  )}
                  <span
                    className={`text-sm ${
                      stats.brandGrowth >= 0 ? "text-secondary" : "text-error"
                    }`}
                  >
                    {stats.brandGrowth.toFixed(1)}%
                  </span>
                </div>
              </div>
              <HiCurrencyDollar className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background-secondary rounded-lg">
                <div>
                  <p className="text-sm font-medium text-foreground-secondary">
                    Total Stock
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.inventory.totalStock}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-foreground-secondary">Value</p>
                  <p className="text-lg font-semibold text-primary">
                    ₹{stats.inventory.totalValue.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-secondary/10 rounded-lg">
                  <p className="text-sm font-medium text-foreground-secondary">
                    In Stock
                  </p>
                  <p className="text-xl font-bold text-secondary">
                    {stats.inventory.inStock}
                  </p>
                </div>
                <div className="p-4 bg-warning/10 rounded-lg">
                  <p className="text-sm font-medium text-foreground-secondary">
                    Low Stock
                  </p>
                  <p className="text-xl font-bold text-warning">
                    {stats.inventory.lowStock}
                  </p>
                </div>
                <div className="p-4 bg-error/10 rounded-lg">
                  <p className="text-sm font-medium text-foreground-secondary">
                    Out of Stock
                  </p>
                  <p className="text-xl font-bold text-error">
                    {stats.inventory.outOfStock}
                  </p>
                </div>
                <div className="p-4 bg-accent/10 rounded-lg">
                  <p className="text-sm font-medium text-foreground-secondary">
                    Reserved
                  </p>
                  <p className="text-xl font-bold text-accent">
                    {stats.inventory.reserved}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales Trend (Last {selectedPeriod} days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salesData.length > 0 ? (
                <div className="space-y-2">
                  {salesData.slice(0, 7).map((data, index) => (
                    <div
                      key={data.date}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-foreground-secondary">
                        {new Date(data.date).toLocaleDateString()}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-background-secondary rounded-full h-2">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{
                              width: `${Math.min(
                                (data.sales /
                                  Math.max(...salesData.map((d) => d.sales))) *
                                  100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          ₹{data.sales.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-foreground-secondary">
                  No sales data available for the selected period
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    className="flex items-center justify-between p-3 bg-background-secondary rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{product.productTitle}</p>
                        <p className="text-sm text-foreground-secondary">
                          {product.sales} sales
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        ₹{product.revenue.toLocaleString()}
                      </p>
                      <p className="text-sm text-foreground-secondary">
                        revenue
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-foreground-secondary">
                  No product data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.slice(0, 8).map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-foreground-secondary">
                        {activity.details} •{" "}
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-foreground-secondary">
                  No recent activity
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <HiTrendingUp className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="font-semibold mb-2">Growth Rate</h3>
              <p className="text-2xl font-bold text-secondary">
                +{Math.max(stats.productGrowth, stats.userGrowth).toFixed(1)}%
              </p>
              <p className="text-sm text-foreground-secondary">
                Best performing metric
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <HiShoppingCart className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Avg. Stock per Product</h3>
              <p className="text-2xl font-bold text-primary">
                {stats.totalProducts > 0
                  ? Math.round(stats.inventory.totalStock / stats.totalProducts)
                  : 0}
              </p>
              <p className="text-sm text-foreground-secondary">
                Units per product
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <HiCalendar className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-semibold mb-2">Platform Age</h3>
              <p className="text-2xl font-bold text-accent">
                {Math.floor(
                  (Date.now() - new Date("2024-01-01").getTime()) /
                    (1000 * 60 * 60 * 24)
                )}
              </p>
              <p className="text-sm text-foreground-secondary">
                Days since launch
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
