"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { HiPlus, HiPencil, HiTrash, HiFolderOpen } from "react-icons/hi";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { catalogApi, Category } from "@/lib/api";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await catalogApi.getCategoryTree();
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
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
          <p className="text-foreground-secondary">Manage product categories</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <HiPlus className="w-5 h-5 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingCategory) && (
        <CategoryForm
          category={editingCategory}
          categories={categories}
          onSave={(category) => {
            // Add to categories list
            if (editingCategory) {
              setCategories((prev) =>
                prev.map((c) => (c.id === category.id ? category : c))
              );
            } else {
              setCategories((prev) => [...prev, category]);
            }
            setShowCreateForm(false);
            setEditingCategory(null);
            toast.success(
              editingCategory ? "Category updated" : "Category created"
            );
          }}
          onCancel={() => {
            setShowCreateForm(false);
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
          <div className="space-y-2">
            {categories.map((category) => (
              <CategoryItem
                key={category.id}
                category={category}
                onEdit={setEditingCategory}
                onDelete={(id) => {
                  if (
                    confirm("Are you sure you want to delete this category?")
                  ) {
                    setCategories((prev) => prev.filter((c) => c.id !== id));
                    toast.success("Category deleted");
                  }
                }}
              />
            ))}

            {categories.length === 0 && (
              <div className="text-center py-8 text-foreground-secondary">
                No categories found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface CategoryItemProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  level?: number;
}

function CategoryItem({
  category,
  onEdit,
  onDelete,
  level = 0,
}: CategoryItemProps) {
  return (
    <div>
      <div
        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-background-secondary"
        style={{ marginLeft: `${level * 20}px` }}
      >
        <div className="flex items-center space-x-3">
          <HiFolderOpen className="w-5 h-5 text-primary" />
          <div>
            <div className="font-medium">{category.name}</div>
            <div className="text-sm text-foreground-secondary">
              {category.slug}
            </div>
            {category.description && (
              <div className="text-sm text-foreground-muted mt-1">
                {category.description}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              category.isActive
                ? "bg-secondary/10 text-secondary"
                : "bg-error/10 text-error"
            }`}
          >
            {category.isActive ? "Active" : "Inactive"}
          </span>

          <Button variant="ghost" size="sm" onClick={() => onEdit(category)}>
            <HiPencil className="w-4 h-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-error hover:bg-error/10"
            onClick={() => onDelete(category.id)}
          >
            <HiTrash className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Render children */}
      {category.children?.map((child) => (
        <CategoryItem
          key={child.id}
          category={child}
          onEdit={onEdit}
          onDelete={onDelete}
          level={level + 1}
        />
      ))}
    </div>
  );
}

interface CategoryFormProps {
  category: Category | null;
  categories: Category[];
  onSave: (category: Category) => void;
  onCancel: () => void;
}

function CategoryForm({
  category,
  categories,
  onSave,
  onCancel,
}: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: category?.name || "",
    slug: category?.slug || "",
    description: category?.description || "",
    parentId: category?.parentId || "",
    sortOrder: category?.sortOrder || 0,
    isActive: category?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mock save - in real app, this would call API
    const savedCategory: Category = {
      id: category?.id || `cat-${Date.now()}`,
      ...formData,
      children: category?.children || [],
      createdAt: category?.createdAt || new Date().toISOString(),
    };

    onSave(savedCategory);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{category ? "Edit Category" : "Create Category"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Slug</label>
              <Input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, slug: e.target.value }))
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Parent Category
              </label>
              <select
                value={formData.parentId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, parentId: e.target.value }))
                }
                className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface"
              >
                <option value="">No Parent (Root Category)</option>
                {categories
                  .filter((c) => c.id !== category?.id)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Sort Order
              </label>
              <Input
                type="number"
                value={formData.sortOrder}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    sortOrder: parseInt(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
              }
              className="rounded"
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              Active
            </label>
          </div>

          <div className="flex items-center space-x-4">
            <Button type="submit">
              {category ? "Update" : "Create"} Category
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
