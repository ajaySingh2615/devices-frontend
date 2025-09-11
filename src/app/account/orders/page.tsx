"use client";

import { useEffect, useState } from "react";
import { orderApi, OrderDto, PageResponse } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-hot-toast";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [query, setQuery] = useState<string>("");
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const res: PageResponse<OrderDto> =
          await orderApi.getUserOrdersPaginated(0, 10);
        setOrders(res.content);
        setPage(0);
        setHasMore(!res.last);
      } catch (e: any) {
        toast.error(e?.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, user]);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res: PageResponse<OrderDto> = await orderApi.getUserOrdersPaginated(
        nextPage,
        10
      );
      setOrders((prev) => [...prev, ...res.content]);
      setPage(nextPage);
      setHasMore(!res.last);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load more orders");
    } finally {
      setLoading(false);
    }
  };

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

  const filtered = orders.filter((o) => {
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      o.id.toLowerCase().includes(q) ||
      o.items?.some((it) => it.title?.toLowerCase().includes(q));
    return matchesStatus && matchesQuery;
  });

  const tabs: { key: string; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "CREATED", label: "Placed" },
    { key: "PAID", label: "Paid" },
    { key: "PACKED", label: "Packed" },
    { key: "SHIPPED", label: "Shipped" },
    { key: "DELIVERED", label: "Delivered" },
    { key: "CANCELLED", label: "Cancelled" },
    { key: "RETURNED", label: "Returned" },
  ];

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>My Orders</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Search orders"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setStatusFilter(t.key)}
                className={`px-3 py-1 rounded-full text-sm border ${
                  statusFilter === t.key
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">
              Loading orders...
            </div>
          ) : filtered.length === 0 ? (
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
              {filtered.map((o) => {
                const firstItem = o.items?.[0];
                // Try to parse image URL from productSnapshot if present
                let imageUrl: string | null = null;
                try {
                  const snap = firstItem?.productSnapshot
                    ? JSON.parse(firstItem.productSnapshot)
                    : null;
                  imageUrl = snap?.imageUrl || null;
                } catch {}
                return (
                  <div
                    key={o.id}
                    className="border rounded-md p-3 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded bg-gray-100 flex items-center justify-center overflow-hidden text-xs text-gray-500">
                        {imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageUrl}
                            alt={firstItem?.title || "Product"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          "No Image"
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {firstItem?.title || `Order #${o.id.slice(0, 8)}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Placed on{" "}
                          {new Date(o.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <div className="mt-1">
                          <Badge>{o.status}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {currency(o.grandTotal)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {o.items?.length || 0} item(s)
                      </div>
                      <div className="mt-2 flex gap-2 justify-end">
                        <Link href={`/orders/${o.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" disabled>
                          Invoice
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {hasMore && (
                <div className="pt-2 flex justify-center">
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
