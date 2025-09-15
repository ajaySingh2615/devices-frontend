"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiFolder,
  HiFolderOpen,
  HiSearch,
  HiX,
} from "react-icons/hi";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  adminApi,
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "@/lib/api";

/* -------------------- Utilities -------------------- */

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function buildMaps(categories: Category[]) {
  const byId = new Map<string, Category>();
  const children = new Map<string | undefined, Category[]>();
  for (const c of categories) {
    byId.set(c.id, c);
    const key = c.parentId || undefined;
    if (!children.has(key)) children.set(key, []);
    children.get(key)!.push(c);
  }
  return { byId, children };
}

function depthOf(cat: Category, byId: Map<string, Category>) {
  let d = 0;
  let cursor = cat;
  const seen = new Set<string>(); // cycle guard
  while (
    cursor.parentId &&
    byId.has(cursor.parentId) &&
    d < 10 &&
    !seen.has(cursor.parentId)
  ) {
    seen.add(cursor.parentId);
    d++;
    cursor = byId.get(cursor.parentId)!;
  }
  return d;
}

function descendantsOf(
  id: string,
  children: Map<string | undefined, Category[]>
) {
  const out: string[] = [];
  const stack = [id];
  const childMap = new Map<string, Category[]>();
  // Normalize childMap to string keys
  for (const [k, v] of children.entries()) {
    if (k) childMap.set(k, v);
  }
  while (stack.length) {
    const cur = stack.pop()!;
    const kids = childMap.get(cur) || [];
    for (const c of kids) {
      out.push(c.id);
      stack.push(c.id);
    }
  }
  return out;
}

