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

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
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
    }
  }, [product]);

  const loadData = async () => {
    try {
      const [productData, categoriesData, brandsData] = await Promise.all([
        catalogApi.getProductBySlug(productId), // Using slug as we might not have ID-based endpoint
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productData.categoryId || !productData.brandId || !productData.title) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
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

      toast.success("Product updated successfully!");
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
