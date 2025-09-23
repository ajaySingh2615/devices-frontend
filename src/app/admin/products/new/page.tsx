"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  HiArrowLeft,
  HiPlus,
  HiTrash,
  HiDuplicate,
  HiExternalLink,
} from "react-icons/hi";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  adminApi,
  catalogApi,
  Category,
  Brand,
  ConditionGrade,
} from "@/lib/api";

/* ---------- constants ---------- */

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
  isBestseller: boolean;
}

interface VariantFormData {
  sku: string;
  mpn: string;
  color: string;
  storageGb: number | null;
  ramGb: number | null;
  cpuVendor: string;
  cpuSeries: string;
  cpuGeneration: string;
  cpuModel: string;
  operatingSystem: string;
  priceMrp: number;
  priceSale: number;
  taxRate: number;
  weightGrams: number | null;
  quantity: number;
  safetyStock: number;
}

/* ---------- helpers ---------- */

const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const pct = (num: number) => `${Math.round(num)}%`;

function discountPercent(mrp: number, sale: number) {
  if (!mrp || !sale || mrp <= 0 || sale <= 0) return 0;
  return Math.max(0, ((mrp - sale) / mrp) * 100);
}

/* ---------- page ---------- */

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
    isBestseller: false,
  });

  // If user edits the slug field manually, don’t overwrite from title
  const [slugEdited, setSlugEdited] = useState(false);

  const [variants, setVariants] = useState<VariantFormData[]>([
    {
      sku: "",
      mpn: "",
      color: "",
      storageGb: null,
      ramGb: null,
      cpuVendor: "",
      cpuSeries: "",
      cpuGeneration: "",
      cpuModel: "",
      operatingSystem: "",
      priceMrp: 0,
      priceSale: 0,
      taxRate: 18,
      weightGrams: null,
      quantity: 0,
      safetyStock: 5,
    },
  ]);

  /* ---------- effects ---------- */

  useEffect(() => {
    (async () => {
      try {
        const [categoriesData, brandsData] = await Promise.all([
          catalogApi.getCategories(), // public, active only
          catalogApi.getBrands(),
        ]);
        setCategories(categoriesData);
        setBrands(brandsData);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load categories/brands");
      } finally {
        setLoadingData(false);
      }
    })();
  }, []);

  // Auto-generate slug from title unless user edited slug manually
  useEffect(() => {
    if (!slugEdited) {
      setProductData((prev) => ({ ...prev, slug: slugify(prev.title) }));
    }
  }, [productData.title, slugEdited]);

  /* ---------- derived ---------- */

  const brandName = useMemo(
    () => brands.find((b) => b.id === productData.brandId)?.name || "",
    [brands, productData.brandId]
  );
  const categoryName = useMemo(
    () => categories.find((c) => c.id === productData.categoryId)?.name || "",
    [categories, productData.categoryId]
  );

  /* ---------- variant operations ---------- */

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        sku: "",
        mpn: "",
        color: "",
        storageGb: null,
        ramGb: null,
        cpuVendor: "",
        cpuSeries: "",
        cpuGeneration: "",
        cpuModel: "",
        operatingSystem: "",
        priceMrp: 0,
        priceSale: 0,
        taxRate: 18,
        weightGrams: null,
        quantity: 0,
        safetyStock: 5,
      },
    ]);
  };

  const duplicateVariant = (index: number) => {
    setVariants((prev) => {
      const v = prev[index];
      return [...prev, { ...v, sku: "" }]; // clear SKU to avoid duplicates
    });
  };

  const removeVariant = (index: number) => {
    setVariants((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev
    );
  };

  const updateVariant = (
    index: number,
    field: keyof VariantFormData,
    value: any
  ) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  /* ---------- validation ---------- */

  const validate = () => {
    if (!productData.categoryId || !productData.brandId || !productData.title) {
      toast.error("Please fill all required product fields.");
      return false;
    }
    if (!productData.slug || !/^[a-z0-9-]+$/.test(productData.slug)) {
      toast.error(
        "Slug must contain only lowercase letters, numbers and hyphens."
      );
      return false;
    }
    // unique SKUs + sensible prices + tax range
    const skus = new Set<string>();
    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.sku)
        return toast.error(`Variant ${i + 1}: SKU is required.`), false;
      if (skus.has(v.sku))
        return toast.error(`Duplicate SKU in Variant ${i + 1}.`), false;
      skus.add(v.sku);
      if (v.priceMrp <= 0 || v.priceSale <= 0)
        return (
          toast.error(`Variant ${i + 1}: Enter valid MRP & Sale Price.`), false
        );
      if (v.priceSale > v.priceMrp)
        return (
          toast.error(`Variant ${i + 1}: Sale Price must be ≤ MRP.`), false
        );
      if (v.taxRate < 0 || v.taxRate > 100)
        return (
          toast.error(`Variant ${i + 1}: Tax Rate must be between 0 and 100.`),
          false
        );
      if (v.quantity < 0 || v.safetyStock < 0)
        return (
          toast.error(`Variant ${i + 1}: Stock values cannot be negative.`),
          false
        );
    }
    return true;
  };

  /* ---------- submit ---------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      // Create product
      const product = await adminApi.createProduct(productData);

      // Create variants + inventory
      for (const v of variants) {
        const variant = await adminApi.addVariant(product.id, {
          sku: v.sku,
          mpn: v.mpn,
          color: v.color,
          storageGb: v.storageGb || undefined,
          ramGb: v.ramGb || undefined,
          cpuVendor: v.cpuVendor || undefined,
          cpuSeries: v.cpuSeries || undefined,
          cpuGeneration: v.cpuGeneration || undefined,
          cpuModel: v.cpuModel || undefined,
          operatingSystem: v.operatingSystem || undefined,
          priceMrp: v.priceMrp,
          priceSale: v.priceSale,
          taxRate: v.taxRate,
          weightGrams: v.weightGrams || undefined,
        });
        await adminApi.updateInventory(variant.id, {
          quantity: v.quantity,
          safetyStock: v.safetyStock,
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
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 space-y-5 min-w-0">
      {/* Header */}
      <div className="flex items-start sm:items-center gap-4 flex-wrap">
        <Link href="/admin/products">
          <Button variant="outline" size="sm">
            <HiArrowLeft className="w-5 h-5 mr-2" />
            Back to Products
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">
            Create Product
          </h1>
          <p className="text-sm text-foreground-muted">
            Add a new product to your catalog
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Info */}
        <Card className="shadow-sm">
          <CardHeader className="border-b border-border p-4 sm:p-5">
            <CardTitle className="text-lg">Product Information</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
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
                  className="w-full px-3 py-2 rounded-md border border-border bg-background"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Brand *
                </label>
                <select
                  value={productData.brandId}
                  onChange={(e) =>
                    setProductData({ ...productData, brandId: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-md border border-border bg-background"
                  required
                >
                  <option value="">Select Brand</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
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
              <p className="text-[12px] text-foreground-light mt-1">
                Tip: add key specs (e.g., “HP Pavilion 14, i5 11th Gen, 8GB,
                512GB SSD”)
              </p>
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium mb-2">
                URL Slug *
              </label>
              <Input
                type="text"
                value={productData.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setProductData({
                    ...productData,
                    slug: slugify(e.target.value),
                  });
                }}
                placeholder="product-url-slug"
                required
                pattern="^[a-z0-9-]+$"
                title="Only lowercase letters, numbers and hyphens"
              />
              <div className="flex items-center gap-2 text-[12px] text-foreground-light mt-1">
                <HiExternalLink className="w-4 h-4" />
                <span>Preview:</span>
                <span className="font-mono text-foreground">
                  /products/{productData.slug || "your-slug"}
                </span>
              </div>
            </div>

            {/* Description */}
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
                className="w-full px-3 py-2 rounded-md border border-border bg-background resize-none"
                placeholder="Key features, specs, warranty, box contents, condition notes…"
              />
            </div>

            {/* Grade + Warranty + Bestseller */}
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
                  className="w-full px-3 py-2 rounded-md border border-border bg-background"
                  required
                >
                  {conditionGrades.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label} — {g.description}
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
                  inputMode="numeric"
                  min={0}
                  max={60}
                  value={productData.warrantyMonths}
                  onChange={(e) =>
                    setProductData({
                      ...productData,
                      warrantyMonths: parseInt(e.target.value || "0"),
                    })
                  }
                />
              </div>
              <div className="flex items-center gap-2 pt-7">
                <input
                  id="isBestseller"
                  type="checkbox"
                  checked={productData.isBestseller}
                  onChange={(e) =>
                    setProductData({
                      ...productData,
                      isBestseller: e.target.checked,
                    })
                  }
                />
                <label htmlFor="isBestseller" className="text-sm font-medium">
                  Mark as Bestseller
                </label>
              </div>
            </div>

            {/* Context line (nice touch) */}
            {(brandName || categoryName) && (
              <div className="rounded-md border border-border bg-background-tertiary px-3 py-2 text-[12px] text-foreground-secondary">
                <span className="mr-2">You’re creating:</span>
                <Badge className="border bg-background px-2 py-0.5 text-xs">
                  {brandName || "—"}
                </Badge>
                <span className="mx-1">·</span>
                <Badge className="border bg-background px-2 py-0.5 text-xs">
                  {categoryName || "—"}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Variants */}
        <Card className="shadow-sm">
          <CardHeader className="border-b border-border p-4 sm:p-5 flex items-center justify-between">
            <CardTitle className="text-lg">Product Variants</CardTitle>
            <Button type="button" variant="outline" onClick={addVariant}>
              <HiPlus className="w-4 h-4 mr-2" />
              Add Variant
            </Button>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 space-y-6">
            {variants.map((v, index) => {
              const d = discountPercent(v.priceMrp, v.priceSale);
              const inclTax =
                v.priceSale && v.taxRate >= 0
                  ? v.priceSale * (1 + (v.taxRate || 0) / 100)
                  : 0;

              return (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-border bg-background space-y-4"
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">Variant {index + 1}</h4>
                      {v.priceMrp > 0 && v.priceSale > 0 && (
                        <Badge className="border bg-success/10 text-success border-success/20">
                          {d ? `Discount ${pct(d)}` : "No discount"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        title="Duplicate"
                        onClick={() => duplicateVariant(index)}
                      >
                        <HiDuplicate className="w-4 h-4" />
                      </Button>
                      {variants.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-error hover:bg-error/10"
                          title="Remove"
                          onClick={() => removeVariant(index)}
                        >
                          <HiTrash className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Row 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field
                      label="SKU *"
                      required
                      placeholder="PROD-001"
                      value={v.sku}
                      onChange={(val) => updateVariant(index, "sku", val)}
                    />
                    <Field
                      label="Color"
                      placeholder="Black"
                      value={v.color}
                      onChange={(val) => updateVariant(index, "color", val)}
                    />
                    <Field
                      label="MPN"
                      placeholder="Manufacturer part number"
                      value={v.mpn}
                      onChange={(val) => updateVariant(index, "mpn", val)}
                    />
                  </div>

                  {/* CPU Row */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        CPU Vendor
                      </label>
                      <select
                        value={v.cpuVendor}
                        onChange={(e) =>
                          updateVariant(index, "cpuVendor", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-md border border-border bg-background"
                      >
                        <option value="">—</option>
                        <option value="intel">Intel</option>
                        <option value="amd">AMD</option>
                        <option value="apple">Apple</option>
                      </select>
                    </div>
                    <Field
                      label="CPU Series"
                      placeholder="i5, Ryzen 5, M1"
                      value={v.cpuSeries}
                      onChange={(val) => updateVariant(index, "cpuSeries", val)}
                    />
                    <Field
                      label="CPU Generation"
                      placeholder="12th Gen"
                      value={v.cpuGeneration}
                      onChange={(val) =>
                        updateVariant(index, "cpuGeneration", val)
                      }
                    />
                    <Field
                      label="CPU Model"
                      placeholder="i7-1165G7 / 5600U / M2"
                      value={v.cpuModel}
                      onChange={(val) => updateVariant(index, "cpuModel", val)}
                    />
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Operating System
                      </label>
                      <select
                        value={v.operatingSystem}
                        onChange={(e) =>
                          updateVariant(
                            index,
                            "operatingSystem",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 rounded-md border border-border bg-background"
                      >
                        <option value="">—</option>
                        <option value="windows">Windows</option>
                        <option value="macos">macOS</option>
                        <option value="linux">Linux</option>
                        <option value="chrome">ChromeOS</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <NumberField
                      label="Storage (GB)"
                      placeholder="128"
                      value={v.storageGb}
                      onChange={(num) => updateVariant(index, "storageGb", num)}
                      min={0}
                    />
                    <NumberField
                      label="RAM (GB)"
                      placeholder="8"
                      value={v.ramGb}
                      onChange={(num) => updateVariant(index, "ramGb", num)}
                      min={0}
                    />
                  </div>

                  {/* Row 3 - Pricing */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <NumberField
                      label="MRP *"
                      placeholder="29999.00"
                      value={v.priceMrp}
                      step="0.01"
                      min={0}
                      required
                      onChange={(num) =>
                        updateVariant(index, "priceMrp", num || 0)
                      }
                    />
                    <NumberField
                      label="Sale Price *"
                      placeholder="24999.00"
                      value={v.priceSale}
                      step="0.01"
                      min={0}
                      required
                      onChange={(num) =>
                        updateVariant(index, "priceSale", num || 0)
                      }
                    />
                    <NumberField
                      label="Tax Rate (%)"
                      placeholder="18.00"
                      value={v.taxRate}
                      step="0.01"
                      min={0}
                      max={100}
                      onChange={(num) =>
                        updateVariant(index, "taxRate", num || 0)
                      }
                    />
                  </div>

                  {/* Quick price insight */}
                  <div className="rounded-md bg-background-tertiary border border-border px-3 py-2 text-[12px] text-foreground-secondary">
                    {v.priceSale > 0 ? (
                      <div className="flex flex-wrap gap-3">
                        <span>
                          Incl. tax price:{" "}
                          <span className="font-medium">
                            ₹{Math.round(inclTax).toLocaleString("en-IN")}
                          </span>
                        </span>
                        {d > 0 ? (
                          <span>
                            You’re offering{" "}
                            <span className="font-medium">{pct(d)}</span> off
                            MRP.
                          </span>
                        ) : (
                          <span>No discount vs MRP.</span>
                        )}
                      </div>
                    ) : (
                      <span>Enter Sale Price to see tax & discount info.</span>
                    )}
                  </div>

                  {/* Row 4 - Inventory */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <NumberField
                      label="Weight (Grams)"
                      placeholder="500"
                      value={v.weightGrams}
                      min={0}
                      onChange={(num) =>
                        updateVariant(index, "weightGrams", num)
                      }
                    />
                    <NumberField
                      label="Initial Stock"
                      placeholder="10"
                      value={v.quantity}
                      min={0}
                      onChange={(num) =>
                        updateVariant(index, "quantity", num || 0)
                      }
                    />
                    <NumberField
                      label="Safety Stock"
                      placeholder="5"
                      value={v.safetyStock}
                      min={0}
                      onChange={(num) =>
                        updateVariant(index, "safetyStock", num || 0)
                      }
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3">
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

/* ---------- small field components ---------- */

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label} {required ? "*" : ""}
      </label>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
  min,
  max,
  step,
  required,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label} {required ? "*" : ""}
      </label>
      <Input
        type="number"
        inputMode="decimal"
        step={step || "1"}
        min={min as any}
        max={max as any}
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return onChange(null);
          const num = Number(raw);
          onChange(Number.isFinite(num) ? num : null);
        }}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}
