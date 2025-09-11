"use client";

import { useEffect, useMemo, useState } from "react";
import { adminOrdersApi, OrderDto, PageResponse } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { toast } from "react-hot-toast";

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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [query, setQuery] = useState<string>("");
  const [status, setStatus] = useState<string>("ALL");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
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
    load();
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

  const currency = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Orders (Admin)</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Search by ID or title"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {STATUS_TABS.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-3 py-1 rounded-full text-sm border ${
                  status === s
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {loading && orders.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Loading orders...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No orders found.
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((o) => {
                const title =
                  o.items?.[0]?.title || `Order #${o.id.slice(0, 8)}`;
                return (
                  <div
                    key={o.id}
                    className="border rounded-md p-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                  >
                    <div className="md:col-span-5">
                      <div className="text-sm font-medium">{title}</div>
                      <div className="text-xs text-muted-foreground">
                        #{o.id}
                      </div>
                    </div>
                    <div className="md:col-span-2 text-sm font-semibold">
                      {currency(o.grandTotal)}
                    </div>
                    <div className="md:col-span-2 text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    <div className="md:col-span-1">
                      <Badge>{o.status}</Badge>
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-2">
                      <Link href={`/admin/orders/${o.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
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
