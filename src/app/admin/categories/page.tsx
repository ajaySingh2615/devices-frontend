"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiFolder,
  HiFolderOpen,
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

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formLoading, setFormLoading] = useState(false);

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

  const CategoryForm = ({
    category,
    onSave,
    onCancel,
  }: {
    category?: Category;
    onSave: (category: Category) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState({
      name: category?.name || "",
      slug: category?.slug || "",
      description: category?.description || "",
      sortOrder: category?.sortOrder || 0,
      parentId: category?.parentId || "",
    });

    // Auto-generate slug from name
    useEffect(() => {
      if (formData.name && !category) {
        const slug = formData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        setFormData((prev) => ({ ...prev, slug }));
      }
    }, [formData.name, category]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setFormLoading(true);

      try {
        let savedCategory: Category;

        if (category) {
          // Update existing category
          const updateData: UpdateCategoryRequest = {
            name: formData.name,
            slug: formData.slug,
            description: formData.description || undefined,
            sortOrder: formData.sortOrder,
            parentId: formData.parentId || undefined,
          };
          savedCategory = await adminApi.updateCategory(
            category.id,
            updateData
          );
          toast.success("Category updated successfully");
        } else {
          // Create new category
          const createData: CreateCategoryRequest = {
            name: formData.name,
            slug: formData.slug,
            description: formData.description || undefined,
            sortOrder: formData.sortOrder,
            parentId: formData.parentId || undefined,
          };
          savedCategory = await adminApi.createCategory(createData);
          toast.success("Category created successfully");
        }

        onSave(savedCategory);
      } catch (error: any) {
        console.error("Failed to save category:", error);
        toast.error(
          error?.response?.data?.message || "Failed to save category"
        );
      } finally {
        setFormLoading(false);
      }
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>{category ? "Edit" : "Add"} Category</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category Name *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter category name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  URL Slug *
                </label>
                <Input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  placeholder="category-url-slug"
                  required
                />
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
                className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface"
              >
                <option value="">No Parent (Root Category)</option>
                {categories
                  .filter((c) => c.id !== category?.id) // Don't allow self as parent
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
                className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface resize-none"
                placeholder="Category description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Sort Order
              </label>
              <Input
                type="number"
                value={formData.sortOrder}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sortOrder: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
              <p className="text-sm text-foreground-secondary mt-1">
                Lower numbers appear first
              </p>
            </div>

            <div className="flex space-x-2">
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
  };

  const handleSave = async (category: Category) => {
    setShowForm(false);
    setEditingCategory(null);
    await loadCategories(); // Reload to get updated data
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = async (category: Category) => {
    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      try {
        await adminApi.deleteCategory(category.id);
        toast.success("Category deleted successfully");
        await loadCategories();
      } catch (error: any) {
        console.error("Failed to delete category:", error);
        toast.error(
          error?.response?.data?.message || "Failed to delete category"
        );
      }
    }
  };

  const handleToggleStatus = async (category: Category) => {
    try {
      const newStatus = !category.isActive;
      await adminApi.updateCategory(category.id, {
        isActive: newStatus,
      });
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">
            Categories
          </h1>
          <p className="text-foreground-secondary">
            Manage product categories and hierarchy
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingCategory(null);
            setShowForm(true);
          }}
        >
          <HiPlus className="w-5 h-5 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <CategoryForm
          category={editingCategory || undefined}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingCategory(null);
          }}
        />
      )}

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>Categories ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Slug</th>
                  <th className="text-left py-3 px-4 font-medium">Parent</th>
                  <th className="text-left py-3 px-4 font-medium">
                    Description
                  </th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Sort</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => {
                  const parentCategory = categories.find(
                    (c) => c.id === category.parentId
                  );

                  return (
                    <tr
                      key={category.id}
                      className="border-b border-border hover:bg-background-secondary"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          {category.parentId ? (
                            <HiFolder className="w-5 h-5 text-accent" />
                          ) : (
                            <HiFolderOpen className="w-5 h-5 text-primary" />
                          )}
                          <span className="font-medium">{category.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <code className="text-sm bg-background-secondary px-2 py-1 rounded">
                          {category.slug}
                        </code>
                      </td>
                      <td className="py-4 px-4">
                        {parentCategory ? (
                          <span className="text-sm text-foreground-secondary">
                            {parentCategory.name}
                          </span>
                        ) : (
                          <span className="text-sm text-foreground-muted">
                            Root
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-foreground-secondary">
                          {category.description || "No description"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleToggleStatus(category)}
                          className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            category.isActive
                              ? "bg-secondary/10 text-secondary hover:bg-secondary/20"
                              : "bg-error/10 text-error hover:bg-error/20"
                          }`}
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm">{category.sortOrder}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(category)}
                          >
                            <HiPencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-error hover:bg-error/10"
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

            {categories.length === 0 && (
              <div className="text-center py-8 text-foreground-secondary">
                No categories found. Create your first category to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
