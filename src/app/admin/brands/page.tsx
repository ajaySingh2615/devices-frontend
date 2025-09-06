"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { HiPlus, HiPencil, HiTrash, HiTag, HiPhotograph } from "react-icons/hi";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  adminApi,
  Brand,
  CreateBrandRequest,
  UpdateBrandRequest,
} from "@/lib/api";

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formLoading, setFormLoading] = useState(false);

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

  const BrandForm = ({
    brand,
    onSave,
    onCancel,
  }: {
    brand?: Brand;
    onSave: (brand: Brand) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState({
      name: brand?.name || "",
      slug: brand?.slug || "",
      description: brand?.description || "",
      logoUrl: brand?.logoUrl || "",
    });

    // Auto-generate slug from name
    useEffect(() => {
      if (formData.name && !brand) {
        const slug = formData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        setFormData((prev) => ({ ...prev, slug }));
      }
    }, [formData.name, brand]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setFormLoading(true);

      try {
        let savedBrand: Brand;

        if (brand) {
          // Update existing brand
          const updateData: UpdateBrandRequest = {
            name: formData.name,
            slug: formData.slug,
            description: formData.description || undefined,
            logoUrl: formData.logoUrl || undefined,
          };
          savedBrand = await adminApi.updateBrand(brand.id, updateData);
          toast.success("Brand updated successfully");
        } else {
          // Create new brand
          const createData: CreateBrandRequest = {
            name: formData.name,
            slug: formData.slug,
            description: formData.description || undefined,
            logoUrl: formData.logoUrl || undefined,
          };
          savedBrand = await adminApi.createBrand(createData);
          toast.success("Brand created successfully");
        }

        onSave(savedBrand);
      } catch (error: any) {
        console.error("Failed to save brand:", error);
        toast.error(error?.response?.data?.message || "Failed to save brand");
      } finally {
        setFormLoading(false);
      }
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>{brand ? "Edit" : "Add"} Brand</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Brand Name *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter brand name"
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
                  placeholder="brand-url-slug"
                  required
                />
              </div>
            </div>

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
              <p className="text-sm text-foreground-secondary mt-1">
                Direct URL to brand logo image
              </p>
              {formData.logoUrl && (
                <div className="mt-2">
                  <img
                    src={formData.logoUrl}
                    alt="Logo preview"
                    className="w-16 h-16 object-contain border border-border rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
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
                placeholder="Brand description..."
              />
            </div>

            <div className="flex space-x-2">
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
  };

  const handleSave = async (brand: Brand) => {
    setShowForm(false);
    setEditingBrand(null);
    await loadBrands(); // Reload to get updated data
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setShowForm(true);
  };

  const handleDelete = async (brand: Brand) => {
    if (confirm(`Are you sure you want to delete "${brand.name}"?`)) {
      try {
        // Note: Delete endpoint not implemented in backend yet
        toast.error("Delete functionality not implemented yet");
        // await adminApi.deleteBrand(brand.id);
        // toast.success("Brand deleted successfully");
        // await loadBrands();
      } catch (error: any) {
        console.error("Failed to delete brand:", error);
        toast.error(error?.response?.data?.message || "Failed to delete brand");
      }
    }
  };

  const handleToggleStatus = async (brand: Brand) => {
    try {
      const newStatus = !brand.isActive;
      await adminApi.updateBrand(brand.id, {
        isActive: newStatus,
      });
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">
            Brands
          </h1>
          <p className="text-foreground-secondary">
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

      {/* Form */}
      {showForm && (
        <BrandForm
          brand={editingBrand || undefined}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingBrand(null);
          }}
        />
      )}

      {/* Brands List */}
      <Card>
        <CardHeader>
          <CardTitle>Brands ({brands.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">Brand</th>
                  <th className="text-left py-3 px-4 font-medium">Slug</th>
                  <th className="text-left py-3 px-4 font-medium">
                    Description
                  </th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => (
                  <tr
                    key={brand.id}
                    className="border-b border-border hover:bg-background-secondary"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-background-secondary rounded-lg flex items-center justify-center border border-border">
                          {brand.logoUrl ? (
                            <img
                              src={brand.logoUrl}
                              alt={brand.name}
                              className="w-10 h-10 object-contain"
                              onError={(e) => {
                                (
                                  e.currentTarget as HTMLImageElement
                                ).style.display = "none";
                                const nextElement = e.currentTarget
                                  .nextElementSibling as HTMLElement;
                                if (nextElement)
                                  nextElement.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className={`${
                              brand.logoUrl ? "hidden" : "flex"
                            } items-center justify-center w-10 h-10`}
                          >
                            <HiTag className="w-6 h-6 text-foreground-muted" />
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">{brand.name}</div>
                          <div className="text-sm text-foreground-secondary">
                            {new Date(brand.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <code className="text-sm bg-background-secondary px-2 py-1 rounded">
                        {brand.slug}
                      </code>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-foreground-secondary">
                        {brand.description || "No description"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleToggleStatus(brand)}
                        className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                          brand.isActive
                            ? "bg-secondary/10 text-secondary hover:bg-secondary/20"
                            : "bg-error/10 text-error hover:bg-error/20"
                        }`}
                      >
                        {brand.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(brand)}
                        >
                          <HiPencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-error hover:bg-error/10"
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

            {brands.length === 0 && (
              <div className="text-center py-8 text-foreground-secondary">
                No brands found. Create your first brand to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
