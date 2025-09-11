"use client";

import { useEffect, useMemo, useState } from "react";
import { adminOrdersApi, OrderDto, PageResponse } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  HiSearch,
  HiRefresh,
  HiDownload,
  HiTrendingUp,
  HiClock,
  HiCash,
  HiCheckCircle,
} from "react-icons/hi";

const STATUS_TABS = [
  "ALL",
  "CREATED",
  "PAID",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "RETURNED",
];

// ——— Helpers
const currency = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const statusTone = (status?: string) => {
  const s = (status || "").toUpperCase();
  if (["COMPLETED", "DELIVERED"].includes(s)) return "success";
  if (["PAID", "PACKED", "SHIPPED"].includes(s)) return "info";
  if (["CREATED"].includes(s)) return "warning";
  if (["CANCELLED", "RETURNED"].includes(s)) return "error";
  return "muted";
};

const badgeClass = (
  tone: "success" | "info" | "warning" | "error" | "muted"
) => {
  const map: Record<string, string> = {
    success: "bg-success/10 text-success border-success/20",
    info: "bg-info/10 text-info border-info/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    error: "bg-error/10 text-error border-error/20",
    muted: "bg-background-tertiary text-foreground-secondary border-border",
  };
  return `border ${map[tone]}`;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [query, setQuery] = useState<string>("");
  const [status, setStatus] = useState<string>("ALL");

  const load = async (reset = false) => {
    try {
      setLoading(true);
      const res: PageResponse<OrderDto> = await adminOrdersApi.listPaginated(
        0,
        20
      );
      setOrders(res.content);
      setPage(0);
      setHasMore(!res.last);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const mStatus = status === "ALL" || o.status === status;
      const mQuery =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.items?.some((it) => it.title?.toLowerCase().includes(q));
      return mStatus && mQuery;
    });
  }, [orders, query, status]);

  const summary = useMemo(() => {
    const todayStr = new Date().toDateString();
    const total = filtered.length;
    const paidOrders = filtered.filter(
      (o) => (o.paymentStatus || "").toUpperCase() === "PAID"
    );
    const revenue = paidOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    const aov = paidOrders.length ? Math.round(revenue / paidOrders.length) : 0;
    const pending = filtered.filter((o) =>
      ["CREATED", "PAID", "PACKED", "SHIPPED"].includes(
        (o.status || "").toUpperCase()
      )
    ).length;
    const today = filtered.filter(
      (o) => new Date(o.createdAt).toDateString() === todayStr
    ).length;
    return { total, revenue, aov, pending, today };
  }, [filtered]);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const next = page + 1;
      const res: PageResponse<OrderDto> = await adminOrdersApi.listPaginated(
        next,
        20
      );
      setOrders((prev) => [...prev, ...res.content]);
      setPage(next);
      setHasMore(!res.last);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load more");
    } finally {
      setLoading(false);
    }
  };

  const ExportButton = () => (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      disabled={!filtered.length}
    >
      <HiDownload className="h-4 w-4" />
      Export CSV
    </Button>
  );

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Orders
          </h1>
          <p className="text-sm text-foreground-muted">
            Track, filter, and manage all orders in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => load(true)}
            disabled={loading}
          >
            <HiRefresh className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <ExportButton />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<HiTrendingUp className="h-5 w-5 text-info" />}
          label="Total Orders"
          value={summary.total}
          hint={`${summary.today} today`}
        />
        <KpiCard
          icon={<HiCash className="h-5 w-5 text-success" />}
          label="Revenue (paid)"
          value={currency(summary.revenue)}
          hint={`${summary.aov ? `AOV ${currency(summary.aov)}` : "—"}`}
        />
        <KpiCard
          icon={<HiClock className="h-5 w-5 text-warning" />}
          label="In Progress"
          value={summary.pending}
          hint="Created / Paid / Packed / Shipped"
        />
        <KpiCard
          icon={<HiCheckCircle className="h-5 w-5 text-success" />}
          label="Completed"
          value={
            filtered.filter((o) =>
              ["DELIVERED", "COMPLETED"].includes(
                (o.status || "").toUpperCase()
              )
            ).length
          }
          hint="Delivered / Completed"
        />
      </div>

      <Card className="shadow-sm border-border">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col gap-4">
            {/* Top controls */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-lg">All Orders</CardTitle>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-72">
                  <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-light" />
                  <Input
                    className="pl-9"
                    placeholder="Search by Order ID or product title…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Segmented status filter */}
            <div className="w-full overflow-x-auto">
              <div
                role="tablist"
                aria-label="Order status"
                className="inline-flex gap-1 rounded-xl bg-background-tertiary p-1"
              >
                {STATUS_TABS.map((s) => {
                  const active = status === s;
                  return (
                    <button
                      key={s}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setStatus(s)}
                      className={[
                        "px-3 py-1.5 rounded-lg text-sm transition-colors whitespace-nowrap",
                        active
                          ? "bg-surface text-foreground shadow-sm ring-1 ring-border"
                          : "text-foreground-secondary hover:text-foreground",
                      ].join(" ")}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Loading skeleton */}
          {loading && !orders.length ? (
            <SkeletonTable />
          ) : filtered.length === 0 ? (
            <EmptyState query={query} status={status} />
          ) : (
            <div className="overflow-hidden rounded-b-md">
              <div className="overflow-x-auto max-w-full">
                <table className="min-w-[1100px] w-full text-[13px] leading-5">
                  <thead className="bg-surface sticky top-0 z-10 border-b border-border">
                    <tr className="text-left">
                      {[
                        "Order ID",
                        "Customer",
                        "Date / Time",
                        "Products & Qty",
                        "Total",
                        "Payment",
                        "Pay Status",
                        "Order Status",
                        "Ship (City • PIN)",
                        "ETA",
                        "Actions",
                      ].map((h, i) => (
                        <th
                          key={h}
                          className={[
                            "py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-foreground-light",
                            i === 0 ? "min-w-[160px]" : "",
                            i === 3 ? "min-w-[280px]" : "",
                          ].join(" ")}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    {filtered.map((o) => {
                      const topItems = (o.items || [])
                        .slice(0, 2)
                        .map((it) => `${it.title} ×${it.quantity}`)
                        .join(", ");
                      const moreCount = Math.max((o.items?.length || 0) - 2, 0);
                      const addr =
                        (o.addresses || []).find(
                          (a) => a.type === "SHIPPING"
                        ) || (o.addresses || [])[0];
                      const cityPin = addr
                        ? `${addr.city} • ${addr.pincode}`
                        : "—";
                      const etaStr = o.estimatedDeliveryDate
                        ? new Date(o.estimatedDeliveryDate).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                            }
                          )
                        : "—";
                      const overdue =
                        !!o.estimatedDeliveryDate &&
                        new Date(o.estimatedDeliveryDate) < new Date() &&
                        !["DELIVERED", "COMPLETED"].includes(
                          (o.status || "").toUpperCase()
                        );

                      const payKey = (o.paymentStatus || "").toUpperCase();
                      const payTone =
                        (
                          {
                            PAID: "success",
                            PENDING: "warning",
                            FAILED: "error",
                            REFUNDED: "info",
                          } as Record<
                            string,
                            "success" | "warning" | "error" | "info"
                          >
                        )[payKey] ?? "muted";

                      return (
                        <tr
                          key={o.id}
                          className="align-top hover:bg-background-secondary/70"
                        >
                          {/* Order ID */}
                          <td className="py-3 px-4 max-w-[420px] truncate">
                            <div className="font-medium truncate">
                              <Link
                                href={`/admin/orders/${o.id}`}
                                className="underline underline-offset-2 decoration-border hover:decoration-foreground"
                                title={o.id}
                              >
                                {o.id.slice(0, 8)}
                              </Link>
                            </div>
                            <div className="text-[11px] text-foreground-light">
                              #{o.id}
                            </div>
                          </td>

                          {/* Customer */}
                          <td className="py-3 px-4">
                            <div className="truncate">{o.userId || "N/A"}</div>
                            <div className="text-[11px] text-foreground-light">
                              —
                            </div>
                          </td>

                          {/* Date / Time */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div>
                              {new Date(o.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </div>
                            <div className="text-[11px] text-foreground-light">
                              {new Date(o.createdAt).toLocaleTimeString(
                                "en-IN",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </div>
                          </td>

                          {/* Products */}
                          <td className="py-3 px-4">
                            <div className="truncate" title={topItems}>
                              {topItems || "—"}
                              {moreCount > 0 ? ` +${moreCount} more` : ""}
                            </div>
                          </td>

                          {/* Total */}
                          <td className="py-3 px-4 font-semibold whitespace-nowrap">
                            {currency(o.grandTotal)}
                          </td>

                          {/* Payment Method */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {o.paymentMethod ? (
                              <span className="inline-flex items-center rounded-full bg-background-tertiary px-2 py-0.5 text-[12px] text-foreground-secondary border border-border">
                                {o.paymentMethod}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>

                          {/* Pay Status */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Badge className={badgeClass(payTone)}>
                              {o.paymentStatus || "—"}
                            </Badge>
                          </td>

                          {/* Order Status */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Badge className={badgeClass(statusTone(o.status))}>
                              {o.status || "—"}
                            </Badge>
                          </td>

                          {/* Shipping */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {cityPin}
                          </td>

                          {/* ETA */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={
                                overdue ? "text-error font-medium" : ""
                              }
                            >
                              {etaStr}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4">
                            <div className="flex justify-end gap-2">
                              <Link href={`/admin/orders/${o.id}`}>
                                <Button size="sm">View</Button>
                              </Link>
                              <Button variant="outline" size="sm" disabled>
                                Edit
                              </Button>
                              <Button variant="outline" size="sm" disabled>
                                Status
                              </Button>
                              <Button variant="outline" size="sm" disabled>
                                Refund
                              </Button>
                              <Button variant="outline" size="sm" disabled>
                                Invoice
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {hasMore && (
                <div className="p-3 border-t border-border bg-surface flex justify-center">
                  <Button
                    onClick={loadMore}
                    disabled={loading}
                    variant="outline"
                  >
                    {loading ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ——— Small presentational components

function KpiCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <Card className="bg-surface border-border shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[12px] uppercase tracking-wider text-foreground-light">
              {label}
            </div>
            <div className="mt-1 text-xl font-bold text-foreground">
              {value}
            </div>
            {hint ? (
              <div className="mt-1 text-[12px] text-foreground-muted">
                {hint}
              </div>
            ) : null}
          </div>
          <div className="rounded-xl bg-background-tertiary p-2 border border-border">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ query, status }: { query: string; status: string }) {
  return (
    <div className="py-16 px-6 text-center space-y-2">
      <div className="mx-auto w-12 h-12 rounded-full bg-background-tertiary border border-border flex items-center justify-center">
        <HiSearch className="h-6 w-6 text-foreground-light" />
      </div>
      <h3 className="text-base font-semibold">No orders found</h3>
      <p className="text-sm text-foreground-muted">
        {query
          ? `No results for “${query}” in ${
              status === "ALL" ? "all statuses" : status
            }.`
          : `Try changing filters or loading more.`}
      </p>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="p-4">
      <div className="h-4 w-40 bg-background-tertiary rounded animate-pulse" />
      <div className="mt-4 border border-border rounded-md overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-11 gap-2 px-4 py-3 border-b border-border bg-background animate-pulse"
          >
            {[...Array(11)].map((__, j) => (
              <div
                key={j}
                className="h-3 rounded bg-background-tertiary"
                style={{
                  width: [120, 120, 90, 220, 70, 70, 80, 90, 120, 60, 100][j],
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
