"use client";

import { useEffect, useState } from "react";
import { adminReviewApi, Review } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "react-hot-toast";

export default function AdminReviewsPage() {
  const [pending, setPending] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [reasonById, setReasonById] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      setLoading(true);
      const data = await adminReviewApi.getPending(0, 50);
      setPending(data.content);
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
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Review Moderation</h1>

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
            <div className="space-y-4">
              {pending.map((r) => (
                <div
                  key={r.id}
                  className="border rounded-lg p-4 flex flex-col gap-2"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{r.title}</div>
                      <div className="text-sm text-muted-foreground">
                        Rating: {r.rating} • Product: {r.productId}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => moderate(r.id, "APPROVE")}
                      >
                        Approve
                      </Button>
                      <Button onClick={() => moderate(r.id, "REJECT")}>
                        Reject
                      </Button>
                    </div>
                  </div>
                  {r.content && <div className="text-sm">{r.content}</div>}
                  <Textarea
                    placeholder="Reason (for rejection)"
                    value={reasonById[r.id] || ""}
                    onChange={(e) =>
                      setReasonById((prev) => ({
                        ...prev,
                        [r.id]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
