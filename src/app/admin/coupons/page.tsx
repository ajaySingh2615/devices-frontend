"use client";

import { useState, useEffect } from "react";
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
  MoreVertical,
} from "lucide-react";
import {
  adminCouponApi,
  Coupon,
  CreateCouponRequest,
  UpdateCouponRequest,
} from "@/lib/api";

interface CouponFormData {
  code: string;
  name: string;
  description: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrderAmount: number;
  maxDiscountAmount: number;
  startAt: string;
  endAt: string;
  usageLimit: number;
  perUserLimit: number;
  isActive: boolean;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
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

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const data = await adminCouponApi.getAllCoupons();
      setCoupons(data);
    } catch (error: any) {
      console.error("Failed to load coupons:", error);
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.startAt || !formData.endAt) {
      toast.error("Please select both start and end dates");
      return;
    }

    // Validate date order
    if (new Date(formData.startAt) >= new Date(formData.endAt)) {
      toast.error("End date must be after start date");
      return;
    }

    try {
      // Convert datetime-local format to ISO string with seconds
      const formatDateTime = (dateTimeString: string) => {
        if (!dateTimeString) return "";
        // Ensure we have a valid datetime format
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) {
          throw new Error("Invalid date format");
        }
        return date.toISOString();
      };

      if (editingCoupon) {
        const updateData: UpdateCouponRequest = {
          ...formData,
          id: editingCoupon.id,
          startAt: formatDateTime(formData.startAt),
          endAt: formatDateTime(formData.endAt),
        };
        await adminCouponApi.updateCoupon(editingCoupon.id, updateData);
        toast.success("Coupon updated successfully");
      } else {
        const createData: CreateCouponRequest = {
          ...formData,
          startAt: formatDateTime(formData.startAt),
          endAt: formatDateTime(formData.endAt),
        };
        await adminCouponApi.createCoupon(createData);
        toast.success("Coupon created successfully");
      }

      setShowForm(false);
      setEditingCoupon(null);
      resetForm();
      loadCoupons();
    } catch (error: any) {
      console.error("Failed to save coupon:", error);
      toast.error(error.response?.data?.message || "Failed to save coupon");
    }
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
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      await adminCouponApi.deleteCoupon(couponId);
      toast.success("Coupon deleted successfully");
      loadCoupons();
    } catch (error: any) {
      console.error("Failed to delete coupon:", error);
      toast.error("Failed to delete coupon");
    }
  };

  const handleToggleStatus = async (
    couponId: string,
    currentStatus: boolean
  ) => {
    try {
      console.log("Frontend: Toggling coupon status:", {
        couponId,
        currentStatus,
        newStatus: !currentStatus,
      });
      const result = await adminCouponApi.toggleCouponStatus(
        couponId,
        !currentStatus
      );
      console.log("Frontend: Toggle result:", result);
      toast.success(
        `Coupon ${!currentStatus ? "activated" : "deactivated"} successfully`
      );
      loadCoupons();
    } catch (error: any) {
      console.error("Failed to toggle coupon status:", error);
      toast.error("Failed to toggle coupon status");
    }
  };

  const resetForm = () => {
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
  };

  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch =
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && coupon.isActive) ||
      (filterStatus === "inactive" && !coupon.isActive);
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";

    try {
      // Handle different date formats
      let date: Date;

      // If it's already a valid ISO string, use it directly
      if (
        dateString.includes("T") &&
        (dateString.includes("Z") || dateString.includes("+"))
      ) {
        date = new Date(dateString);
      } else {
        // Handle other formats
        date = new Date(dateString);
      }

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn("Invalid date string:", dateString);
        return "Invalid Date";
      }

      return date.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "Invalid Date";
    }
  };

  const getStatusBadge = (coupon: Coupon) => {
    const now = new Date();
    const startDate = new Date(coupon.startAt);
    const endDate = new Date(coupon.endAt);

    if (!coupon.isActive) {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-600">
          Inactive
        </Badge>
      );
    }

    if (now < startDate) {
      return (
        <Badge variant="outline" className="border-blue-200 text-blue-600">
          Scheduled
        </Badge>
      );
    }

    if (now > endDate) {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-600">
          Expired
        </Badge>
      );
    }

    return (
      <Badge variant="default" className="bg-green-100 text-green-600">
        Active
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Coupon Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage discount coupons and promotional codes
          </p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingCoupon(null);
            resetForm();
          }}
          className="bg-primary hover:bg-primary-dark text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search coupons by code or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="all">All Coupons</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coupons List */}
      <div className="grid gap-4">
        {filteredCoupons.map((coupon) => (
          <Card key={coupon.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge variant="outline" className="font-mono text-sm">
                      {coupon.code}
                    </Badge>
                    {getStatusBadge(coupon)}
                  </div>

                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {coupon.name}
                  </h3>

                  {coupon.description && (
                    <p className="text-muted-foreground text-sm mb-3">
                      {coupon.description}
                    </p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      {coupon.type === "PERCENTAGE" ? (
                        <Percent className="h-4 w-4 text-blue-600" />
                      ) : (
                        <IndianRupee className="h-4 w-4 text-green-600" />
                      )}
                      <span className="text-muted-foreground">Value:</span>
                      <span className="font-medium">
                        {coupon.type === "PERCENTAGE"
                          ? `${coupon.value}%`
                          : `₹${coupon.value}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-orange-600" />
                      <span className="text-muted-foreground">Min Order:</span>
                      <span className="font-medium">
                        ₹{coupon.minOrderAmount || 0}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      <span className="text-muted-foreground">Usage:</span>
                      <span className="font-medium">
                        {coupon.usageLimit === 0
                          ? "Unlimited"
                          : coupon.usageLimit}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <span className="text-muted-foreground">Expires:</span>
                      <span className="font-medium">
                        {formatDate(coupon.endAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(coupon)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleToggleStatus(coupon.id, coupon.isActive)
                    }
                    className={
                      coupon.isActive
                        ? "text-red-600 hover:text-red-700"
                        : "text-green-600 hover:text-green-700"
                    }
                  >
                    {coupon.isActive ? (
                      <XCircle className="h-4 w-4" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(coupon.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredCoupons.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No coupons found</h3>
                <p className="text-sm">
                  {searchTerm || filterStatus !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Create your first coupon to get started"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Coupon Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
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
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
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

                <div className="flex items-center gap-2">
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

                <div className="flex items-center gap-3 pt-4">
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary-dark text-white"
                  >
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
