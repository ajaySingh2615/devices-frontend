"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Calendar,
  Percent,
  IndianRupee,
  Users,
  Target,
  Search,
  Filter,
  Copy,
  X,
} from "lucide-react";
import {
  adminCouponApi,
  Coupon,
  CreateCouponRequest,
  UpdateCouponRequest,
} from "@/lib/api";

/* ---------------- helpers ---------------- */

type StatusFilter = "all" | "active" | "inactive" | "scheduled" | "expired";
type TypeFilter = "all" | "PERCENTAGE" | "FIXED";

interface CouponFormData {
  code: string;
  name: string;
  description: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrderAmount: number;
  maxDiscountAmount: number;
  startAt: string; // datetime-local
  endAt: string; // datetime-local
  usageLimit: number; // 0 = unlimited
  perUserLimit: number; // >=1
  isActive: boolean;
}

const currency = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function parseLocalDate(dt: string) {
  // Accepts "YYYY-MM-DDTHH:mm" (datetime-local) or any ISO-ish thing
  const d = new Date(dt);
  return isNaN(d.getTime()) ? null : d;
}

function toISOOrThrow(dt: string) {
  const d = parseLocalDate(dt);
  if (!d) throw new Error("Invalid date");
  return d.toISOString(); // backend-safe
}

function computeStatus(
  c: Coupon
): "inactive" | "scheduled" | "active" | "expired" {
  if (!c.isActive) return "inactive";
  const now = new Date();
  const s = new Date(c.startAt);
  const e = new Date(c.endAt);
  if (now < s) return "scheduled";
  if (now > e) return "expired";
  return "active";
}

