"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { HiArrowLeft } from "react-icons/hi";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  adminApi,
  catalogApi,
  Category,
  Brand,
  Product,
  ProductVariant,
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
  isActive: boolean;
}

interface VariantFormData {
  id?: string; // For existing variants
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
  isActive: boolean;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [variants, setVariants] = useState<VariantFormData[]>([]);

  const [productData, setProductData] = useState<ProductFormData>({
    categoryId: "",
    brandId: "",
    title: "",
    slug: "",
    description: "",
    conditionGrade: "A",
    warrantyMonths: 6,
    isActive: true,
  });

  useEffect(() => {
    loadData();
  }, [productId]);

  useEffect(() => {
    if (product) {
      setProductData({
        categoryId: product.categoryId,
        brandId: product.brandId,
        title: product.title,
        slug: product.slug,
        description: product.description || "",
        conditionGrade: product.conditionGrade,
        warrantyMonths: product.warrantyMonths,
        isActive: product.isActive,
      });

      // Load variants if available
      if (product.variants && product.variants.length > 0) {
        const variantData = product.variants.map((variant) => ({
          id: variant.id,
          sku: variant.sku,
          mpn: variant.mpn || "",
          color: variant.color || "",
          storageGb: variant.storageGb ?? null,
          ramGb: variant.ramGb ?? null,
          priceMrp: variant.priceMrp,
          priceSale: variant.priceSale,
          taxRate: variant.taxRate,
          weightGrams: variant.weightGrams ?? null,
          quantity: variant.inventory?.quantity || 0, // Load actual inventory quantity
          safetyStock: variant.inventory?.safetyStock || 5, // Load actual safety stock
          isActive: variant.isActive,
        }));
        setVariants(variantData);
      } else {
        // Create default variant if none exist
        setVariants([
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
            isActive: true,
          },
        ]);
      }
    }
  }, [product]);

  const loadData = async () => {
    try {
      const [productData, categoriesData, brandsData] = await Promise.all([
        adminApi.getProductById(productId), // Use admin API to get product by ID
        catalogApi.getCategories(), // Use public API to get only active categories
        catalogApi.getBrands(), // Use public API to get only active brands
      ]);

      setProduct(productData);
      setCategories(categoriesData);
      setBrands(brandsData);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load product data");
      router.push("/admin/products");
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
        isActive: true,
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
    const updatedVariants = [...variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setVariants(updatedVariants);
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
      // Update product basic information
      await adminApi.updateProduct(productId, {
        categoryId: productData.categoryId,
        brandId: productData.brandId,
        title: productData.title,
        slug: productData.slug,
        description: productData.description,
        conditionGrade: productData.conditionGrade,
        warrantyMonths: productData.warrantyMonths,
        isActive: productData.isActive,
      });

      // Update existing variants and create new ones
      for (const variantData of variants) {
        if (variantData.id) {
          // Update existing variant
          await adminApi.updateVariant(variantData.id, {
            sku: variantData.sku,
            mpn: variantData.mpn,
            color: variantData.color,
            storageGb: variantData.storageGb ?? undefined,
            ramGb: variantData.ramGb ?? undefined,
            priceMrp: variantData.priceMrp,
            priceSale: variantData.priceSale,
            taxRate: variantData.taxRate,
            weightGrams: variantData.weightGrams ?? undefined,
            isActive: variantData.isActive,
          });

          // Update inventory if needed
          try {
            await adminApi.updateInventory(variantData.id, {
              quantity: variantData.quantity,
              safetyStock: variantData.safetyStock,
            });
          } catch (invError) {
            console.log("Inventory update failed, might not exist yet");
          }
        } else {
          // Create new variant
          const variant = await adminApi.addVariant(productId, {
            sku: variantData.sku,
            mpn: variantData.mpn,
            color: variantData.color,
            storageGb: variantData.storageGb ?? undefined,
            ramGb: variantData.ramGb ?? undefined,
            priceMrp: variantData.priceMrp,
            priceSale: variantData.priceSale,
            taxRate: variantData.taxRate,
            weightGrams: variantData.weightGrams ?? undefined,
            isActive: variantData.isActive,
          });

          // Set initial inventory
          try {
            await adminApi.updateInventory(variant.id, {
              quantity: variantData.quantity,
              safetyStock: variantData.safetyStock,
            });
          } catch (invError) {
            console.log("Initial inventory setup failed");
          }
        }
      }

      toast.success("Product and variants updated successfully!");
      router.push("/admin/products");
    } catch (error: any) {
      console.error("Failed to update product:", error);
      toast.error(error?.response?.data?.message || "Failed to update product");
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

  if (!product) {
    return (
      <div className="text-center py-8">
        <p className="text-foreground-secondary">Product not found</p>
        <Link href="/admin/products">
          <Button className="mt-4">Back to Products</Button>
        </Link>
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
            Edit Product
          </h1>
          <p className="text-foreground-secondary">
            Update product information
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={productData.isActive ? "active" : "inactive"}
                  onChange={(e) =>
                    setProductData({
                      ...productData,
                      isActive: e.target.value === "active",
                    })
                  }
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Variants */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Product Variants</CardTitle>
              <Button type="button" onClick={addVariant} variant="outline">
                Add Variant
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {variants.map((variant, index) => (
              <div
                key={index}
                className="border border-border rounded-lg p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Variant {index + 1}</h4>
                  {variants.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeVariant(index)}
                      className="text-error hover:bg-error/10"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      placeholder="Product SKU"
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
                      placeholder="Color"
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
                      placeholder="Manufacturer Part Number"
                    />
                  </div>

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
                      placeholder="Storage capacity"
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
                      placeholder="RAM capacity"
                    />
                  </div>

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
                      placeholder="Weight in grams"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      MRP Price *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={variant.priceMrp}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          "priceMrp",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0.00"
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
                      value={variant.priceSale}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          "priceSale",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0.00"
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
                      value={variant.taxRate}
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

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Status
                    </label>
                    <select
                      value={variant.isActive ? "active" : "inactive"}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          "isActive",
                          e.target.value === "active"
                        )
                      }
                      className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Current Stock
                    </label>
                    <Input
                      type="number"
                      value={variant.quantity}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          "quantity",
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Safety Stock
                    </label>
                    <Input
                      type="number"
                      value={variant.safetyStock}
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
            {loading ? "Updating..." : "Update Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
