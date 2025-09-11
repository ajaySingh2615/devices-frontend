"use client";

import { useEffect, useState } from "react";
import { orderApi, OrderDto } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-hot-toast";

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const list = await orderApi.getUserOrders();
        setOrders(list);
      } catch (e: any) {
        toast.error(e?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, user]);

  const currency = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);

  if (authLoading) {
    return <div className="container mx-auto p-4 max-w-5xl">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>My Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">Please login to view your orders.</div>
            <div className="mt-3">
              <Link href="/auth/login">
                <Button>Go to Login</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>My Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              You have no orders yet.
              <div className="mt-3">
                <Link href="/products">
                  <Button>Start Shopping</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="border rounded-md p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-sm">
                      Order #{o.id.slice(0, 8)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Status: {o.status} • Placed on{" "}
                      {new Date(o.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Items: {o.items?.length || 0}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {currency(o.grandTotal)}
                    </div>
                    <div className="mt-2 flex gap-2 justify-end">
                      <Link href={`/orders/${o.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
