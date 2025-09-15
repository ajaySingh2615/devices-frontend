"use client";

import { useEffect, useMemo, useState } from "react";
import { adminReviewApi, Review, adminApi, Product } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { toast } from "react-hot-toast";
import {
  HiSearch,
  HiRefresh,
  HiCheck,
  HiX,
  HiChevronLeft,
  HiChevronRight,
  HiDownload,
} from "react-icons/hi";

export default function AdminReviewsPage() {
  const [pending, setPending] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingIds, setActingIds] = useState<Set<string>>(new Set());
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const [productById, setProductById] = useState<Record<string, Product>>({});
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkReason, setBulkReason] = useState("");

  // pagination (client-side)
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = async () => {
    try {
      setLoading(true);
      setSelectedIds(new Set());
      const data = await adminReviewApi.getPending(0, 100); // grab a good chunk
      setPending(data.content || data || []);
      const productIds = Array.from(
        new Set((data.content || data || []).map((r: Review) => r.productId))
      );
      const fetched: Record<string, Product> = {};
      await Promise.all(
        productIds.map(async (id) => {
          try {
            fetched[id] = await adminApi.getProductById(id);
          } catch {
            /* noop */
          }
        })
      );
      setProductById(fetched);
    } catch (e: any) {
      console.error("Failed to load pending reviews", e);
      toast.error(e?.response?.data?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = pending.filter((r) => {
      const p = productById[r.productId];
      const hay = `${p?.title || ""} ${p?.brand?.name || ""} ${r.title || ""} ${
        r.content || ""
      }`.toLowerCase();
      return !q || hay.includes(q);
    });
    // newest first
    return list.sort(
      (a, b) =>
        new Date(b.createdAt as any).getTime() -
        new Date(a.createdAt as any).getTime()
    );
  }, [pending, search, productById]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const paginated = useMemo(() => {
    const start = currentPage * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const allVisibleSelected =
    paginated.length > 0 && paginated.every((r) => selectedIds.has(r.id));
  const toggleSelectAllVisible = () => {
    const next = new Set(selectedIds);
    if (allVisibleSelected) {
      paginated.forEach((r) => next.delete(r.id));
    } else {
      paginated.forEach((r) => next.add(r.id));
    }
    setSelectedIds(next);
  };

  const currencyDate = (d?: string | number | Date) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const stars = (n: number) => {
    const s = Math.max(0, Math.min(5, Math.round(n)));
    return "★".repeat(s) + "☆".repeat(5 - s);
  };

  const setActing = (id: string, on: boolean) =>
    setActingIds((prev) => {
      const next = new Set(prev);
      on ? next.add(id) : next.delete(id);
      return next;
    });

  const moderateSingle = async (id: string, action: "APPROVE" | "REJECT") => {
    const reason =
      action === "REJECT" ? (reasonById[id] || "").trim() : undefined;
    if (action === "REJECT" && !reason) {
      toast.error("Please provide a reason to reject.");
      return;
    }
    try {
      setActing(id, true);
      await adminReviewApi.moderate(id, {
        status: action === "APPROVE" ? "APPROVED" : "REJECTED",
        reason,
      });
      toast.success(action === "APPROVE" ? "Approved" : "Rejected");
      await load();
    } catch (e: any) {
      console.error("Moderation failed", e);
      toast.error(e?.response?.data?.message || "Moderation failed");
    } finally {
      setActing(id, false);
    }
  };

  const bulkModerate = async (action: "APPROVE" | "REJECT") => {
    if (selectedIds.size === 0) return;

    let reason: string | undefined = undefined;
    if (action === "REJECT") {
      const r = bulkReason.trim();
      if (!r) {
        toast.error("Enter a bulk rejection reason.");
        return;
      }
      reason = r;
    }

    const count = selectedIds.size;
    if (
      !confirm(
        `${action === "APPROVE" ? "Approve" : "Reject"} ${count} review(s)?${
          action === "REJECT" ? `\nReason: ${reason}` : ""
        }`
      )
    ) {
      return;
    }

    try {
      const ids = Array.from(selectedIds);
      for (const id of ids) {
        try {
          await adminReviewApi.moderate(id, {
            status: action === "APPROVE" ? "APPROVED" : "REJECTED",
            reason,
          });
        } catch (e) {
          console.error("Failed on id", id, e);
        }
      }
      toast.success(
        `${action === "APPROVE" ? "Approved" : "Rejected"} ${count} review(s)`
      );
      setSelectedIds(new Set());
      setBulkReason("");
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Bulk action failed");
    }
  };

  const exportCsv = () => {
    const rows = [
      [
        "ID",
        "Product",
        "Title",
        "Rating",
        "Content",
        "User Name",
        "User Email",
        "Created",
      ],
      ...filtered.map((r) => [
        r.id,
        productById[r.productId]?.title || r.productId,
        r.title || "",
        String(r.rating ?? ""),
        (r.content || "").replace(/\s+/g, " ").trim(),
        r.user?.name || "",
        r.user?.email || "",
        r.createdAt ? new Date(r.createdAt as any).toISOString() : "",
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pending_reviews_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = async () => {
    const headers = [
      "ID",
      "Product",
      "Title",
      "Rating",
      "Content",
      "User Name",
      "User Email",
      "Created",
    ];

    const rows = filtered.map((r) => ({
      ID: r.id,
      Product: productById[r.productId]?.title || r.productId,
      Title: r.title || "",
      Rating: r.rating ?? "",
      Content: (r.content || "").replace(/\s+/g, " ").trim(),
      "User Name": r.user?.name || "",
      "User Email": r.user?.email || "",
      Created: r.createdAt ? new Date(r.createdAt as any).toISOString() : "",
    }));

    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PendingReviews");

    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pending_reviews_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Review Moderation
          </h1>
          <p className="text-sm text-foreground-muted">
            Approve or reject customer reviews
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load}>
            <HiRefresh className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportCsv}>
            <HiDownload className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={exportExcel}>
            <HiDownload className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Filters + bulk actions */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 sm:p-5 border-b border-border">
          <CardTitle className="flex items-center gap-2">
            <HiSearch className="w-5 h-5" />
            Filters & Bulk Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-light w-5 h-5" />
                <Input
                  placeholder="Search by product, brand, title, or content…"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setPage(0);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value));
                  setPage(0);
                }}
                className="w-full p-3 border border-border rounded-lg bg-surface"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAllVisible}
                disabled={paginated.length === 0}
              >
                <HiCheck className="w-4 h-4 mr-2" />
                {allVisibleSelected
                  ? "Unselect All (Visible)"
                  : "Select All (Visible)"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => bulkModerate("APPROVE")}
                disabled={selectedIds.size === 0}
              >
                <HiCheck className="w-4 h-4 mr-2" />
                Approve Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => bulkModerate("REJECT")}
                disabled={selectedIds.size === 0}
                className={
                  selectedIds.size ? "text-error hover:text-error" : ""
                }
              >
                <HiX className="w-4 h-4 mr-2" />
                Reject Selected
              </Button>
              {selectedIds.size > 0 && (
                <span className="text-sm text-foreground-secondary">
                  {selectedIds.size} selected
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-foreground-secondary">
                Bulk reject reason:
              </span>
              <Input
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                placeholder="Reason for rejecting selected…"
                className="w-[300px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <CardHeader className="p-4 sm:p-5 border-b border-border">
          <CardTitle>Pending Reviews ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-surface z-10">
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 w-10"></th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">
                    Product
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">
                    Title
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">
                    Rating
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">
                    Content
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">
                    User
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">
                    Created
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-foreground-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="py-3 px-4">
                        <div className="h-4 w-4 bg-background-tertiary rounded animate-pulse" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-4 w-56 bg-background-tertiary rounded animate-pulse" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-4 w-40 bg-background-tertiary rounded animate-pulse" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-4 w-20 bg-background-tertiary rounded animate-pulse" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-4 w-80 bg-background-tertiary rounded animate-pulse" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-4 w-36 bg-background-tertiary rounded animate-pulse" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-4 w-28 bg-background-tertiary rounded animate-pulse" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-8 w-28 bg-background-tertiary rounded animate-pulse ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-10 text-center text-foreground-secondary"
                    >
                      No pending reviews
                    </td>
                  </tr>
                ) : (
                  paginated.map((r) => {
                    const p = productById[r.productId];
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-border align-top hover:bg-background-secondary/60"
                      >
                        {/* select */}
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-border"
                            checked={selectedIds.has(r.id)}
                            onChange={() =>
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(r.id)) next.delete(r.id);
                                else next.add(r.id);
                                return next;
                              })
                            }
                            aria-label="Select row"
                          />
                        </td>

                        {/* product */}
                        <td className="py-3 px-4 max-w-[280px]">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-background-secondary overflow-hidden flex-shrink-0">
                              {p?.images?.[0]?.url ? (
                                <img
                                  src={p.images[0].url}
                                  alt={p.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium truncate">
                                {p?.title || r.productId}
                              </div>
                              {p?.brand?.name && (
                                <div className="text-xs text-foreground-secondary truncate">
                                  {p.brand.name}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* title */}
                        <td className="py-3 px-4 max-w-[240px]">
                          <div className="line-clamp-2">{r.title || "—"}</div>
                        </td>

                        {/* rating */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono">
                            {stars(Number(r.rating || 0))}
                          </span>
                        </td>

                        {/* content */}
                        <td className="py-3 px-4 max-w-[420px]">
                          <div className="text-sm text-foreground-secondary whitespace-pre-wrap line-clamp-3">
                            {r.content || "—"}
                          </div>
                        </td>

                        {/* user */}
                        <td className="py-3 px-4 max-w-[220px]">
                          <div className="text-sm">
                            {r.user?.name || "Anonymous"}
                          </div>
                          <div className="text-xs text-foreground-muted truncate">
                            {r.user?.email || ""}
                          </div>
                        </td>

                        {/* created */}
                        <td className="py-3 px-4 text-sm text-foreground-secondary">
                          {currencyDate(r.createdAt as any)}
                        </td>

                        {/* actions */}
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moderateSingle(r.id, "APPROVE")}
                              disabled={actingIds.has(r.id)}
                            >
                              <HiCheck className="w-4 h-4 mr-1" />
                              {actingIds.has(r.id) ? "…" : "Approve"}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => moderateSingle(r.id, "REJECT")}
                              disabled={actingIds.has(r.id)}
                              className="bg-error/10 text-error hover:bg-error/20"
                            >
                              <HiX className="w-4 h-4 mr-1" />
                              {actingIds.has(r.id) ? "…" : "Reject"}
                            </Button>
                          </div>
                          <Textarea
                            placeholder="Reason (required for rejection)"
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
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 flex items-center justify-between border-t border-border">
            <div className="text-sm text-foreground-secondary">
              Showing {paginated.length === 0 ? 0 : currentPage * pageSize + 1}–
              {currentPage * pageSize + paginated.length} of {filtered.length}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                <HiChevronLeft className="w-4 h-4" />
              </Button>
              <div className="text-sm text-foreground-secondary">
                Page {currentPage + 1} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
              >
                <HiChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