function formatDate(dt: string) {
  const d = parseLocalDate(dt);
  if (!d) return "Invalid Date";
  return d.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ---------------- page ---------------- */

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  // form/modal
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CouponFormData>({
    code: "",
    name: "",
    description: "",
    type: "PERCENTAGE",
    value: 0,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    startAt: "",
    endAt: "",
    usageLimit: 0,
    perUserLimit: 1,
    isActive: true,
  });

  // filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const data = await adminCouponApi.getAllCoupons();
      setCoupons(data);
    } catch (error) {
      console.error("Failed to load coupons:", error);
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  /* ----- stats & filters ----- */

  const stats = useMemo(() => {
    const counters = {
      total: coupons.length,
      active: 0,
      scheduled: 0,
      expired: 0,
      inactive: 0,
    };
    for (const c of coupons) counters[computeStatus(c)]++;
    return counters;
  }, [coupons]);

  const filteredCoupons = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return coupons
      .filter((c) => {
        const matchesText =
          !q ||
          c.code.toLowerCase().includes(q) ||
          c.name.toLowerCase().includes(q);
        const s = computeStatus(c);
        const matchesStatus =
          filterStatus === "all" ? true : s === filterStatus;
        const matchesType = typeFilter === "all" ? true : c.type === typeFilter;
        return matchesText && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        // End-soonest first when active/scheduled; otherwise by recent creation
        const sa = computeStatus(a);
        const sb = computeStatus(b);
        if (
          (sa === "active" || sa === "scheduled") &&
          (sb === "active" || sb === "scheduled")
        ) {
          return new Date(a.endAt).getTime() - new Date(b.endAt).getTime();
        }
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [coupons, searchTerm, filterStatus, typeFilter]);

  /* ----- CRUD helpers ----- */

  const resetForm = () =>
    setFormData({
      code: "",
      name: "",
      description: "",
      type: "PERCENTAGE",
      value: 0,
      minOrderAmount: 0,
      maxDiscountAmount: 0,
      startAt: "",
      endAt: "",
      usageLimit: 0,
      perUserLimit: 1,
      isActive: true,
    });

  const openCreate = () => {
    setEditingCoupon(null);
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || "",
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount || 0,
      maxDiscountAmount: coupon.maxDiscountAmount || 0,
      startAt: new Date(coupon.startAt).toISOString().slice(0, 16),
      endAt: new Date(coupon.endAt).toISOString().slice(0, 16),
      usageLimit: coupon.usageLimit,
      perUserLimit: coupon.perUserLimit,
      isActive: coupon.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await adminCouponApi.deleteCoupon(couponId);
      toast.success("Coupon deleted");
      loadCoupons();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete coupon");
    }
  };

  const handleToggleStatus = async (id: string, current: boolean) => {
    try {
      await adminCouponApi.toggleCouponStatus(id, !current);
      toast.success(`Coupon ${!current ? "activated" : "deactivated"}`);
      loadCoupons();
    } catch (error) {
      console.error(error);
      toast.error("Failed to toggle coupon status");
    }
  };

  /* ----- submit with stronger validation ----- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // basic required
    if (!formData.code || !formData.name) {
      toast.error("Code and name are required.");
      return;
    }
    if (!formData.startAt || !formData.endAt) {
      toast.error("Please select both start and end dates.");
      return;
    }

    // code rules & uniqueness
    const code = formData.code.toUpperCase().trim();
    if (!/^[A-Z0-9_-]{3,20}$/.test(code)) {
      toast.error("Code must be 3–20 chars (A–Z, 0–9, -, _).");
      return;
    }
    const duplicate = coupons.find(
      (c) => c.code.toUpperCase() === code && c.id !== editingCoupon?.id
    );
    if (duplicate) {
      toast.error("Coupon code already exists.");
      return;
    }

    // type/value constraints
    if (formData.type === "PERCENTAGE") {
      if (formData.value <= 0 || formData.value > 100) {
        toast.error("Percentage value must be between 1 and 100.");
        return;
      }
    } else {
      if (formData.value <= 0) {
        toast.error("Fixed amount must be greater than 0.");
        return;
      }
    }
    if (formData.perUserLimit < 1) {
      toast.error("Per-user limit must be at least 1.");
      return;
    }
    if (formData.minOrderAmount < 0 || formData.maxDiscountAmount < 0) {
      toast.error("Amounts cannot be negative.");
      return;
    }

    // dates
    const start = parseLocalDate(formData.startAt);
    const end = parseLocalDate(formData.endAt);
    if (!start || !end) {
      toast.error("Invalid start/end date.");
      return;
    }
    if (start >= end) {
      toast.error("End date must be after start date.");
      return;
    }

    try {
      const payloadCommon = {
        ...formData,
        code,
        startAt: toISOOrThrow(formData.startAt),
        endAt: toISOOrThrow(formData.endAt),
      };

      if (editingCoupon) {
        const updateData: UpdateCouponRequest = {
          id: editingCoupon.id,
          ...payloadCommon,
        };
        await adminCouponApi.updateCoupon(editingCoupon.id, updateData);
        toast.success("Coupon updated");
      } else {
        const createData: CreateCouponRequest = payloadCommon;
        await adminCouponApi.createCoupon(createData);
        toast.success("Coupon created");
      }
      setShowForm(false);
      setEditingCoupon(null);
      resetForm();
      loadCoupons();
    } catch (error: any) {
      console.error("Failed to save coupon:", error);
      toast.error(error?.response?.data?.message || "Failed to save coupon");
    }
  };

  /* ---------------- render ---------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-5 min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Coupon Management
          </h1>
          <p className="text-sm text-foreground-muted">
            Manage discount coupons and promotional codes
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Active" value={stats.active} />
        <StatCard label="Scheduled" value={stats.scheduled} />
        <StatCard label="Expired" value={stats.expired} />
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardHeader className="border-b border-border p-4 sm:p-5">
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-light" />
                <Input
                  placeholder="Search by code or name…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-background-tertiary"
                  >
                    <X className="w-4 h-4 text-foreground-light" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-foreground-light" />
                <select
                  value={filterStatus}
                  onChange={(e) =>
                    setFilterStatus(e.target.value as StatusFilter)
                  }
                  className="w-full px-3 py-2 rounded-md border border-border bg-background"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="expired">Expired</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className="w-full px-3 py-2 rounded-md border border-border bg-background"
              >
                <option value="all">All</option>
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed Amount</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coupon list (cards) */}
      <div className="grid gap-4">
        {filteredCoupons.map((c) => {
          const st = computeStatus(c);
          const isPct = c.type === "PERCENTAGE";
          return (
            <Card
              key={c.id}
              className="shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  {/* left */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="font-mono text-sm">
                        {c.code}
                      </Badge>
                      <StatusBadge status={st} />
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(c.code);
                            toast.success("Code copied");
                          } catch {
                            toast.error("Failed to copy");
                          }
                        }}
                        className="inline-flex items-center gap-1 text-[12px] px-2 py-0.5 rounded border border-border hover:bg-background-tertiary"
                        title="Copy code"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </button>
                    </div>

                    <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">
                      {c.name}
                    </h3>

                    {c.description && (
                      <p className="text-sm text-foreground-secondary mt-1 line-clamp-2">
                        {c.description}
                      </p>
                    )}

                    {/* details */}
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-[13px]">
                      <div className="flex items-center gap-2">
                        {isPct ? (
                          <Percent className="h-4 w-4 text-info" />
                        ) : (
                          <IndianRupee className="h-4 w-4 text-success" />
                        )}
                        <span className="text-foreground-light">Value:</span>
                        <span className="font-medium">
                          {isPct ? `${c.value}%` : currency(c.value)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-accent" />
                        <span className="text-foreground-light">
                          Min Order:
                        </span>
                        <span className="font-medium">
                          {currency(c.minOrderAmount || 0)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-600" />
                        <span className="text-foreground-light">Per user:</span>
                        <span className="font-medium">
                          {c.perUserLimit || 1}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-foreground" />
                        <span className="text-foreground-light">Ends:</span>
                        <span className="font-medium">
                          {formatDate(c.endAt)}
                        </span>
                      </div>
                    </div>

                    {/* timeline hint */}
                    <div className="mt-3 text-[12px] text-foreground-light">
                      {`Valid: ${formatDate(c.startAt)} → ${formatDate(
                        c.endAt
                      )}`}
                    </div>
                  </div>

                  {/* right actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(c)}
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(c.id, c.isActive)}
                      className={
                        c.isActive
                          ? "text-error hover:text-error"
                          : "text-success hover:text-success"
                      }
                      title={c.isActive ? "Deactivate" : "Activate"}
                    >
                      {c.isActive ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(c.id)}
                      className="text-error hover:text-error"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredCoupons.length === 0 && (
          <Card className="shadow-sm">
            <CardContent className="py-16 text-center">
              <Target className="h-10 w-10 mx-auto mb-3 text-foreground-light" />
              <h3 className="text-base font-semibold">No coupons found</h3>
              <p className="text-sm text-foreground-muted">
                {searchTerm || filterStatus !== "all" || typeFilter !== "all"
                  ? "Try adjusting search or filters."
                  : "Create your first coupon to get started."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal: Create/Edit */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onClick={(e) => {
            // close when clicking backdrop (not inside card)
            if (e.target === e.currentTarget) {
              setShowForm(false);
              setEditingCoupon(null);
              resetForm();
            }
          }}
        >
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <CardHeader className="p-4 sm:p-5 border-b border-border">
              <CardTitle className="text-lg">
                {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">Coupon Code *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="WELCOME10"
                      className="uppercase"
                      required
                    />
                    <p className="text-[12px] text-foreground-light mt-1">
                      Letters, numbers, hyphen & underscore only.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="name">Coupon Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Welcome Discount"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Get 10% off on your first order"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="type">Discount Type *</Label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2 rounded-md border border-border bg-background"
                      required
                    >
                      <option value="PERCENTAGE">Percentage</option>
                      <option value="FIXED">Fixed Amount</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="value">Discount Value *</Label>
                    <Input
                      id="value"
                      type="number"
                      min="0"
                      step={formData.type === "PERCENTAGE" ? "1" : "0.01"}
                      value={formData.value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          value: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder={
                        formData.type === "PERCENTAGE" ? "10" : "100"
                      }
                      required
                    />
                    <p className="text-[12px] text-foreground-light mt-1">
                      {formData.type === "PERCENTAGE"
                        ? "1–100"
                        : "Fixed INR amount"}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="minOrderAmount">Minimum Order Amount</Label>
                    <Input
                      id="minOrderAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.minOrderAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minOrderAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="1000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maxDiscountAmount">
                      Maximum Discount Amount
                    </Label>
                    <Input
                      id="maxDiscountAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.maxDiscountAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxDiscountAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="perUserLimit">Per User Limit</Label>
                    <Input
                      id="perUserLimit"
                      type="number"
                      min="1"
                      value={formData.perUserLimit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          perUserLimit: parseInt(e.target.value) || 1,
                        })
                      }
                      placeholder="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startAt">Start Date & Time *</Label>
                    <Input
                      id="startAt"
                      type="datetime-local"
                      value={formData.startAt}
                      onChange={(e) =>
                        setFormData({ ...formData, startAt: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endAt">End Date & Time *</Label>
                    <Input
                      id="endAt"
                      type="datetime-local"
                      value={formData.endAt}
                      onChange={(e) =>
                        setFormData({ ...formData, endAt: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="usageLimit">
                      Total Usage Limit (0 = Unlimited)
                    </Label>
                    <Input
                      id="usageLimit"
                      type="number"
                      min="0"
                      value={formData.usageLimit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          usageLimit: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="1000"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="rounded border-border"
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button type="submit">
                    {editingCoupon ? "Update Coupon" : "Create Coupon"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingCoupon(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ---------------- small bits ---------------- */

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="bg-surface border-border shadow-sm">
      <CardContent className="p-4">
        <div className="text-[12px] uppercase tracking-wider text-foreground-light">
          {label}
        </div>
        <div className="mt-1 text-xl font-bold text-foreground">{value}</div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({
  status,
}: {
  status: "inactive" | "scheduled" | "active" | "expired";
}) {
  if (status === "inactive") {
    return (
      <Badge className="border border-border bg-background-tertiary text-foreground-secondary">
        Inactive
      </Badge>
    );
  }
  if (status === "scheduled") {
    return (
      <Badge className="border border-info/20 bg-info/10 text-info">
        Scheduled
      </Badge>
    );
  }
  if (status === "expired") {
    return (
      <Badge className="border border-error/20 bg-error/10 text-error">
        Expired
      </Badge>
    );
  }
  return (
    <Badge className="border border-success/20 bg-success/10 text-success">
      Active
    </Badge>
  );
}
