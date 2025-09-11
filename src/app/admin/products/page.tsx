"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiEye,
  HiSearch,
  HiX,
} from "react-icons/hi";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { adminApi, Product, Category, Brand } from "@/lib/api";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData, brandsData] = await Promise.all([
        adminApi.getAllProducts(),
        adminApi.getCategories(),
        adminApi.getBrands(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setBrands(brandsData);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      const newStatus = !product.isActive;
      await adminApi.updateProduct(product.id, { isActive: newStatus });
      toast.success(`Product ${newStatus ? "activated" : "deactivated"}`);
      await loadData();
    } catch (error: any) {
      toast.error(
        `Failed to update product status: ${
          error?.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Delete "${product.title}"?`)) return;
    // Not implemented yet:
    toast.error("Delete functionality not implemented yet");
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedBrand("");
    setSelectedCategory("");
  };

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q);
      const catSlug = categories.find((c) => c.id === p.categoryId)?.slug;
      const brandSlug = brands.find((b) => b.id === p.brandId)?.slug;
      const matchesCategory = !selectedCategory || catSlug === selectedCategory;
      const matchesBrand = !selectedBrand || brandSlug === selectedBrand;
      return matchesSearch && matchesCategory && matchesBrand;
    });
  }, [
    products,
    categories,
    brands,
    searchQuery,
    selectedCategory,
    selectedBrand,
  ]);

  const stats = useMemo(() => {
    const active = products.filter((p) => p.isActive).length;
    return {
      total: products.length,
      active,
      inactive: products.length - active,
    };
  }, [products]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-5 min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Products
          </h1>
          <p className="text-sm text-foreground-muted">
            Manage your product catalog
          </p>
        </div>
        <Link href="/admin/products/new">
          <Button className="self-start sm:self-auto">
            <HiPlus className="w-5 h-5 mr-2" />
            Add Product
          </Button>
        </Link>
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
                  type="text"
                  placeholder="Search by title or slug…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-background-tertiary"
                  >
                    <HiX className="w-4 h-4 text-foreground-light" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-border bg-background"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Brand</label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-border bg-background"
              >
                <option value="">All Brands</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.slug}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="shadow-sm">
        <CardHeader className="border-b border-border p-4 sm:p-5">
          <CardTitle className="text-lg">
            Products{" "}
            <span className="text-foreground-light">
              ({filteredProducts.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <SkeletonTable />
          ) : (
            <div className="overflow-x-auto max-w-full">
              <table className="min-w-[980px] w-full text-[13px] leading-5">
                <thead className="bg-surface sticky top-0 z-10 border-b border-border">
                  <tr className="text-left">
                    {[
                      "Product",
                      "Category",
                      "Brand",
                      "Condition",
                      "Status",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="py-3 px-4 text-[11px] font-semibold uppercase tracking-wider text-foreground-light"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-background-secondary/70"
                    >
                      {/* Product */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-lg bg-background-tertiary border border-border overflow-hidden shrink-0">
                            {product.images?.[0]?.url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.images[0].url}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full grid place-items-center text-foreground-light">
                                📦
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium truncate max-w-[520px]">
                              {product.title}
                            </div>
                            <div className="text-[12px] text-foreground-light truncate max-w-[520px]">
                              {product.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {categories.find((c) => c.id === product.categoryId)
                          ?.name || "N/A"}
                      </td>

                      {/* Brand */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {brands.find((b) => b.id === product.brandId)?.name ||
                          "N/A"}
                      </td>

                      {/* Condition */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <Badge className={gradeBadge(product.conditionGrade)}>
                          {`Grade ${product.conditionGrade || "—"}`}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(product)}
                          className={[
                            "px-2 py-1 rounded-full text-xs font-medium border transition-colors",
                            product.isActive
                              ? "bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20"
                              : "bg-error/10 text-error border-error/20 hover:bg-error/20",
                          ].join(" ")}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <Link href={`/products/${product.slug}`}>
                            <Button variant="ghost" size="sm" title="View">
                              <HiEye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <Button variant="ghost" size="sm" title="Edit">
                              <HiPencil className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-error hover:bg-error/10"
                            title="Delete"
                            onClick={() => handleDeleteProduct(product)}
                          >
                            <HiTrash className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredProducts.length === 0 && !loading && (
                <div className="py-16 px-6 text-center space-y-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-background-tertiary border border-border grid place-items-center">
                    <HiSearch className="h-6 w-6 text-foreground-light" />
                  </div>
                  <h3 className="text-base font-semibold">No products found</h3>
                  <p className="text-sm text-foreground-muted">
                    Try clearing filters or search.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ——— Small helpers ——— */

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

function SkeletonTable() {
  return (
    <div className="p-4">
      <div className="h-4 w-40 bg-background-tertiary rounded animate-pulse" />
      <div className="mt-4 border border-border rounded-md overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-6 gap-2 px-4 py-3 border-b border-border bg-background animate-pulse"
          >
            {[120, 120, 100, 80, 80, 120].map((w, j) => (
              <div
                key={j}
                className="h-3 rounded bg-background-tertiary"
                style={{ width: w }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function gradeBadge(grade?: string) {
  const g = (grade || "").toUpperCase();
  if (g === "A")
    return "border bg-secondary/10 text-secondary border-secondary/20";
  if (g === "B") return "border bg-warning/10 text-warning border-warning/20";
  if (g === "C") return "border bg-accent/10 text-accent border-accent/20";
  return "border bg-background-tertiary text-foreground-secondary border-border";
}
