"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { HiArrowLeft, HiPlus, HiTrash } from "react-icons/hi";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  adminApi,
  catalogApi,
  Category,
  Brand,
  ConditionGrade,
} from "@/lib/api";

const conditionGrades: {
  value: ConditionGrade;
  label: string;
  description: string;
}[] = [
  {
    value: "A",
    label: "Grade A",
    description: "Excellent condition, like new",
  },
  { value: "B", label: "Grade B", description: "Good condition, minor wear" },
  { value: "C", label: "Grade C", description: "Fair condition, visible wear" },
];

interface ProductFormData {
  categoryId: string;
  brandId: string;
  title: string;
  slug: string;
  description: string;
  conditionGrade: ConditionGrade;
  warrantyMonths: number;
}

interface VariantFormData {
  sku: string;
  mpn: string;
  color: string;
  storageGb: number | null;
  ramGb: number | null;
  priceMrp: number;
  priceSale: number;
  taxRate: number;
  weightGrams: number | null;
  quantity: number;
  safetyStock: number;
}

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [productData, setProductData] = useState<ProductFormData>({
    categoryId: "",
    brandId: "",
    title: "",
    slug: "",
    description: "",
    conditionGrade: "A",
    warrantyMonths: 6,
  });

  const [variants, setVariants] = useState<VariantFormData[]>([
    {
      sku: "",
      mpn: "",
      color: "",
      storageGb: null,
      ramGb: null,
      priceMrp: 0,
      priceSale: 0,
      taxRate: 18,
      weightGrams: null,
      quantity: 0,
      safetyStock: 5,
    },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Auto-generate slug from title
    if (productData.title && !productData.slug.includes(" ")) {
      const slug = productData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setProductData((prev) => ({ ...prev, slug }));
    }
  }, [productData.title]);

  const loadData = async () => {
    try {
      const [categoriesData, brandsData] = await Promise.all([
        catalogApi.getCategories(), // Use public API to get only active categories
        catalogApi.getBrands(), // Use public API to get only active brands
      ]);

      setCategories(categoriesData);
      setBrands(brandsData);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load categories and brands");
    } finally {
      setLoadingData(false);
    }
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      {
        sku: "",
        mpn: "",
        color: "",
        storageGb: null,
        ramGb: null,
        priceMrp: 0,
        priceSale: 0,
        taxRate: 18,
        weightGrams: null,
        quantity: 0,
        safetyStock: 5,
      },
    ]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const updateVariant = (
    index: number,
    field: keyof VariantFormData,
    value: any
  ) => {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productData.categoryId || !productData.brandId || !productData.title) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (variants.some((v) => !v.sku || v.priceMrp <= 0 || v.priceSale <= 0)) {
      toast.error("Please fill in all variant details");
      return;
    }

    setLoading(true);

    try {
      // Create product
      const product = await adminApi.createProduct(productData);

      // Create variants
      for (const variantData of variants) {
        const variant = await adminApi.addVariant(product.id, {
          sku: variantData.sku,
          mpn: variantData.mpn,
          color: variantData.color,
          storageGb: variantData.storageGb || undefined,
          ramGb: variantData.ramGb || undefined,
          priceMrp: variantData.priceMrp,
          priceSale: variantData.priceSale,
          taxRate: variantData.taxRate,
          weightGrams: variantData.weightGrams || undefined,
        });

        // Update inventory
        await adminApi.updateInventory(variant.id, {
          quantity: variantData.quantity,
          safetyStock: variantData.safetyStock,
          reserved: 0,
        });
      }

      toast.success("Product created successfully!");
      router.push("/admin/products");
    } catch (error: any) {
      console.error("Failed to create product:", error);
      toast.error(error?.response?.data?.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/admin/products">
          <Button variant="ghost" size="sm">
            <HiArrowLeft className="w-5 h-5 mr-2" />
            Back to Products
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">
            Create Product
          </h1>
          <p className="text-foreground-secondary">
            Add a new product to your catalog
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Details */}
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Category *
                </label>
                <select
                  value={productData.categoryId}
                  onChange={(e) =>
                    setProductData({
                      ...productData,
                      categoryId: e.target.value,
                    })
                  }
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Brand *
                </label>
                <select
                  value={productData.brandId}
                  onChange={(e) =>
                    setProductData({ ...productData, brandId: e.target.value })
                  }
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface"
                  required
                >
                  <option value="">Select Brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Product Title *
              </label>
              <Input
                type="text"
                value={productData.title}
                onChange={(e) =>
                  setProductData({ ...productData, title: e.target.value })
                }
                placeholder="Enter product title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                URL Slug *
              </label>
              <Input
                type="text"
                value={productData.slug}
                onChange={(e) =>
                  setProductData({ ...productData, slug: e.target.value })
                }
                placeholder="product-url-slug"
                required
              />
              <p className="text-sm text-foreground-secondary mt-1">
                This will be used in the product URL
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                value={productData.description}
                onChange={(e) =>
                  setProductData({
                    ...productData,
                    description: e.target.value,
                  })
                }
                rows={4}
                className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface resize-none"
                placeholder="Product description..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Condition Grade *
                </label>
                <select
                  value={productData.conditionGrade}
                  onChange={(e) =>
                    setProductData({
                      ...productData,
                      conditionGrade: e.target.value as ConditionGrade,
                    })
                  }
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface"
                  required
                >
                  {conditionGrades.map((grade) => (
                    <option key={grade.value} value={grade.value}>
                      {grade.label} - {grade.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Warranty (Months)
                </label>
                <Input
                  type="number"
                  value={productData.warrantyMonths}
                  onChange={(e) =>
                    setProductData({
                      ...productData,
                      warrantyMonths: parseInt(e.target.value),
                    })
                  }
                  min="0"
                  max="60"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Variants */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Product Variants</CardTitle>
            <Button type="button" variant="outline" onClick={addVariant}>
              <HiPlus className="w-4 h-4 mr-2" />
              Add Variant
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {variants.map((variant, index) => (
              <div
                key={index}
                className="p-4 border border-border rounded-lg space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Variant {index + 1}</h4>
                  {variants.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariant(index)}
                      className="text-error hover:bg-error/10"
                    >
                      <HiTrash className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      SKU *
                    </label>
                    <Input
                      type="text"
                      value={variant.sku}
                      onChange={(e) =>
                        updateVariant(index, "sku", e.target.value)
                      }
                      placeholder="PROD-001"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Color
                    </label>
                    <Input
                      type="text"
                      value={variant.color}
                      onChange={(e) =>
                        updateVariant(index, "color", e.target.value)
                      }
                      placeholder="Black"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      MPN
                    </label>
                    <Input
                      type="text"
                      value={variant.mpn}
                      onChange={(e) =>
                        updateVariant(index, "mpn", e.target.value)
                      }
                      placeholder="Manufacturer part number"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Storage (GB)
                    </label>
                    <Input
                      type="number"
                      value={variant.storageGb || ""}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          "storageGb",
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      placeholder="128"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      RAM (GB)
                    </label>
                    <Input
                      type="number"
                      value={variant.ramGb || ""}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          "ramGb",
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      placeholder="8"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      MRP *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={variant.priceMrp || ""}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          "priceMrp",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="29999.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Sale Price *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={variant.priceSale || ""}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          "priceSale",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="24999.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Tax Rate (%)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={variant.taxRate || ""}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          "taxRate",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="18.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Weight (Grams)
                    </label>
                    <Input
                      type="number"
                      value={variant.weightGrams || ""}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          "weightGrams",
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      placeholder="500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Initial Stock
                    </label>
                    <Input
                      type="number"
                      value={variant.quantity || ""}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          "quantity",
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Safety Stock
                    </label>
                    <Input
                      type="number"
                      value={variant.safetyStock || ""}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          "safetyStock",
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="5"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end space-x-4">
          <Link href="/admin/products">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
