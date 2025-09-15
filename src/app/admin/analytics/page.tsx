"use client";

import { useEffect, useMemo, useState } from "react";
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

// Charts
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { toast } from "react-hot-toast";

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesData, setSalesData] = useState<SalesChartData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductData[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityData[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<30 | 60 | 90>(30);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [statsData, salesChart, topProductsData, activityData] =
        await Promise.all([
          adminApi.getDashboardStats(),
          adminApi.getSalesChart(selectedPeriod),
          adminApi.getTopProducts(10),
          adminApi.getRecentActivity(50),
        ]);

      setStats(statsData);
      setSalesData(salesChart || []);
      setTopProducts(topProductsData || []);
      setRecentActivity(activityData || []);
    } catch (error) {
      console.error("Failed to load analytics data:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  // === helpers ===
  const inr = (n: number | undefined) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Math.max(0, Number(n || 0)));

  const growthChip = (val?: number) => {
    const v = Number(val || 0);
    const Up = (
      <span className="inline-flex items-center text-secondary">
        <HiTrendingUp className="w-4 h-4 mr-1" />
        {v.toFixed(1)}%
      </span>
    );
    const Down = (
      <span className="inline-flex items-center text-error">
        <HiTrendingDown className="w-4 h-4 mr-1" />
        {v.toFixed(1)}%
      </span>
    );
    return v >= 0 ? Up : Down;
  };

  const salesSeries = useMemo(
    () =>
      (salesData || []).map((d) => ({
        ...d,
        label: d.date
          ? new Date(d.date).toLocaleDateString("en-IN", {
              month: "short",
              day: "2-digit",
            })
          : "",
        sales: Number(d.sales || 0),
      })),
    [salesData]
  );

  // === export (CSV + Excel) ===
  const exportCsv = () => {
    try {
      const rows = [
        ["Section", "Field 1", "Field 2", "Field 3", "Field 4", "Field 5"],
        // Stats (flatten selected)
        [
          "Stats",
          "Total Products",
          String(stats?.totalProducts ?? 0),
          "Total Users",
          String(stats?.totalUsers ?? 0),
          "",
        ],
        [
          "Stats",
          "Categories",
          String(stats?.totalCategories ?? 0),
          "Brands",
          String(stats?.totalBrands ?? 0),
          "",
        ],
        [
          "Stats",
          "Product Growth %",
          String(stats?.productGrowth ?? 0),
          "User Growth %",
          String(stats?.userGrowth ?? 0),
          "",
        ],
        [
          "Stats",
          "Category Growth %",
          String(stats?.categoryGrowth ?? 0),
          "Brand Growth %",
          String(stats?.brandGrowth ?? 0),
          "",
        ],
        [
          "Inventory",
          "Total Stock",
          String(stats?.inventory?.totalStock ?? 0),
          "Total Value",
          String(stats?.inventory?.totalValue ?? 0),
          "",
        ],
        [
          "Inventory",
          "In Stock",
          String(stats?.inventory?.inStock ?? 0),
          "Low Stock",
          String(stats?.inventory?.lowStock ?? 0),
          "",
        ],
        [
          "Inventory",
          "Out of Stock",
          String(stats?.inventory?.outOfStock ?? 0),
          "Reserved",
          String(stats?.inventory?.reserved ?? 0),
          "",
        ],
        [],
        [
          "Sales (Last " + selectedPeriod + " days)",
          "Date",
          "Sales (INR)",
          "",
          "",
          "",
        ],
        ...salesSeries.map((s) => [
          "Sales",
          s.label,
          String(s.sales),
          "",
          "",
          "",
        ]),
        [],
        ["Top Products", "Rank", "Title", "Sales", "Revenue (INR)", ""],
        ...topProducts.map((p, i) => [
          "TopProduct",
          String(i + 1),
          p.productTitle ?? (p as any).title ?? "",
          String(p.sales ?? 0),
          String(p.revenue ?? 0),
          "",
        ]),
        [],
        ["Recent Activity", "Action", "Details", "Timestamp", "", ""],
        ...recentActivity.map((a) => [
          "Activity",
          a.action || "",
          a.details || "",
          a.timestamp ? new Date(a.timestamp).toISOString() : "",
          "",
          "",
        ]),
      ];

      const csv = rows
        .map((r) =>
          r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported");
    } catch (e) {
      console.error(e);
      toast.error("Failed to export CSV");
    }
  };

  const exportExcel = async () => {
    try {
      setExporting(true);
      const XLSX = await import("xlsx");

      const wb = XLSX.utils.book_new();

      // Sheet 1: Stats (flattened)
      const statsRows: Record<string, any>[] = [
        { Metric: "Total Products", Value: stats?.totalProducts ?? 0 },
        { Metric: "Total Users", Value: stats?.totalUsers ?? 0 },
        { Metric: "Categories", Value: stats?.totalCategories ?? 0 },
        { Metric: "Brands", Value: stats?.totalBrands ?? 0 },
        { Metric: "Product Growth %", Value: stats?.productGrowth ?? 0 },
        { Metric: "User Growth %", Value: stats?.userGrowth ?? 0 },
        { Metric: "Category Growth %", Value: stats?.categoryGrowth ?? 0 },
        { Metric: "Brand Growth %", Value: stats?.brandGrowth ?? 0 },
        {
          Metric: "Inventory: Total Stock",
          Value: stats?.inventory?.totalStock ?? 0,
        },
        {
          Metric: "Inventory: Total Value (INR)",
          Value: stats?.inventory?.totalValue ?? 0,
        },
        {
          Metric: "Inventory: In Stock",
          Value: stats?.inventory?.inStock ?? 0,
        },
        {
          Metric: "Inventory: Low Stock",
          Value: stats?.inventory?.lowStock ?? 0,
        },
        {
          Metric: "Inventory: Out of Stock",
          Value: stats?.inventory?.outOfStock ?? 0,
        },
        {
          Metric: "Inventory: Reserved",
          Value: stats?.inventory?.reserved ?? 0,
        },
      ];
      const wsStats = XLSX.utils.json_to_sheet(statsRows);
      XLSX.utils.book_append_sheet(wb, wsStats, "Stats");

      // Sheet 2: Sales
      const wsSales = XLSX.utils.json_to_sheet(
        salesSeries.map((s) => ({
          Date: s.label,
          Sales_INR: s.sales,
        }))
      );
      XLSX.utils.book_append_sheet(wb, wsSales, "Sales");

      // Sheet 3: Top Products
      const wsTop = XLSX.utils.json_to_sheet(
        topProducts.map((p, i) => ({
          Rank: i + 1,
          Title: p.productTitle ?? (p as any).title ?? "",
          Sales: p.sales ?? 0,
          Revenue_INR: p.revenue ?? 0,
          ProductId: p.productId ?? "",
        }))
      );
      XLSX.utils.book_append_sheet(wb, wsTop, "Top Products");

      // Sheet 4: Activity
      const wsAct = XLSX.utils.json_to_sheet(
        recentActivity.map((a) => ({
          Action: a.action || "",
          Details: a.details || "",
          Timestamp: a.timestamp ? new Date(a.timestamp).toISOString() : "",
        }))
      );
      XLSX.utils.book_append_sheet(wb, wsAct, "Activity");

      // Simple auto-width
      [wsStats, wsSales, wsTop, wsAct].forEach((ws) => {
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const colCount = Math.max(...rows.map((r) => r.length), 0);
        ws["!cols"] = Array.from({ length: colCount }).map((_, c) => {
          const maxLen = rows.reduce(
            (m, r) => Math.max(m, String(r[c] ?? "").length),
            8
          );
          return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
        });
      });

      XLSX.writeFile(
        wb,
        `analytics_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      toast.success("Excel exported");
    } catch (e) {
      console.error(e);
      toast.error("Failed to export Excel");
    } finally {
      setExporting(false);
    }
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
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">
            Analytics & Reports
          </h1>
          <p className="text-foreground-secondary">
            Detailed insights into your e-commerce performance
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <Button variant="outline" onClick={exportCsv}>
            <HiDownload className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" onClick={exportExcel} disabled={exporting}>
            <HiDownload className="w-4 h-4 mr-2" />
            {exporting ? "Exporting…" : "Excel"}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total Products"
          value={stats.totalProducts}
          growth={stats.productGrowth}
          icon={<HiShoppingCart className="w-8 h-8 text-primary" />}
        />
        <KpiCard
          title="Total Users"
          value={stats.totalUsers}
          growth={stats.userGrowth}
          icon={<HiUsers className="w-8 h-8 text-secondary" />}
        />
        <KpiCard
          title="Categories"
          value={stats.totalCategories}
          growth={stats.categoryGrowth}
          icon={<HiChartBar className="w-8 h-8 text-accent" />}
        />
        <KpiCard
          title="Brands"
          value={stats.totalBrands}
          growth={stats.brandGrowth}
          icon={<HiCurrencyDollar className="w-8 h-8 text-warning" />}
        />
      </div>

      {/* Inventory & Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Overview */}
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
                    {stats.inventory?.totalStock ?? 0}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-foreground-secondary">Value</p>
                  <p className="text-lg font-semibold text-primary">
                    {inr(stats.inventory?.totalValue)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StatPill
                  label="In Stock"
                  value={stats.inventory?.inStock}
                  tone="secondary"
                />
                <StatPill
                  label="Low Stock"
                  value={stats.inventory?.lowStock}
                  tone="warning"
                />
                <StatPill
                  label="Out of Stock"
                  value={stats.inventory?.outOfStock}
                  tone="error"
                />
                <StatPill
                  label="Reserved"
                  value={stats.inventory?.reserved}
                  tone="accent"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend (Last {selectedPeriod} days)</CardTitle>
          </CardHeader>
          <CardContent>
            {salesSeries.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={salesSeries}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorSales"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="var(--color-primary)"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="var(--color-primary)"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="var(--color-border)"
                      strokeDasharray="3 3"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{
                        fill: "var(--color-foreground-muted)",
                        fontSize: 12,
                      }}
                    />
                    <YAxis
                      tickFormatter={(v) =>
                        `₹${Number(v).toLocaleString("en-IN")}`
                      }
                      tick={{
                        fill: "var(--color-foreground-muted)",
                        fontSize: 12,
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                      }}
                      formatter={(v: any) => [
                        `₹${Number(v).toLocaleString("en-IN")}`,
                        "Sales",
                      ]}
                      labelFormatter={(l: any) => `Date: ${l}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="var(--color-primary)"
                      fill="url(#colorSales)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-foreground-secondary">
                No sales data for this period
              </div>
            )}
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
            <div className="space-y-3">
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <div
                    key={product.productId ?? index}
                    className="flex items-center justify-between p-3 bg-background-secondary rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {product.productTitle ??
                            (product as any).title ??
                            "—"}
                        </p>
                        <p className="text-sm text-foreground-secondary">
                          {product.sales ?? 0} sales
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{inr(product.revenue)}</p>
                      <p className="text-sm text-foreground-secondary">
                        revenue
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-foreground-secondary">
                  No product data
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
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.slice(0, 14).map((activity, idx) => (
                  <div key={idx} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-foreground-secondary">
                        {activity.details} •{" "}
                        {activity.timestamp
                          ? new Date(activity.timestamp).toLocaleString("en-IN")
                          : "N/A"}
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
                +
                {Math.max(
                  stats.productGrowth ?? 0,
                  stats.userGrowth ?? 0
                ).toFixed(1)}
                %
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
                  ? Math.round(
                      (stats.inventory?.totalStock ?? 0) / stats.totalProducts
                    )
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

/* === tiny presentational helpers === */
function KpiCard({
  title,
  value,
  growth,
  icon,
}: {
  title: string;
  value?: number;
  growth?: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground-secondary">
              {title}
            </p>
            <p className="text-3xl font-bold text-foreground">{value ?? 0}</p>
            <div className="mt-2">
              {(growth ?? 0) >= 0 ? (
                <span className="inline-flex items-center text-secondary">
                  <HiTrendingUp className="w-4 h-4 mr-1" />
                  {(growth ?? 0).toFixed(1)}%
                </span>
              ) : (
                <span className="inline-flex items-center text-error">
                  <HiTrendingDown className="w-4 h-4 mr-1" />
                  {(growth ?? 0).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value?: number;
  tone: "secondary" | "warning" | "error" | "accent";
}) {
  const toneClass =
    tone === "secondary"
      ? "text-secondary bg-secondary/10"
      : tone === "warning"
      ? "text-warning bg-warning/10"
      : tone === "error"
      ? "text-error bg-error/10"
      : "text-accent bg-accent/10";
  return (
    <div className={`p-4 rounded-lg ${toneClass}`}>
      <p className="text-sm font-medium text-foreground-secondary">{label}</p>
      <p className="text-xl font-bold">{value ?? 0}</p>
    </div>
  );
}
