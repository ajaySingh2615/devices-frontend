"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiTag,
  HiSearch,
  HiX,
  HiExternalLink,
} from "react-icons/hi";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  adminApi,
  Brand,
  CreateBrandRequest,
  UpdateBrandRequest,
} from "@/lib/api";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const parseDateFlexible = (value: string | number | Date): Date => {
  if (value instanceof Date) return value;
  if (typeof value === "number") {
    const n = value;
    return new Date(n > 1e12 ? n : n * 1000);
  }
  const s = String(value).trim();
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    return new Date(n > 1e12 ? n : n * 1000);
  }
  return new Date(s);
};

const formatDateIST = (value: string | number | Date) =>
  new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parseDateFlexible(value));

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "inactive">(
    ""
  );

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const data = await adminApi.getBrands();
      setBrands(data);
    } catch (error) {
      console.error("Failed to load brands:", error);
      toast.error("Failed to load brands");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const active = brands.filter((b) => b.isActive).length;
    return { total: brands.length, active, inactive: brands.length - active };
  }, [brands]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return brands
      .filter((b) => {
        const matchesSearch =
          !q ||
          b.name.toLowerCase().includes(q) ||
          b.slug.toLowerCase().includes(q);
        const matchesStatus =
          !statusFilter ||
          (statusFilter === "active" ? b.isActive : !b.isActive);
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [brands, search, statusFilter]);

  const handleSave = async (_brand: Brand) => {
    setShowForm(false);
    setEditingBrand(null);
    await loadBrands();
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setShowForm(true);
  };

  const handleDelete = async (brand: Brand) => {
    if (!confirm(`Are you sure you want to delete "${brand.name}"?`)) return;
    try {
      // Not implemented in backend (kept as explicit UX)
      toast.error("Delete functionality not implemented yet");
      // await adminApi.deleteBrand(brand.id);
      // toast.success("Brand deleted");
      // await loadBrands();
    } catch (error: any) {
      console.error("Failed to delete brand:", error);
      toast.error(error?.response?.data?.message || "Failed to delete brand");
    }
  };

  const handleToggleStatus = async (brand: Brand) => {
    try {
      const newStatus = !brand.isActive;
      await adminApi.updateBrand(brand.id, { isActive: newStatus });
      toast.success(`Brand ${newStatus ? "activated" : "deactivated"}`);
      await loadBrands();
    } catch (error: any) {
      console.error("Failed to update brand status:", error);
      toast.error("Failed to update brand status");
    }
  };

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
            Brands
          </h1>
          <p className="text-sm text-foreground-muted">
            Manage product brands and manufacturers
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingBrand(null);
            setShowForm(true);
          }}
        >
          <HiPlus className="w-5 h-5 mr-2" />
          Add Brand
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Active" value={stats.active} />
        <StatCard label="Inactive" value={stats.inactive} />
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
                <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-light w-4 h-4" />
                <Input
                  placeholder="Search by name or slug…"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-background-tertiary"
                  >
                    <HiX className="w-4 h-4 text-foreground-light" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 rounded-md border border-border bg-background"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      {showForm && (
        <BrandForm
          brand={editingBrand || undefined}
          brands={brands}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingBrand(null);
          }}
          formLoading={formLoading}
          setFormLoading={setFormLoading}
        />
      )}

      {/* Brands List */}
      <Card className="shadow-sm">
        <CardHeader className="border-b border-border p-4 sm:p-5">
          <CardTitle className="text-lg">
            Brands{" "}
            <span className="text-foreground-light">({filtered.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-w-full">
            <table className="min-w-[900px] w-full text-[13px] leading-5">
              <thead className="bg-surface sticky top-0 z-10 border-b border-border">
                <tr className="text-left">
                  {["Brand", "Slug", "Description", "Status", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-foreground-light"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background">
                {filtered.map((brand) => (
                  <tr
                    key={brand.id}
                    className="hover:bg-background-secondary/70"
                  >
                    {/* Brand cell with logo */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <LogoThumb name={brand.name} logoUrl={brand.logoUrl} />
                        <div className="min-w-0">
                          <div className="font-medium truncate max-w-[420px]">
                            {brand.name}
                          </div>
                          <div className="text-[12px] text-foreground-light">
                            {formatDateIST(brand.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <code className="text-[12px] bg-background-tertiary px-2 py-0.5 rounded border border-border">
                        {brand.slug}
                      </code>
                    </td>

                    {/* Description */}
                    <td className="py-4 px-4">
                      <span className="text-foreground-secondary line-clamp-2">
                        {brand.description || "—"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(brand)}
                        className={[
                          "px-2 py-1 rounded-full text-xs font-medium border transition-colors",
                          brand.isActive
                            ? "bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20"
                            : "bg-error/10 text-error border-error/20 hover:bg-error/20",
                        ].join(" ")}
                      >
                        {brand.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Edit"
                          onClick={() => handleEdit(brand)}
                        >
                          <HiPencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-error hover:bg-error/10"
                          title="Delete"
                          onClick={() => handleDelete(brand)}
                        >
                          <HiTrash className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="py-16 px-6 text-center">
                <div className="text-sm text-foreground-muted">
                  No brands match your filters.
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------- Form -------------------- */

function BrandForm({
  brand,
  brands,
  onSave,
  onCancel,
  formLoading,
  setFormLoading,
}: {
  brand?: Brand;
  brands: Brand[];
  onSave: (b: Brand) => void;
  onCancel: () => void;
  formLoading: boolean;
  setFormLoading: (b: boolean) => void;
}) {
  const [formData, setFormData] = useState({
    name: brand?.name || "",
    slug: brand?.slug || "",
    description: brand?.description || "",
    logoUrl: brand?.logoUrl || "",
  });

  const [slugEdited, setSlugEdited] = useState<boolean>(!!brand);

  // Auto slug from name unless user edited
  useEffect(() => {
    if (!slugEdited && !brand) {
      setFormData((prev) => ({ ...prev, slug: slugify(prev.name) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.name]);

  const validate = () => {
    if (!formData.name || !formData.slug) {
      toast.error("Please fill all required fields.");
      return false;
    }
    if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      toast.error(
        "Slug can contain only lowercase letters, numbers and hyphens."
      );
      return false;
    }
    const dupe = brands.find(
      (b) =>
        b.slug.toLowerCase() === formData.slug.toLowerCase() &&
        b.id !== brand?.id
    );
    if (dupe) {
      toast.error("Slug already exists. Choose a unique slug.");
      return false;
    }
    if (formData.logoUrl && !/^https?:\/\//i.test(formData.logoUrl)) {
      toast.error("Logo URL must start with http:// or https://");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setFormLoading(true);
    try {
      let saved: Brand;
      if (brand) {
        const updateData: UpdateBrandRequest = {
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
          logoUrl: formData.logoUrl || undefined,
        };
        saved = await adminApi.updateBrand(brand.id, updateData);
        toast.success("Brand updated");
      } else {
        const createData: CreateBrandRequest = {
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
          logoUrl: formData.logoUrl || undefined,
        };
        saved = await adminApi.createBrand(createData);
        toast.success("Brand created");
      }
      onSave(saved);
    } catch (error: any) {
      console.error("Failed to save brand:", error);
      toast.error(error?.response?.data?.message || "Failed to save brand");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b border-border p-4 sm:p-5">
        <CardTitle className="text-lg">
          {brand ? "Edit Brand" : "Add Brand"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Brand Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter brand name"
                required
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium mb-2">
                URL Slug *
              </label>
              <Input
                value={formData.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setFormData({ ...formData, slug: slugify(e.target.value) });
                }}
                placeholder="brand-url-slug"
                required
                pattern="^[a-z0-9-]+$"
                title="Only lowercase letters, numbers and hyphens"
              />
              <div className="flex items-center gap-2 text-[12px] text-foreground-light mt-1">
                <HiExternalLink className="w-4 h-4" />
                <span>Preview:</span>
                <span className="font-mono text-foreground">
                  /b/{formData.slug || "your-slug"}
                </span>
              </div>
            </div>
          </div>

          {/* Logo */}
          <div>
            <label className="block text-sm font-medium mb-2">Logo URL</label>
            <Input
              type="url"
              value={formData.logoUrl}
              onChange={(e) =>
                setFormData({ ...formData, logoUrl: e.target.value })
              }
              placeholder="https://example.com/logo.png"
            />
            <p className="text-[12px] text-foreground-light mt-1">
              Direct URL to brand logo image
            </p>
            <div className="mt-2 flex items-center gap-3">
              <LogoThumb
                name={formData.name || "Brand"}
                logoUrl={formData.logoUrl}
                size="lg"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 rounded-md border border-border bg-background resize-none"
              placeholder="Brand description…"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={formLoading}>
              {formLoading ? "Saving..." : "Save Brand"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* -------------------- Small bits -------------------- */

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

function LogoThumb({
  name,
  logoUrl,
  size = "md",
}: {
  name: string;
  logoUrl?: string | null;
  size?: "md" | "lg";
}) {
  const box = size === "lg" ? "w-16 h-16" : "w-12 h-12";
  const inner = size === "lg" ? "w-12 h-12" : "w-10 h-10";
  const initials =
    name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <div
      className={`${box} rounded-lg bg-background-tertiary border border-border overflow-hidden grid place-items-center`}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={name}
          className="w-full h-full object-contain p-2"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
            const sib =
              (e.currentTarget.nextElementSibling as HTMLElement) || null;
            if (sib) sib.style.display = "flex";
          }}
        />
      ) : null}
      <div
        className={`${
          logoUrl ? "hidden" : "flex"
        } ${inner} items-center justify-center`}
      >
        <HiTag className="w-5 h-5 text-foreground-light mr-1" />
        <span className="text-sm text-foreground-light">{initials}</span>
      </div>
    </div>
  );
}
