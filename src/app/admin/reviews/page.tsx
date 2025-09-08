"use client";

import { useEffect, useState } from "react";
import { adminReviewApi, Review, adminApi, Product } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "react-hot-toast";
import { Input } from "@/components/ui/Input";

export default function AdminReviewsPage() {
  const [pending, setPending] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const [productById, setProductById] = useState<Record<string, Product>>({});
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      const data = await adminReviewApi.getPending(0, 50);
      setPending(data.content);
      const productIds = Array.from(
        new Set(data.content.map((r) => r.productId))
      );
      const fetched: Record<string, Product> = {};
      await Promise.all(
        productIds.map(async (id) => {
          try {
            fetched[id] = await adminApi.getProductById(id);
          } catch {}
        })
      );
      setProductById(fetched);
    } catch (e: any) {
      console.error("Failed to load pending reviews", e);
      toast.error(e.response?.data?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const moderate = async (id: string, action: "APPROVE" | "REJECT") => {
    try {
      await adminReviewApi.moderate(id, {
        status: action === "APPROVE" ? "APPROVED" : "REJECTED",
        reason: action === "REJECT" ? reasonById[id] : undefined,
      });
      toast.success(action === "APPROVE" ? "Approved" : "Rejected");
      load();
    } catch (e: any) {
      console.error("Moderation failed", e);
      toast.error(e.response?.data?.message || "Moderation failed");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Review Moderation</h1>
      <div className="relative mb-6">
        <Input
          placeholder="Search by product, title or content"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading…</p>
          ) : pending.length === 0 ? (
            <p className="text-muted-foreground">No pending reviews</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-border rounded-lg overflow-hidden">
                <thead className="bg-background-secondary">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm text-foreground-secondary">
                      Product
                    </th>
                    <th className="text-left px-4 py-3 text-sm text-foreground-secondary">
                      Title
                    </th>
                    <th className="text-left px-4 py-3 text-sm text-foreground-secondary">
                      Rating
                    </th>
                    <th className="text-left px-4 py-3 text-sm text-foreground-secondary">
                      Content
                    </th>
                    <th className="text-left px-4 py-3 text-sm text-foreground-secondary">
                      User
                    </th>
                    <th className="text-left px-4 py-3 text-sm text-foreground-secondary">
                      Created
                    </th>
                    <th className="text-right px-4 py-3 text-sm text-foreground-secondary">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pending
                    .filter((r) => {
                      const p = productById[r.productId];
                      const hay = `${p?.title || r.productId} ${
                        r.title || ""
                      } ${r.content || ""}`.toLowerCase();
                      return hay.includes(search.toLowerCase());
                    })
                    .map((r) => {
                      const p = productById[r.productId];
                      return (
                        <tr key={r.id} className="border-t border-border">
                          <td className="px-4 py-3 align-top">
                            <div className="font-medium line-clamp-2 max-w-[260px]">
                              {p?.title || r.productId}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top max-w-[240px]">
                            <div className="line-clamp-2">{r.title}</div>
                          </td>
                          <td className="px-4 py-3 align-top">{r.rating}</td>
                          <td className="px-4 py-3 align-top max-w-[360px]">
                            <div className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                              {r.content || "—"}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top max-w-[180px]">
                            <div className="text-sm">
                              {r.user?.name || "Anonymous"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {r.user?.email || ""}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top text-sm text-muted-foreground">
                            {r.createdAt
                              ? new Date(
                                  r.createdAt as any
                                ).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => moderate(r.id, "APPROVE")}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => moderate(r.id, "REJECT")}
                              >
                                Reject
                              </Button>
                            </div>
                            <Textarea
                              placeholder="Reason (for rejection)"
                              value={reasonById[r.id] || ""}
                              onChange={(e) =>
                                setReasonById((prev) => ({
                                  ...prev,
                                  [r.id]: e.target.value,
                                }))
                              }
                              className="mt-2"
                            />
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
