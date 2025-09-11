"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { orderApi, OrderDto } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = Array.isArray(params?.id)
    ? params.id[0]
    : (params?.id as string);
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!orderId) return;
    const load = async () => {
      setLoading(true);
      try {
        const o = await orderApi.getOrderById(orderId);
        setOrder(o);
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

  const statusSteps = [
    "CREATED",
    "PAID",
    "PACKED",
    "SHIPPED",
    "DELIVERED",
    "COMPLETED",
  ];

  return (
    <div className="container mx-auto p-4 max-w-5xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Order Details</h1>
        <Link href="/account/orders">
          <Button variant="outline">Back to Orders</Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading order...</div>
      ) : !order ? (
        <div className="text-sm text-muted-foreground">Order not found.</div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                Order #{order.id?.slice(0, 8)} • Placed on{" "}
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {statusSteps.map((s, idx) => {
                  const reached = statusSteps.indexOf(order.status) >= idx;
                  return (
                    <div key={s} className="flex items-center gap-2">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center text-xs ${
                          reached
                            ? "bg-green-600 text-white"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span
                        className={`text-xs ${
                          reached ? "text-green-700" : "text-gray-500"
                        }`}
                      >
                        {s}
                      </span>
                      {idx < statusSteps.length - 1 && (
                        <div
                          className={`w-10 h-px ${
                            reached ? "bg-green-400" : "bg-gray-200"
                          }`}
                        ></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.items?.map((it) => {
                      let imageUrl: string | null = null;
                      try {
                        const snap = it.productSnapshot
                          ? JSON.parse(it.productSnapshot)
                          : null;
                        imageUrl = snap?.imageUrl || null;
                      } catch {}
                      return (
                        <div
                          key={it.id}
                          className="flex items-start justify-between gap-4 border-b pb-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center overflow-hidden text-xs text-gray-500">
                              {imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={imageUrl}
                                  alt={it.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                "No Image"
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                {it.title}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Qty: {it.quantity} • SKU: {it.sku || "—"}
                              </div>
                            </div>
                          </div>
                          <div className="text-right text-sm font-semibold">
                            {currency(it.totalPrice as unknown as number)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent>
                  {order.addresses?.map((a) => (
                    <div key={a.id} className="text-sm text-muted-foreground">
                      <div className="font-medium text-gray-900">{a.name}</div>
                      <div>{a.line1}</div>
                      {a.line2 && <div>{a.line2}</div>}
                      <div>
                        {a.city}, {a.state} - {a.pincode}
                      </div>
                      {a.phone && <div>Phone: {a.phone}</div>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Price Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
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
                    <div className="flex justify-between font-semibold text-base">
                      <span>Total</span>
                      <span>{currency(order.grandTotal)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button variant="outline" disabled>
                      Download Invoice
                    </Button>
                    <Button variant="outline" disabled>
                      Cancel
                    </Button>
                    <Button variant="outline" disabled>
                      Return
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
