"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminOrdersApi, OrderDto } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { toast } from "react-hot-toast";

const STATUS_OPTIONS = [
  "CREATED",
  "PAID",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "RETURNED",
];

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = Array.isArray(params?.id)
    ? params.id[0]
    : (params?.id as string);
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<string>("PAID");

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

  const currency = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);

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

  return (
    <div className="container mx-auto p-4 max-w-6xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Order Detail (Admin)</h1>
        <Link href="/admin/orders">
          <Button variant="outline">Back</Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : !order ? (
        <div className="text-sm text-muted-foreground">Order not found</div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                #{order.id} • <Badge>{order.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Placed on{" "}
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                  <div className="space-y-2">
                    {order.items?.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-start justify-between gap-4 border-b pb-2"
                      >
                        <div className="text-sm">
                          <div className="font-medium">{it.title}</div>
                          <div className="text-xs text-muted-foreground">
                            Qty: {it.quantity} • SKU: {it.sku || "—"}
                          </div>
                        </div>
                        <div className="text-sm font-semibold">
                          {currency(it.totalPrice as unknown as number)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{currency(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>
                        {order.shippingTotal === 0
                          ? "Free"
                          : currency(order.shippingTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax</span>
                      <span>{currency(order.taxTotal)}</span>
                    </div>
                    {order.appliedCouponCode && (
                      <div className="flex justify-between text-green-700">
                        <span>Discount ({order.appliedCouponCode})</span>
                        <span>-{currency(order.discountTotal)}</span>
                      </div>
                    )}
                    <div className="border-t my-2"></div>
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>{currency(order.grandTotal)}</span>
                    </div>
                  </div>

                  <div className="border rounded p-3">
                    <div className="text-sm font-medium mb-2">
                      Update Status
                    </div>
                    <select
                      className="w-full border rounded px-2 py-1 text-sm"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <div className="mt-2 flex justify-end">
                      <Button onClick={updateStatus} disabled={updating}>
                        {updating ? "Updating..." : "Update"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
