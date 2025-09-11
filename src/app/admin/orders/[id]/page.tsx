"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { adminOrdersApi, OrderDto } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  HiArrowLeft,
  HiClipboardCopy,
  HiClipboardCheck,
  HiCalendar,
  HiCreditCard,
  HiLocationMarker,
  HiTruck,
} from "react-icons/hi";

const STATUS_OPTIONS = [
  "CREATED",
  "PAID",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "RETURNED",
] as const;

type Tone = "success" | "info" | "warning" | "error" | "muted";

const statusTone = (status?: string): Tone => {
  const s = (status || "").toUpperCase();
  if (["COMPLETED", "DELIVERED"].includes(s)) return "success";
  if (["PAID", "PACKED", "SHIPPED"].includes(s)) return "info";
  if (["CREATED"].includes(s)) return "warning";
  if (["CANCELLED", "RETURNED"].includes(s)) return "error";
  return "muted";
};

const badgeClass = (tone: Tone) => {
  const map: Record<Tone, string> = {
    success: "bg-success/10 text-success border-success/20",
    info: "bg-info/10 text-info border-info/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    error: "bg-error/10 text-error border-error/20",
    muted: "bg-background-tertiary text-foreground-secondary border-border",
  };
  return `border ${map[tone]}`;
};

const currency = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Array.isArray(params?.id)
    ? params.id[0]
    : (params?.id as string);

  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<string>("PAID");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    const load = async () => {
      setLoading(true);
      try {
        const o = await adminOrdersApi.getById(orderId);
        setOrder(o);
        setNewStatus(o.status);
      } catch (e: any) {
        toast.error(e?.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orderId]);

  const handleCopy = async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
      toast.success("Order ID copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const updateStatus = async () => {
    if (!order) return;
    setUpdating(true);
    try {
      const updated = await adminOrdersApi.updateStatus(order.id, newStatus);
      setOrder(updated);
      toast.success("Status updated");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  // Helpful deriveds
  const shippingAddr =
    order?.addresses?.find((a: any) => a.type === "SHIPPING") ??
    order?.addresses?.[0];
  const billingAddr =
    order?.addresses?.find((a: any) => a.type === "BILLING") ?? null;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-5 min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/orders")}
          >
            <HiArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Order Detail
          </h1>
        </div>
        {order ? (
          <div className="flex items-center gap-2">
            <Badge className={badgeClass(statusTone(order.status))}>
              {order.status}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <HiClipboardCheck className="h-4 w-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <HiClipboardCopy className="h-4 w-4 mr-2" />
                  Copy ID
                </>
              )}
            </Button>
          </div>
        ) : null}
      </div>

      {/* Loading / Not found */}
      {loading ? (
        <Card className="shadow-sm">
          <CardContent className="p-6 text-sm text-foreground-muted">
            Loading...
          </CardContent>
        </Card>
      ) : !order ? (
        <Card className="shadow-sm">
          <CardContent className="p-6 text-sm text-foreground-muted">
            Order not found.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Top Summary Strip */}
          <Card className="shadow-sm">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <SummaryTile
                  icon={<HiCalendar className="h-5 w-5 text-info" />}
                  label="Placed On"
                  value={
                    <>
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      <span className="ml-2 text-foreground-light">
                        {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </>
                  }
                />
                <SummaryTile
                  icon={<HiCreditCard className="h-5 w-5 text-success" />}
                  label="Payment"
                  value={(() => {
                    const payKey = (order.paymentStatus || "").toUpperCase();
                    const toneMap: Record<
                      string,
                      "success" | "warning" | "error" | "info"
                    > = {
                      PAID: "success",
                      PENDING: "warning",
                      FAILED: "error",
                      REFUNDED: "info",
                    };
                    const payTone = toneMap[payKey] ?? "muted";
                    return (
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-background-tertiary border border-border px-2 py-0.5 text-[12px]">
                          {order.paymentMethod || "—"}
                        </span>
                        <Badge className={badgeClass(payTone)}>
                          {order.paymentStatus || "—"}
                        </Badge>
                      </div>
                    );
                  })()}
                />
                <SummaryTile
                  icon={<HiTruck className="h-5 w-5 text-warning" />}
                  label="Shipping"
                  value={
                    order.estimatedDeliveryDate ? (
                      <>
                        ETA{" "}
                        {new Date(
                          order.estimatedDeliveryDate
                        ).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </>
                    ) : (
                      "—"
                    )
                  }
                />
                <SummaryTile
                  icon={<HiCreditCard className="h-5 w-5 text-success" />}
                  label="Total"
                  value={
                    <span className="font-bold">
                      {currency(order.grandTotal)}
                    </span>
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Main grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 min-w-0">
            {/* Left: Items */}
            <Card className="md:col-span-2 shadow-sm">
              <CardHeader className="border-b border-border p-4 sm:p-5">
                <CardTitle className="text-lg">Items</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto max-w-full">
                  <table className="min-w-[760px] w-full text-[13px]">
                    <thead className="bg-surface sticky top-0 z-10 border-b border-border">
                      <tr className="text-left">
                        {["Product", "SKU", "Qty", "Price", "Total"].map(
                          (h) => (
                            <th
                              key={h}
                              className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-foreground-light"
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                      {(order.items || []).map((it: any) => (
                        <tr
                          key={it.id}
                          className="hover:bg-background-secondary/70"
                        >
                          <td className="py-3 px-4 max-w-[460px] truncate">
                            <div className="font-medium">{it.title}</div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {it.sku || "—"}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {it.quantity}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {currency((it.unitPrice ?? it.price) as number)}
                          </td>
                          <td className="py-3 px-4 font-semibold whitespace-nowrap">
                            {currency(
                              (it.totalPrice ??
                                it.price * it.quantity) as number
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Right: Summary + Status */}
            <div className="space-y-5 min-w-0">
              {/* Order total breakdown */}
              <Card className="shadow-sm">
                <CardHeader className="border-b border-border p-4 sm:p-5">
                  <CardTitle className="text-lg">Totals</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-2 text-sm">
                  <Row label="Subtotal" value={currency(order.subtotal)} />
                  <Row
                    label="Shipping"
                    value={
                      order.shippingTotal === 0
                        ? "Free"
                        : currency(order.shippingTotal)
                    }
                  />
                  <Row label="Tax" value={currency(order.taxTotal)} />
                  {order.appliedCouponCode ? (
                    <Row
                      label={`Discount (${order.appliedCouponCode})`}
                      value={`-${currency(order.discountTotal)}`}
                      valueClass="text-success"
                    />
                  ) : null}
                  <div className="border-t border-border my-2" />
                  <Row
                    label="Grand Total"
                    value={currency(order.grandTotal)}
                    strong
                  />
                </CardContent>
              </Card>

              {/* Addresses */}
              <Card className="shadow-sm">
                <CardHeader className="border-b border-border p-4 sm:p-5">
                  <CardTitle className="text-lg">Addresses</CardTitle>
                </CardHeader>
                <CardContent className="p-5 grid grid-cols-1 gap-4">
                  <AddressBlock title="Shipping Address" addr={shippingAddr} />
                  {billingAddr ? (
                    <AddressBlock title="Billing Address" addr={billingAddr} />
                  ) : null}
                </CardContent>
              </Card>

              {/* Shipping / Tracking */}
              <Card className="shadow-sm">
                <CardHeader className="border-b border-border p-4 sm:p-5">
                  <CardTitle className="text-lg">Shipping & Tracking</CardTitle>
                </CardHeader>
                <CardContent className="p-5 text-sm space-y-2">
                  <Row
                    label="Carrier"
                    value={(order as any)?.shippingCarrier || "—"}
                  />
                  <Row
                    label="Tracking ID"
                    value={(order as any)?.trackingId || "—"}
                    mono
                  />
                  <Row
                    label="ETA"
                    value={
                      order.estimatedDeliveryDate
                        ? new Date(
                            order.estimatedDeliveryDate
                          ).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"
                    }
                  />
                </CardContent>
              </Card>

              {/* Update Status */}
              <Card className="shadow-sm">
                <CardHeader className="border-b border-border p-4 sm:p-5">
                  <CardTitle className="text-lg">Update Status</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <select
                      className="w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <Button onClick={updateStatus} disabled={updating}>
                      {updating ? "Updating..." : "Update"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ——— Small UI helpers ——— */

function SummaryTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface p-4">
      <div>
        <div className="text-[12px] uppercase tracking-wider text-foreground-light">
          {label}
        </div>
        <div className="mt-1 text-sm">{value}</div>
      </div>
      <div className="rounded-xl bg-background-tertiary p-2 border border-border">
        {icon}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  mono,
  valueClass,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
  mono?: boolean;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-foreground-secondary">{label}</span>
      <span
        className={[
          strong ? "font-semibold text-foreground" : "",
          mono ? "font-mono" : "",
          valueClass || "",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

function AddressBlock({ title, addr }: { title: string; addr: any }) {
  if (!addr) {
    return (
      <div className="rounded-lg border border-border p-4 bg-background">
        <div className="text-sm font-medium mb-1">{title}</div>
        <div className="text-sm text-foreground-muted">—</div>
      </div>
    );
  }
  const lines = [
    addr.name,
    addr.line1,
    addr.line2,
    [addr.city, addr.state, addr.pincode].filter(Boolean).join(", "),
    addr.country,
    addr.phone ? `+91 ${addr.phone}` : null,
  ].filter(Boolean);

  return (
    <div className="rounded-lg border border-border p-4 bg-background">
      <div className="text-sm font-medium mb-1">{title}</div>
      <div className="text-sm text-foreground">
        {lines.map((l: string, i: number) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
}
