"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { HiFilter, HiSearch, HiViewGrid, HiStar } from "react-icons/hi";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { catalogApi, Product, Category, Brand, PageResponse } from "@/lib/api";

export default function ProductsPage() {
  const [products, setProducts] = useState<PageResponse<Product> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const searchParams = useSearchParams();
  const router = useRouter();

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    searchProducts();
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
      const params = {
        page: parseInt(searchParams.get("page") || "0"),
        size: 20,
        q: searchParams.get("q") || undefined,
        category: searchParams.get("category") || undefined,
        brand: searchParams.get("brand") || undefined,
        condition: searchParams.get("condition") || undefined,
        minPrice: searchParams.get("minPrice")
          ? parseFloat(searchParams.get("minPrice")!)
          : undefined,
        maxPrice: searchParams.get("maxPrice")
          ? parseFloat(searchParams.get("maxPrice")!)
          : undefined,
      };

      const data = await catalogApi.searchProducts(params);
      setProducts(data);
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
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    params.delete("page"); // Reset to first page
    router.push(`/products?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchQuery });
  };

  if (loading && !products) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Header */}
      <div className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col space-y-4">
            <h1 className="text-3xl font-bold font-display text-foreground">
              Refurbished Devices
            </h1>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex space-x-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search for laptops, mobiles, cameras..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button type="submit" className="px-6">
                <HiSearch className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold font-display mb-4 flex items-center">
                  <HiFilter className="w-5 h-5 mr-2" />
                  Filters
                </h3>

                {/* Category Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      updateFilters({ category: e.target.value });
                    }}
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Brand
                  </label>
                  <select
                    value={selectedBrand}
                    onChange={(e) => {
                      setSelectedBrand(e.target.value);
                      updateFilters({ brand: e.target.value });
                    }}
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface"
                  >
                    <option value="">All Brands</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.slug}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Condition Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Condition
                  </label>
                  <select
                    value={selectedCondition}
                    onChange={(e) => {
                      setSelectedCondition(e.target.value);
                      updateFilters({ condition: e.target.value });
                    }}
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-surface"
                  >
                    <option value="">Any Condition</option>
                    <option value="A">Grade A (Excellent)</option>
                    <option value="B">Grade B (Good)</option>
                    <option value="C">Grade C (Fair)</option>
                  </select>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Price Range
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={priceRange.min}
                      onChange={(e) =>
                        setPriceRange((prev) => ({
                          ...prev,
                          min: e.target.value,
                        }))
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceRange.max}
                      onChange={(e) =>
                        setPriceRange((prev) => ({
                          ...prev,
                          max: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <Button
                    onClick={() =>
                      updateFilters({
                        minPrice: priceRange.min,
                        maxPrice: priceRange.max,
                      })
                    }
                    className="w-full mt-2"
                    variant="outline"
                  >
                    Apply Price Filter
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {products && (
              <div className="mb-6 flex justify-between items-center">
                <p className="text-foreground-secondary">
                  Showing {products.content.length} of {products.totalElements}{" "}
                  products
                </p>
                <div className="flex items-center space-x-2">
                  <HiViewGrid className="w-5 h-5 text-foreground-secondary" />
                </div>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="aspect-square bg-background-secondary rounded-lg mb-4" />
                      <div className="h-4 bg-background-secondary rounded mb-2" />
                      <div className="h-4 bg-background-secondary rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products?.content.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-foreground-secondary text-lg">
                  No products found
                </p>
                <p className="text-foreground-muted">
                  Try adjusting your filters
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products?.content.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {products && products.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex space-x-2">
                  {Array.from({ length: products.totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => updateFilters({ page: i.toString() })}
                      className={`px-4 py-2 rounded-lg ${
                        products.number === i
                          ? "bg-primary text-white"
                          : "bg-surface text-foreground hover:bg-background-secondary"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Product Card Component
function ProductCard({ product }: { product: Product }) {
  const getConditionBadge = (grade: string) => {
    const colors = {
      A: "bg-secondary/10 text-secondary",
      B: "bg-warning/10 text-warning",
      C: "bg-accent/10 text-accent",
    };
    const labels = {
      A: "Excellent",
      B: "Good",
      C: "Fair",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[grade as keyof typeof colors]
        }`}
      >
        Grade {grade} - {labels[grade as keyof typeof labels]}
      </span>
    );
  };

  const getLowestPrice = () => {
    if (!product.variants?.length) return null;
    return Math.min(...product.variants.map((v) => v.priceSale));
  };

  const price = getLowestPrice();

  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
        <CardContent className="p-0">
          {/* Image */}
          <div className="aspect-square bg-background-secondary rounded-t-lg flex items-center justify-center">
            {product.images?.length ? (
              <img
                src={product.images[0].url}
                alt={product.title}
                className="w-full h-full object-cover rounded-t-lg"
              />
            ) : (
              <div className="text-foreground-muted text-6xl">📱</div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-2">
              {getConditionBadge(product.conditionGrade)}
            </div>

            <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
              {product.title}
            </h3>

            <p className="text-foreground-secondary text-sm mb-2">
              {product.brand?.name} • {product.warrantyMonths} months warranty
            </p>

            <div className="flex items-center mb-3">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <HiStar key={i} className="w-4 h-4 text-rating" />
                ))}
              </div>
              <span className="text-sm text-foreground-muted ml-2">(4.5)</span>
            </div>

            {price && (
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-price">
                  ₹{price.toLocaleString()}
                </span>
                <span className="text-sm text-foreground-muted">
                  Starting from
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
