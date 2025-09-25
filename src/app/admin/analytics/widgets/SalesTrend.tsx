"use client";

import dynamic from "next/dynamic";
import React from "react";

// Lazy load recharts only inside this widget
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false }
);
const AreaChart = dynamic(() => import("recharts").then((m) => m.AreaChart), {
  ssr: false,
});
const Area = dynamic(() => import("recharts").then((m) => m.Area), {
  ssr: false,
});
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), {
  ssr: false,
});
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), {
  ssr: false,
});
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), {
  ssr: false,
});
const CartesianGrid = dynamic(
  () => import("recharts").then((m) => m.CartesianGrid),
  { ssr: false }
);

export interface SalesPoint {
  label: string;
  sales: number;
}

export function SalesTrend({ data }: { data: SalesPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-foreground-secondary">
        No sales data for this period
      </div>
    );
  }

  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
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
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--color-foreground-muted)", fontSize: 12 }}
          />
          <YAxis
            tickFormatter={(v: any) => `₹${Number(v).toLocaleString("en-IN")}`}
            tick={{ fill: "var(--color-foreground-muted)", fontSize: 12 }}
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
  );
}
