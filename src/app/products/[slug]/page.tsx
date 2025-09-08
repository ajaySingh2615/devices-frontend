"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  HiShoppingCart,
  HiHeart,
  HiShieldCheck,
  HiTruck,
  HiStar,
} from "react-icons/hi";

import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { catalogApi, Product, ProductVariant } from "@/lib/api";
import ProductActions from "@/components/product/ProductActions";
import ReviewSection from "@/components/review/ReviewSection";

export default function ProductDetailPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  useEffect(() => {
    loadProduct();
  }, [slug]);

  const loadProduct = async () => {
    try {
      const data = await catalogApi.getProductBySlug(slug);
      setProduct(data);

      // Select first available variant
      if (data.variants?.length) {
        const inStockVariant =
          data.variants.find((v) => v.inventory?.inStock) || data.variants[0];
        setSelectedVariant(inStockVariant);
      }
    } catch (error) {
      console.error("Failed to load product:", error);
      toast.error("Product not found");
      router.push("/products");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Product Not Found
          </h1>
          <p className="text-foreground-secondary">
            The product you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const getConditionInfo = (grade: string) => {
    const info = {
      A: {
        label: "Excellent",
        description: "Like new with minimal signs of use",
        color: "text-secondary",
      },
      B: {
        label: "Good",
        description: "Light wear but fully functional",
        color: "text-warning",
      },
      C: {
        label: "Fair",
        description: "Visible wear but works perfectly",
        color: "text-accent",
      },
    };
    return info[grade as keyof typeof info];
  };

  const conditionInfo = getConditionInfo(product.conditionGrade);

  return (
    <div className="min-h-screen bg-background-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-surface rounded-lg p-8 flex items-center justify-center">
              {product.images?.length ? (
                <img
                  src={
                    product.images[selectedImageIndex]?.url ||
                    product.images[0].url
                  }
                  alt={product.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-foreground-muted text-8xl">📱</div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImageIndex === index
                        ? "border-primary"
                        : "border-border"
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-sm text-foreground-secondary">
                  {product.brand?.name}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium bg-${
                    conditionInfo.color.split("-")[1]
                  }/10 ${conditionInfo.color}`}
                >
                  Grade {product.conditionGrade} - {conditionInfo.label}
                </span>
              </div>

              <h1 className="text-3xl font-bold font-display text-foreground mb-2">
                {product.title}
              </h1>

              <p className={`text-sm ${conditionInfo.color} mb-4`}>
                {conditionInfo.description}
              </p>

              {/* Rating placeholder */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <HiStar key={i} className="w-5 h-5 text-rating" />
                  ))}
                </div>
                <span className="text-sm text-foreground-secondary">
                  (4.5) • 128 reviews
                </span>
              </div>
            </div>

            {/* Variant Selection */}
            {product.variants && product.variants.length > 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold font-display">
                  Configuration
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        selectedVariant?.id === variant.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">
                            {variant.ramGb && `${variant.ramGb}GB RAM`}
                            {variant.ramGb && variant.storageGb && " • "}
                            {variant.storageGb &&
                              `${variant.storageGb}GB Storage`}
                          </div>
                          {variant.color && (
                            <div className="text-sm text-foreground-secondary">
                              Color: {variant.color}
                            </div>
                          )}
                          <div
                            className={`text-sm ${
                              variant.inventory?.inStock
                                ? "text-secondary"
                                : "text-error"
                            }`}
                          >
                            {variant.inventory?.inStock
                              ? "In Stock"
                              : "Out of Stock"}
                            {variant.inventory?.lowStock &&
                              variant.inventory?.inStock &&
                              " (Low Stock)"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-price">
                            ₹{variant.priceSale.toLocaleString()}
                          </div>
                          {variant.priceMrp > variant.priceSale && (
                            <div className="text-sm text-foreground-secondary line-through">
                              ₹{variant.priceMrp.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price and Actions */}
            {selectedVariant && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl font-bold text-price">
                    ₹{selectedVariant.priceSale.toLocaleString()}
                  </div>
                  {selectedVariant.priceMrp > selectedVariant.priceSale && (
                    <div className="text-xl text-foreground-secondary line-through">
                      ₹{selectedVariant.priceMrp.toLocaleString()}
                    </div>
                  )}
                  {selectedVariant.priceMrp > selectedVariant.priceSale && (
                    <div className="bg-secondary/10 text-secondary px-2 py-1 rounded text-sm font-medium">
                      {Math.round(
                        (1 -
                          selectedVariant.priceSale /
                            selectedVariant.priceMrp) *
                          100
                      )}
                      % OFF
                    </div>
                  )}
                </div>

                <ProductActions variant={selectedVariant} />
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-surface rounded-lg">
                <HiShieldCheck className="w-6 h-6 text-secondary" />
                <div>
                  <div className="font-medium">
                    {product.warrantyMonths} Months Warranty
                  </div>
                  <div className="text-sm text-foreground-secondary">
                    Comprehensive coverage
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-surface rounded-lg">
                <HiTruck className="w-6 h-6 text-primary" />
                <div>
                  <div className="font-medium">Free Shipping</div>
                  <div className="text-sm text-foreground-secondary">
                    3-5 business days
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground-secondary whitespace-pre-line">
                    {product.description}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <ReviewSection productId={product.id} />
        </div>
      </div>
    </div>
  );
}
