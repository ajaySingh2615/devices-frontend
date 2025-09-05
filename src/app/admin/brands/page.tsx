"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { HiPlus, HiPencil, HiTrash, HiTag } from "react-icons/hi";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { catalogApi, Brand } from "@/lib/api";

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      const data = await catalogApi.getBrands();
      setBrands(data);
    } catch (error) {
      console.error("Failed to load brands:", error);
      toast.error("Failed to load brands");
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
            Brands
          </h1>
          <p className="text-foreground-secondary">Manage product brands</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <HiPlus className="w-5 h-5 mr-2" />
          Add Brand
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingBrand) && (
        <BrandForm
          brand={editingBrand}
          onSave={(brand) => {
            if (editingBrand) {
              setBrands((prev) =>
                prev.map((b) => (b.id === brand.id ? brand : b))
              );
            } else {
              setBrands((prev) => [...prev, brand]);
            }
            setShowCreateForm(false);
            setEditingBrand(null);
            toast.success(editingBrand ? "Brand updated" : "Brand created");
          }}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingBrand(null);
          }}
        />
      )}

      {/* Brands Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.map((brand) => (
          <Card key={brand.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-background-secondary rounded-lg flex items-center justify-center">
                    {brand.logoUrl ? (
                      <img
                        src={brand.logoUrl}
                        alt={brand.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <HiTag className="w-6 h-6 text-foreground-muted" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{brand.name}</h3>
                    <p className="text-sm text-foreground-secondary">
                      {brand.slug}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    brand.isActive
                      ? "bg-secondary/10 text-secondary"
                      : "bg-error/10 text-error"
                  }`}
                >
                  {brand.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {brand.description && (
                <p className="text-sm text-foreground-muted mb-4 line-clamp-2">
                  {brand.description}
                </p>
              )}

              <div className="flex items-center justify-end space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingBrand(brand)}
                >
                  <HiPencil className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-error hover:bg-error/10"
                  onClick={() => {
                    if (
                      confirm("Are you sure you want to delete this brand?")
                    ) {
                      setBrands((prev) =>
                        prev.filter((b) => b.id !== brand.id)
                      );
                      toast.success("Brand deleted");
                    }
                  }}
                >
                  <HiTrash className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {brands.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <HiTag className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No brands found
            </h3>
            <p className="text-foreground-secondary">
              Create your first brand to get started
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface BrandFormProps {
  brand: Brand | null;
  onSave: (brand: Brand) => void;
  onCancel: () => void;
}

function BrandForm({ brand, onSave, onCancel }: BrandFormProps) {
  const [formData, setFormData] = useState({
    name: brand?.name || "",
    slug: brand?.slug || "",
    description: brand?.description || "",
    logoUrl: brand?.logoUrl || "",
    isActive: brand?.isActive ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mock save - in real app, this would call API
    const savedBrand: Brand = {
      id: brand?.id || `brand-${Date.now()}`,
      ...formData,
      createdAt: brand?.createdAt || new Date().toISOString(),
    };

    onSave(savedBrand);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{brand ? "Edit Brand" : "Create Brand"}</CardTitle>
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

          <div>
            <label className="block text-sm font-medium mb-2">Logo URL</label>
            <Input
              type="url"
              value={formData.logoUrl}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, logoUrl: e.target.value }))
              }
              placeholder="https://example.com/logo.png"
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
            <Button type="submit">{brand ? "Update" : "Create"} Brand</Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