/* -------------------- Page -------------------- */

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | undefined>(
    undefined
  );
  const [formLoading, setFormLoading] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [parentFilter, setParentFilter] = useState<string>("");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await adminApi.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const { byId, children } = useMemo(() => buildMaps(categories), [categories]);

  const stats = useMemo(() => {
    const roots = categories.filter((c) => !c.parentId).length;
    return { total: categories.length, roots, subs: categories.length - roots };
  }, [categories]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    // When a specific parent is selected, include that category and all its descendants
    let allowedIds: Set<string> | null = null;
    if (parentFilter && parentFilter !== "__root__") {
      const ids = [parentFilter, ...descendantsOf(parentFilter, children)];
      allowedIds = new Set(ids);
    }

    return categories
      .filter((c) => {
        const matchesSearch =
          !q ||
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q);

        let matchesParent = true;
        if (parentFilter) {
          if (parentFilter === "__root__") {
            matchesParent = !c.parentId;
          } else if (allowedIds) {
            matchesParent = allowedIds.has(c.id);
          }
        }
        return matchesSearch && matchesParent;
      })
      .sort((a, b) => {
        // primary: sortOrder, secondary: name
        if ((a.sortOrder ?? 0) !== (b.sortOrder ?? 0))
          return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        return a.name.localeCompare(b.name);
      });
  }, [categories, search, parentFilter, children]);

  const startCreate = (parentId?: string) => {
    setEditingCategory(null);
    setDefaultParentId(parentId);
    setShowForm(true);
  };

  const handleSave = async () => {
    setShowForm(false);
    setEditingCategory(null);
    setDefaultParentId(undefined);
    await loadCategories(); // Reload to get fresh data
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setDefaultParentId(undefined);
    setShowForm(true);
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Delete category "${category.name}"?`)) return;
    try {
      await adminApi.deleteCategory(category.id);
      toast.success("Category deleted");
      await loadCategories();
    } catch (error: any) {
      console.error("Failed to delete category:", error);
      toast.error(
        error?.response?.data?.message || "Failed to delete category"
      );
    }
  };

  const handleToggleStatus = async (category: Category) => {
    try {
      const newStatus = !category.isActive;
      await adminApi.updateCategory(category.id, { isActive: newStatus });
      toast.success(`Category ${newStatus ? "activated" : "deactivated"}`);
      await loadCategories();
    } catch (error: any) {
      console.error("Failed to update category status:", error);
      toast.error("Failed to update category status");
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
            Categories
          </h1>
          <p className="text-sm text-foreground-muted">
            Manage product categories and hierarchy
          </p>
        </div>
        <Button onClick={() => startCreate()}>
          <HiPlus className="w-5 h-5 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Root" value={stats.roots} />
        <StatCard label="Subcategories" value={stats.subs} />
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
              <label className="block text-sm font-medium mb-2">Parent</label>
              <select
                value={parentFilter}
                onChange={(e) => setParentFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-border bg-background"
              >
                <option value="">All</option>
                <option value="__root__">Root categories</option>
                {categories
                  .filter((c) => !c.parentId)
                  .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      {showForm && (
        <CategoryForm
          categories={categories}
          category={editingCategory || undefined}
          defaultParentId={defaultParentId}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingCategory(null);
            setDefaultParentId(undefined);
          }}
          formLoading={formLoading}
          setFormLoading={setFormLoading}
        />
      )}

      {/* List */}
      <Card className="shadow-sm">
        <CardHeader className="border-b border-border p-4 sm:p-5">
          <CardTitle className="text-lg">
            Categories{" "}
            <span className="text-foreground-light">({filtered.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-w-full">
            <table className="min-w-[980px] w-full text-[13px] leading-5">
              <thead className="bg-surface sticky top-0 z-10 border-b border-border">
                <tr className="text-left">
                  {[
                    "Name",
                    "Slug",
                    "Parent",
                    "Description",
                    "Status",
                    "Sort",
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
                {filtered.map((category) => {
                  const parent = categories.find(
                    (c) => c.id === category.parentId
                  );
                  const d = depthOf(category, byId);
                  return (
                    <tr
                      key={category.id}
                      className="hover:bg-background-secondary/70"
                    >
                      {/* Name (indented) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block"
                            style={{ paddingLeft: d * 12 }}
                            aria-hidden
                          />
                          {category.parentId ? (
                            <HiFolder className="w-5 h-5 text-accent" />
                          ) : (
                            <HiFolderOpen className="w-5 h-5 text-primary" />
                          )}
                          <span className="font-medium">{category.name}</span>
                          {!category.isActive && (
                            <span className="ml-2 text-[11px] px-1.5 py-0.5 rounded border border-error/20 bg-error/10 text-error">
                              Inactive
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="py-3 px-4">
                        <code className="text-[12px] bg-background-tertiary px-2 py-0.5 rounded border border-border">
                          {category.slug}
                        </code>
                      </td>

                      {/* Parent */}
                      <td className="py-3 px-4">
                        {parent ? (
                          <span className="text-foreground-secondary">
                            {parent.name}
                          </span>
                        ) : (
                          <span className="text-foreground-light">Root</span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4">
                        <span className="text-foreground-secondary line-clamp-2">
                          {category.description || "—"}
                        </span>
                      </td>

                      {/* Status toggle */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(category)}
                          className={[
                            "px-2 py-1 rounded-full text-xs font-medium border transition-colors",
                            category.isActive
                              ? "bg-secondary/10 text-secondary border-secondary/20 hover:bg-secondary/20"
                              : "bg-error/10 text-error border-error/20 hover:bg-error/20",
                          ].join(" ")}
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>

                      {/* Sort */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {category.sortOrder ?? 0}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Edit"
                            onClick={() => handleEdit(category)}
                          >
                            <HiPencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Add Subcategory"
                            onClick={() => startCreate(category.id)}
                          >
                            <HiPlus className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-error hover:bg-error/10"
                            title="Delete"
                            onClick={() => handleDelete(category)}
                          >
                            <HiTrash className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="py-16 px-6 text-center">
                <div className="text-sm text-foreground-muted">
                  No categories match your filters.
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

function CategoryForm({
  category,
  categories,
  defaultParentId,
  onSave,
  onCancel,
  formLoading,
  setFormLoading,
}: {
  category?: Category;
  categories: Category[];
  defaultParentId?: string;
  onSave: (category: Category) => void;
  onCancel: () => void;
  formLoading: boolean;
  setFormLoading: (b: boolean) => void;
}) {
  const [formData, setFormData] = useState({
    name: category?.name || "",
    slug: category?.slug || "",
    description: category?.description || "",
    sortOrder: category?.sortOrder ?? 0,
    parentId: category?.parentId || defaultParentId || "",
  });

  const [slugEdited, setSlugEdited] = useState<boolean>(!!category); // editing: preserve slug

  // Auto-generate slug from name (only if user hasn't edited it)
  useEffect(() => {
    if (!slugEdited && !category) {
      setFormData((prev) => ({ ...prev, slug: slugify(prev.name) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.name]);

  // prevent selecting self or descendants as parent
  const { children } = useMemo(() => buildMaps(categories), [categories]);

  const blockedParentIds = useMemo(() => {
    if (!category) return new Set<string>();
    return new Set([category.id, ...descendantsOf(category.id, children)]);
  }, [category, children]);

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
    const dupe = categories.find(
      (c) =>
        c.slug.toLowerCase() === formData.slug.toLowerCase() &&
        c.id !== category?.id
    );
    if (dupe) {
      toast.error("Slug already exists. Choose a unique slug.");
      return false;
    }
    if (
      category &&
      formData.parentId &&
      blockedParentIds.has(formData.parentId)
    ) {
      toast.error("Invalid parent: cannot set to itself or its descendant.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setFormLoading(true);
    try {
      let saved: Category;
      if (category) {
        const updateData: UpdateCategoryRequest = {
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
          sortOrder: formData.sortOrder,
          parentId: formData.parentId || undefined,
        };
        saved = await adminApi.updateCategory(category.id, updateData);
        toast.success("Category updated");
      } else {
        const createData: CreateCategoryRequest = {
          name: formData.name,
          slug: formData.slug,
          description: formData.description || undefined,
          sortOrder: formData.sortOrder,
          parentId: formData.parentId || undefined,
        };
        saved = await adminApi.createCategory(createData);
        toast.success("Category created");
      }
      onSave(saved);
    } catch (error: any) {
      console.error("Failed to save category:", error);
      toast.error(error?.response?.data?.message || "Failed to save category");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b border-border p-4 sm:p-5">
        <CardTitle className="text-lg">
          {category ? "Edit Category" : "Add Category"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Category Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter category name"
                required
              />
              <p className="text-[12px] text-foreground-light mt-1">
                Keep names concise and consistent (e.g., “Laptops”, “Mobiles”)
              </p>
            </div>

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
                placeholder="category-url-slug"
                required
                pattern="^[a-z0-9-]+$"
                title="Only lowercase letters, numbers and hyphens"
              />
              <div className="text-[12px] text-foreground-light mt-1 font-mono">
                /c/{formData.slug || "your-slug"}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Parent Category
            </label>
            <select
              value={formData.parentId}
              onChange={(e) =>
                setFormData({ ...formData, parentId: e.target.value })
              }
              className="w-full px-3 py-2 rounded-md border border-border bg-background"
            >
              <option value="">No Parent (Root)</option>
              {categories
                .filter((c) => !blockedParentIds.has(c.id))
                .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>

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
              placeholder="Category description…"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Sort Order</label>
            <Input
              type="number"
              value={formData.sortOrder}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  sortOrder: parseInt(e.target.value || "0"),
                })
              }
              placeholder="0"
            />
            <p className="text-[12px] text-foreground-light mt-1">
              Lower numbers appear first.
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={formLoading}>
              {formLoading ? "Saving..." : "Save Category"}
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
