"use client";

import { useState, useEffect, Fragment } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import {
  HiFilter,
  HiSearch,
  HiViewGrid,
  HiX,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi";
import { Heart, ShoppingCart, Plus, Minus, Tag } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";

import { catalogApi, Product, Category, Brand, PageResponse } from "@/lib/api";

import { useAuth } from "@/hooks/useAuth";
import { cartApi, wishlistApi } from "@/lib/api";
import ProductRating from "@/components/rating/ProductRating";

/* ===========================
   Products Page
=========================== */
export default function ProductsPage() {
  const [products, setProducts] = useState<PageResponse<Product> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");

  // filters
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [processorVendor, setProcessorVendor] = useState("");
  const [processorSeries, setProcessorSeries] = useState("");
  const [processorGeneration, setProcessorGeneration] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [operatingSystem, setOperatingSystem] = useState("");
  const [sort, setSort] = useState<
    "relevance" | "newest" | "price_asc" | "price_desc"
  >("relevance");

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    loadInitialData();
  }, []);

  // hydrate local filter UI from URL on mount/URL change
  useEffect(() => {
    setSelectedCategory(searchParams.get("category") || "");
    setSelectedBrand(searchParams.get("brand") || "");
    setSelectedCondition(searchParams.get("condition") || "");
    setProcessorVendor(searchParams.get("processorVendor") || "");
    setProcessorSeries(searchParams.get("processorSeries") || "");
    setProcessorGeneration(searchParams.get("processorGeneration") || "");
    setPriceRange({
      min: searchParams.get("minPrice") || "",
      max: searchParams.get("maxPrice") || "",
    });
    setOperatingSystem(searchParams.get("operatingSystem") || "");
    setSearchQuery(searchParams.get("q") || "");
    setSort((searchParams.get("sort") as any) || "relevance");
    searchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadInitialData = async () => {
    try {
      const [categoriesData, brandsData] = await Promise.all([
        catalogApi.getCategories(),
        catalogApi.getBrands(),
      ]);
      setCategories(categoriesData);
      setBrands(brandsData);
    } catch (error) {
      console.error("Failed to load initial data:", error);
      toast.error("Failed to load catalog data");
    }
  };

  const searchProducts = async () => {
    setLoading(true);
    try {
      const uiSort = (searchParams.get("sort") as any) || "relevance";
      let backendSort: string | undefined = undefined;
      let backendDirection: "asc" | "desc" | undefined = undefined;
      if (uiSort === "newest") {
        backendSort = "createdAt";
        backendDirection = "desc";
      } else if (uiSort === "price_asc" || uiSort === "price_desc") {
        // Do client-side sort for price; backend doesn't have a direct price field on Product
        backendSort = undefined;
        backendDirection = undefined;
      } else {
        backendSort = undefined;
        backendDirection = undefined;
      }

      const params = {
        page: parseInt(searchParams.get("page") || "0"),
        size: 20,
        q: searchParams.get("q") || undefined,
        category: searchParams.get("category") || undefined,
        brand: searchParams.get("brand") || undefined,
        condition: searchParams.get("condition") || undefined,
        processorVendor: searchParams.get("processorVendor") || undefined,
        processorSeries: searchParams.get("processorSeries") || undefined,
        processorGeneration:
          searchParams.get("processorGeneration") || undefined,
        minPrice: searchParams.get("minPrice")
          ? parseFloat(searchParams.get("minPrice")!)
          : undefined,
        maxPrice: searchParams.get("maxPrice")
          ? parseFloat(searchParams.get("maxPrice")!)
          : undefined,
        operatingSystem: searchParams.get("operatingSystem") || undefined,
        sort: backendSort,
        direction: backendDirection,
      } as const;
      const data = await catalogApi.searchProducts(params as any);

      // Client-side sort for price based on lowest variant sale price
      if (uiSort === "price_asc" || uiSort === "price_desc") {
        const getMinSalePrice = (p: Product): number => {
          const prices = (p.variants || []).map((v) => v.priceSale);
          if (!prices.length) return Number.POSITIVE_INFINITY;
          return Math.min(...prices);
        };
        const sorted = [...data.content].sort((a, b) => {
          const pa = getMinSalePrice(a);
          const pb = getMinSalePrice(b);
          if (pa === pb) return 0;
          return uiSort === "price_asc" ? pa - pb : pb - pa;
        });
        setProducts({ ...data, content: sorted });
      } else {
        setProducts(data);
      }
    } catch (error) {
      console.error("Search failed:", error);
      toast.error("Failed to search products");
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (filters: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    // reset page on filter change
    if (!("page" in filters)) params.delete("page");
    router.push(`/products?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchQuery });
  };

  const clearAll = () => {
    router.push("/products");
  };

  const selectedChips = [
    selectedCategory &&
      categories.find((c) => c.slug === selectedCategory)?.name && {
        key: "category",
        label: categories.find((c) => c.slug === selectedCategory)?.name || "",
      },
    selectedBrand &&
      brands.find((b) => b.slug === selectedBrand)?.name && {
        key: "brand",
        label: brands.find((b) => b.slug === selectedBrand)?.name || "",
      },
    selectedCondition && {
      key: "condition",
      label:
        selectedCondition === "A"
          ? "Grade A"
          : selectedCondition === "B"
          ? "Grade B"
          : "Grade C",
    },
    (priceRange.min || priceRange.max) && {
      key: "price",
      label: `₹${priceRange.min || "0"}–₹${priceRange.max || "∞"}`,
    },
    processorVendor && {
      key: "processorVendor",
      label: processorVendor.toUpperCase(),
    },
    processorSeries && { key: "processorSeries", label: processorSeries },
    processorGeneration && {
      key: "processorGeneration",
      label: processorGeneration,
    },
    operatingSystem && {
      key: "operatingSystem",
      label: operatingSystem.toUpperCase(),
    },
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Hero / Header */}
      <div className="bg-surface border-b border-border sticky top-14 sm:top-14 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold font-display text-foreground">
                  Refurbished Devices
                </h1>
                <p className="text-foreground-secondary text-sm">
                  Carefully inspected devices with warranty & support.
                </p>
              </div>
              <div className="hidden lg:flex items-center gap-2">
                <span className="text-sm text-foreground-secondary">Sort</span>
                <select
                  value={sort}
                  onChange={(e) =>
                    updateFilters({ sort: e.target.value, page: "0" })
                  }
                  className="px-3 py-2 rounded-lg border border-border bg-surface text-sm"
                >
                  <option value="relevance">Relevance</option>
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                </select>
              </div>
            </div>

            {/* Search + Quick actions */}
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search laptops, mobiles, cameras..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" className="px-4">
                <HiSearch className="w-5 h-5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                className="lg:hidden"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <HiFilter className="w-5 h-5 mr-2" />
                Filters
              </Button>
            </form>

            {/* Selected filter chips */}
            {selectedChips.length > 0 && (
              <div className="flex items-center flex-wrap gap-2">
                {selectedChips.map((chip) => (
                  <span
                    key={chip.key}
                    className="inline-flex items-center gap-2 text-sm px-2.5 py-1 rounded-full bg-background-secondary border border-border"
                  >
                    <Tag className="h-3.5 w-3.5 text-foreground-muted" />
                    {chip.label}
                    <button
                      aria-label={`Remove ${chip.label}`}
                      onClick={() => {
                        if (chip.key === "price") {
                          setPriceRange({ min: "", max: "" });
                          updateFilters({ minPrice: "", maxPrice: "" });
                        } else updateFilters({ [chip.key]: "" });
                      }}
                      className="hover:text-error transition-colors"
                    >
                      <HiX className="h-4 w-4" />
                    </button>
                  </span>
                ))}
                <button
                  onClick={clearAll}
                  className="text-sm text-foreground-secondary hover:text-foreground underline underline-offset-4"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar (sticky on desktop) */}
          <aside className="lg:w-72">
            <div className="hidden lg:block sticky top-28">
              <FiltersCard
                categories={categories}
                brands={brands}
                selectedCategory={selectedCategory}
                setSelectedCategory={(v) => {
                  setSelectedCategory(v);
                  updateFilters({ category: v, q: "" });
                }}
                selectedBrand={selectedBrand}
                setSelectedBrand={(v) => {
                  setSelectedBrand(v);
                  updateFilters({ brand: v, q: "" });
                }}
                selectedCondition={selectedCondition}
                setSelectedCondition={(v) => {
                  setSelectedCondition(v);
                  updateFilters({ condition: v, q: "" });
                }}
                processorVendor={processorVendor}
                setProcessorVendor={(v) => {
                  setProcessorVendor(v);
                  updateFilters({ processorVendor: v, q: "" });
                }}
                processorSeries={processorSeries}
                setProcessorSeries={(v) => {
                  setProcessorSeries(v);
                  updateFilters({ processorSeries: v, q: "" });
                }}
                processorGeneration={processorGeneration}
                setProcessorGeneration={(v) => {
                  setProcessorGeneration(v);
                  updateFilters({ processorGeneration: v, q: "" });
                }}
                operatingSystem={operatingSystem}
                setOperatingSystem={(v) => {
                  setOperatingSystem(v);
                  updateFilters({ operatingSystem: v, q: "" });
                }}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                applyPrice={() =>
                  updateFilters({
                    minPrice: priceRange.min,
                    maxPrice: priceRange.max,
                    q: "",
                  })
                }
              />
            </div>
          </aside>

          {/* Grid */}
          <section className="flex-1">
            {/* meta row */}
            {products && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-foreground-secondary">
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {products.content.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground">
                    {products.totalElements}
                  </span>{" "}
                  products
                </p>
                <div className="flex items-center gap-2 lg:hidden">
                  <span className="text-sm text-foreground-secondary">
                    Sort
                  </span>
                  <select
                    value={sort}
                    onChange={(e) =>
                      updateFilters({ sort: e.target.value, page: "0" })
                    }
                    className="px-3 py-2 rounded-lg border border-border bg-surface text-sm"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="newest">Newest</option>
                    <option value="price_asc">Price: Low → High</option>
                    <option value="price_desc">Price: High → Low</option>
                  </select>
                </div>
              </div>
            )}

            {/* results / skeleton / empty */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-square bg-background-secondary animate-pulse" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 w-3/4 bg-background-secondary rounded animate-pulse" />
                      <div className="h-4 w-1/2 bg-background-secondary rounded animate-pulse" />
                      <div className="h-10 w-full bg-background-secondary rounded animate-pulse" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : products?.content.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-3">🔎</div>
                <h3 className="text-lg font-semibold mb-1">
                  No products found
                </h3>
                <p className="text-foreground-secondary">
                  Try adjusting your search or filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products?.content.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

            {/* pagination */}
            {products && products.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  disabled={products.number <= 0}
                  onClick={() =>
                    updateFilters({ page: String(products.number - 1) })
                  }
                  className="px-3 py-2 rounded-lg bg-surface border border-border disabled:opacity-50"
                >
                  <HiChevronLeft className="w-5 h-5" />
                </button>
                <nav className="flex items-center gap-1">
                  {Array.from({ length: products.totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => updateFilters({ page: String(i) })}
                      className={`px-3 py-2 rounded-lg text-sm ${
                        products.number === i
                          ? "bg-primary text-white"
                          : "bg-surface border border-border hover:bg-background-secondary"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </nav>
                <button
                  disabled={products.number >= products.totalPages - 1}
                  onClick={() =>
                    updateFilters({ page: String(products.number + 1) })
                  }
                  className="px-3 py-2 rounded-lg bg-surface border border-border disabled:opacity-50"
                >
                  <HiChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[86%] max-w-sm bg-surface shadow-xl border-l border-border">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="font-semibold">Filters</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileFiltersOpen(false)}
              >
                <HiX className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4 overflow-y-auto h-[calc(100%-56px)]">
              <FiltersCard
                categories={categories}
                brands={brands}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedBrand={selectedBrand}
                setSelectedBrand={setSelectedBrand}
                selectedCondition={selectedCondition}
                setSelectedCondition={setSelectedCondition}
                priceRange={priceRange}
                setPriceRange={setPriceRange}
                applyPrice={() => {
                  updateFilters({
                    category: selectedCategory,
                    brand: selectedBrand,
                    condition: selectedCondition,
                    minPrice: priceRange.min,
                    maxPrice: priceRange.max,
                    q: "",
                  });
                  setMobileFiltersOpen(false);
                }}
                compact
              />
              <div className="mt-3 flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    updateFilters({
                      category: selectedCategory,
                      brand: selectedBrand,
                      condition: selectedCondition,
                      minPrice: priceRange.min,
                      maxPrice: priceRange.max,
                      q: "",
                    });
                    setMobileFiltersOpen(false);
                  }}
                >
                  Apply
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setSelectedCategory("");
                    setSelectedBrand("");
                    setSelectedCondition("");
                    setPriceRange({ min: "", max: "" });
                    router.push("/products");
                    setMobileFiltersOpen(false);
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===========================
   Filters Card (reusable)
=========================== */
function FiltersCard(props: {
  categories: Category[];
  brands: Brand[];
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  selectedBrand: string;
  setSelectedBrand: (v: string) => void;
  selectedCondition: string;
  setSelectedCondition: (v: string) => void;
  // processor filters
  processorVendor?: string;
  setProcessorVendor?: (v: string) => void;
  processorSeries?: string;
  setProcessorSeries?: (v: string) => void;
  processorGeneration?: string;
  setProcessorGeneration?: (v: string) => void;
  operatingSystem?: string;
  setOperatingSystem?: (v: string) => void;
  priceRange: { min: string; max: string };
  setPriceRange: (v: { min: string; max: string }) => void;
  applyPrice: () => void;
  compact?: boolean;
}) {
  const {
    categories,
    brands,
    selectedCategory,
    setSelectedCategory,
    selectedBrand,
    setSelectedBrand,
    selectedCondition,
    setSelectedCondition,
    processorVendor = "",
    setProcessorVendor = () => {},
    processorSeries = "",
    setProcessorSeries = () => {},
    processorGeneration = "",
    setProcessorGeneration = () => {},
    operatingSystem = "",
    setOperatingSystem = () => {},
    priceRange,
    setPriceRange,
    applyPrice,
    compact,
  } = props;

  return (
    <Card>
      <CardContent className="p-5 space-y-6">
        <div>
          <div className="text-sm font-semibold mb-3 flex items-center gap-2">
            <HiFilter className="w-4 h-4" />
            Filters
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground-secondary">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-border bg-surface"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Brand */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground-secondary">
              Brand
            </label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-border bg-surface"
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.slug}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground-secondary">
              Condition
            </label>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-border bg-surface"
            >
              <option value="">Any Condition</option>
              <option value="A">Grade A (Excellent)</option>
              <option value="B">Grade B (Good)</option>
              <option value="C">Grade C (Fair)</option>
            </select>
          </div>

          {/* Processor */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground-secondary">
              Processor
            </label>
            <select
              value={processorVendor}
              onChange={(e) => setProcessorVendor(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-border bg-surface mb-2"
            >
              <option value="">Any Vendor</option>
              <option value="intel">Intel</option>
              <option value="amd">AMD</option>
              <option value="apple">Apple</option>
            </select>
            <Input
              placeholder="Series (e.g., i5, Ryzen 5, M1)"
              value={processorSeries}
              onChange={(e) => setProcessorSeries(e.target.value)}
            />
            <Input
              placeholder="Generation (e.g., 12th Gen)"
              value={processorGeneration}
              onChange={(e) => setProcessorGeneration(e.target.value)}
              className="mt-2"
            />
            {!compact && (
              <Button
                onClick={
                  () =>
                    applyPrice() /* reusing Apply button below for consistency */
                }
                variant="ghost"
                className="w-full mt-1"
              ></Button>
            )}
          </div>

          {/* Operating System */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground-secondary">
              Operating System
            </label>
            <select
              value={operatingSystem}
              onChange={(e) => setOperatingSystem(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-border bg-surface"
            >
              <option value="">Any OS</option>
              <option value="windows">Windows</option>
              <option value="macos">macOS</option>
              <option value="linux">Linux</option>
              <option value="chrome">ChromeOS</option>
            </select>
            {!compact && (
              <Button
                onClick={() => setOperatingSystem(operatingSystem)}
                variant="ghost"
                className="w-full"
              >
                Apply OS
              </Button>
            )}
          </div>

          {/* Price */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground-secondary">
              Price Range
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) =>
                  setPriceRange({ ...priceRange, min: e.target.value })
                }
              />
              <Input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) =>
                  setPriceRange({ ...priceRange, max: e.target.value })
                }
              />
            </div>
            {!compact && (
              <Button onClick={applyPrice} variant="outline" className="w-full">
                Apply
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ===========================
   Product Card
=========================== */
function ProductCard({ product }: { product: Product }) {
  const [fullProduct, setFullProduct] = useState<Product>(product);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!product.variants || product.variants.length === 0) {
          const detailed = await catalogApi.getProductBySlug(product.slug);
          if (alive) setFullProduct(detailed);
        } else {
          setFullProduct(product);
        }
      } catch (e) {
        console.error("Failed to load product details:", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [product.id, product.slug]);

  const { user, loading: authLoading } = useAuth();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [quantity, setQuantity] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [updatingQty, setUpdatingQty] = useState<boolean>(false);

  const variants = fullProduct.variants || [];
  const defaultVariant =
    variants.find((v) => v.inventory?.inStock) || variants[0];

  // compute best price + discount
  const prices = variants.map((v) => ({
    sale: v.priceSale,
    mrp: v.priceMrp || v.priceSale,
    v,
  }));
  const best = prices.sort((a, b) => a.sale - b.sale)[0];
  const price = best?.sale ?? undefined;
  const mrp = best?.mrp ?? undefined;
  const discount =
    mrp && price && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  useEffect(() => {
    const run = async () => {
      if (!defaultVariant) return;
      try {
        const cart = await cartApi.getCart();
        const item = cart.items?.find((i) => i.variantId === defaultVariant.id);
        setQuantity(item?.quantity || 0);
      } catch {}
      if (!authLoading && user) {
        try {
          const inW = await wishlistApi.isInWishlist(defaultVariant.id);
          setIsInWishlist(inW);
        } catch {}
      }
    };
    run();
  }, [authLoading, user, defaultVariant?.id]);

  const addToCartOnce = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!defaultVariant?.inventory?.inStock) {
      toast.error("This variant is not available");
      return;
    }
    try {
      setLoading(true);
      const result = await cartApi.addToCart({
        variantId: defaultVariant.id,
        quantity: 1,
      });
      const currentItem = result.items?.find(
        (i) => i.variantId === defaultVariant.id
      );
      setQuantity(currentItem?.quantity || 1);
      toast.success("Added to cart");
      window?.dispatchEvent(new CustomEvent("cartUpdated"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add to cart");
    } finally {
      setLoading(false);
    }
  };

  const increase = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!defaultVariant) return;
    try {
      setUpdatingQty(true);
      const result = await cartApi.addToCart({
        variantId: defaultVariant.id,
        quantity: 1,
      });
      const currentItem = result.items?.find(
        (i) => i.variantId === defaultVariant.id
      );
      setQuantity(currentItem?.quantity || quantity + 1);
      window?.dispatchEvent(new CustomEvent("cartUpdated"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update quantity");
    } finally {
      setUpdatingQty(false);
    }
  };

  const decrease = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!defaultVariant) return;

    try {
      setUpdatingQty(true);
      const currentCart = await cartApi.getCart();
      const item = currentCart.items.find(
        (i) => i.variantId === defaultVariant.id
      );
      if (!item) return;
      if (item.quantity <= 1) {
        await cartApi.removeFromCart(item.id);
        setQuantity(0);
      } else {
        const result = await cartApi.updateCartItem(item.id, {
          quantity: item.quantity - 1,
        });
        const updated = result.items.find(
          (i) => i.variantId === defaultVariant.id
        );
        setQuantity(updated?.quantity || Math.max(0, quantity - 1));
      }
      window?.dispatchEvent(new CustomEvent("cartUpdated"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update quantity");
    } finally {
      setUpdatingQty(false);
    }
  };

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!defaultVariant) return;

    if (authLoading) return;
    const hasToken =
      typeof window !== "undefined" && !!localStorage.getItem("accessToken");
    if (!user && !hasToken) {
      toast.error("Please login to add items to wishlist");
      return;
    }

    try {
      setWishlistLoading(true);
      if (isInWishlist) {
        await wishlistApi.removeFromWishlistByVariant(defaultVariant.id);
        setIsInWishlist(false);
        toast.success("Removed from wishlist");
      } else {
        await wishlistApi.addToWishlist({ variantId: defaultVariant.id });
        setIsInWishlist(true);
        toast.success("Added to wishlist");
      }
      window?.dispatchEvent(new CustomEvent("wishlistUpdated"));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update wishlist");
    } finally {
      setWishlistLoading(false);
    }
  };

  const conditionBadge = (() => {
    const color =
      product.conditionGrade === "A"
        ? "bg-secondary/10 text-secondary"
        : product.conditionGrade === "B"
        ? "bg-warning/10 text-warning"
        : "bg-accent/10 text-accent";
    const label =
      product.conditionGrade === "A"
        ? "Excellent"
        : product.conditionGrade === "B"
        ? "Good"
        : "Fair";
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        Grade {product.conditionGrade} • {label}
      </span>
    );
  })();

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-0">
        {/* image */}
        <Link
          href={`/products/${product.slug}`}
          className="block relative aspect-square bg-background-secondary"
        >
          {discount > 0 && (
            <div className="absolute left-3 top-3 z-10 px-2 py-1 rounded-md text-xs font-semibold bg-error text-white">
              {discount}% OFF
            </div>
          )}

          <button
            onClick={toggleWishlist}
            disabled={wishlistLoading}
            className="absolute right-3 top-3 z-10 p-2 rounded-full bg-white/90 shadow hover:bg-white transition-opacity opacity-100 md:opacity-0 md:group-hover:opacity-100"
            aria-label="Toggle wishlist"
          >
            {wishlistLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            ) : (
              <Heart
                className={`h-4 w-4 ${
                  isInWishlist
                    ? "fill-red-500 text-red-500"
                    : "text-foreground-muted"
                }`}
              />
            )}
          </button>

          {fullProduct.images?.[0]?.url ? (
            <img
              src={fullProduct.images[0].url}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-5xl">
              📱
            </div>
          )}
        </Link>

        {/* content */}
        <div className="p-4">
          <div className="mb-2">{conditionBadge}</div>

          <Link href={`/products/${product.slug}`}>
            <h3 className="text-base font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors">
              {product.title}
            </h3>
          </Link>

          <p className="text-sm text-foreground-secondary mt-1">
            {product.brand?.name} • {product.warrantyMonths}m warranty
          </p>

          <div className="mt-2">
            <ProductRating
              productId={product.id}
              variant="compact"
              showReviewCount={false}
            />
          </div>

          {/* price */}
          <div className="mt-3 flex items-end gap-2">
            {price !== undefined ? (
              <>
                <span className="text-2xl font-bold text-price">
                  ₹{price.toLocaleString()}
                </span>
                {mrp && mrp > price && (
                  <span className="text-sm line-through text-foreground-muted">
                    ₹{mrp.toLocaleString()}
                  </span>
                )}
                <span className="ml-auto text-xs text-foreground-muted">
                  Starting from
                </span>
              </>
            ) : (
              <span className="text-foreground-secondary">
                Price unavailable
              </span>
            )}
          </div>

          {/* actions */}
          <div className="mt-4">
            {defaultVariant ? (
              quantity > 0 ? (
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={decrease}
                    disabled={updatingQty}
                    className="h-8 w-8 p-0"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <div className="min-w-[2rem] text-center font-medium text-sm">
                    {quantity}
                  </div>
                  <Button
                    size="sm"
                    onClick={increase}
                    disabled={updatingQty || !defaultVariant.inventory?.inStock}
                    className="h-8 w-8 p-0"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={addToCartOnce}
                  disabled={loading || !defaultVariant.inventory?.inStock}
                  className="w-full"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                  ) : (
                    <ShoppingCart className="h-3 w-3 mr-2" />
                  )}
                  {defaultVariant.inventory?.inStock
                    ? "Add to Cart"
                    : "Out of Stock"}
                </Button>
              )
            ) : (
              <Button size="sm" disabled className="w-full">
                <ShoppingCart className="h-3 w-3 mr-2" />
                No variants available
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
