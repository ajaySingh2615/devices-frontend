"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HiStar, HiShoppingCart, HiHeart } from "react-icons/hi";
import { Heart, ShoppingCart, Plus, Minus } from "lucide-react";
import { toast } from "react-hot-toast";

import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { catalogApi, Product, ProductVariant } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { cartApi, wishlistApi } from "@/lib/api";
import ProductRating from "@/components/rating/ProductRating";

interface RelatedProductsProps {
  currentProduct: Product;
  limit?: number;
}

export default function RelatedProducts({
  currentProduct,
  limit = 8,
}: RelatedProductsProps) {
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    loadRelatedProducts();
  }, [currentProduct.id, currentProduct.categoryId, currentProduct.brandId]);

  const loadRelatedProducts = async () => {
    try {
      setLoading(true);

      // Strategy: Get products from same category first, then same brand, then similar condition
      const promises = [];

      // 1. Same category products (highest priority)
      if (currentProduct.categoryId) {
        promises.push(
          catalogApi.searchProducts({
            category: currentProduct.categoryId,
            size: Math.ceil(limit * 0.6), // 60% from same category
            sort: "createdAt",
            direction: "desc",
          })
        );
      }

      // 2. Same brand products (medium priority)
      if (currentProduct.brandId) {
        promises.push(
          catalogApi.searchProducts({
            brand: currentProduct.brandId,
            size: Math.ceil(limit * 0.4), // 40% from same brand
            sort: "createdAt",
            direction: "desc",
          })
        );
      }

      // 3. Same condition grade (lowest priority)
      promises.push(
        catalogApi.searchProducts({
          condition: currentProduct.conditionGrade,
          size: Math.ceil(limit * 0.3), // 30% from same condition
          sort: "createdAt",
          direction: "desc",
        })
      );

      const results = await Promise.allSettled(promises);
      const allProducts: Product[] = [];

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          allProducts.push(...result.value.content);
        }
      });

      // Remove current product and deduplicate
      const uniqueProducts = allProducts
        .filter((product) => product.id !== currentProduct.id)
        .reduce((acc, product) => {
          if (!acc.find((p) => p.id === product.id)) {
            acc.push(product);
          }
          return acc;
        }, [] as Product[])
        .slice(0, limit);

      // Fetch full product details for each related product
      const detailedProducts = await Promise.all(
        uniqueProducts.map(async (product) => {
          try {
            return await catalogApi.getProductBySlug(product.slug);
          } catch (error) {
            console.error(
              `Failed to load details for product ${product.slug}:`,
              error
            );
            return product; // Fallback to basic product data
          }
        })
      );

      setRelatedProducts(detailedProducts);
    } catch (error) {
      console.error("Failed to load related products:", error);
      toast.error("Failed to load related products");
    } finally {
      setLoading(false);
    }
  };

  const getConditionBadge = (grade: string) => {
    const conditions = {
      A: {
        label: "Grade A",
        color: "bg-green-100 text-green-800 border-green-200",
      },
      B: {
        label: "Grade B",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      C: {
        label: "Grade C",
        color: "bg-orange-100 text-orange-800 border-orange-200",
      },
    };
    const condition =
      conditions[grade as keyof typeof conditions] || conditions.B;

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${condition.color}`}
      >
        {condition.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Related Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-0">
                <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (relatedProducts.length === 0) {
    return null; // Don't show section if no related products
  }

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Related Products</h2>
        <div className="text-sm text-gray-600">
          {relatedProducts.length} products found
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedProducts.map((product) => (
          <RelatedProductCard
            key={product.id}
            product={product}
            user={user}
            authLoading={authLoading}
          />
        ))}
      </div>
    </div>
  );
}

// Individual Related Product Card Component
function RelatedProductCard({
  product,
  user,
  authLoading,
}: {
  product: Product;
  user: any;
  authLoading: boolean;
}) {
  const router = useRouter();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [quantity, setQuantity] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [updatingQty, setUpdatingQty] = useState<boolean>(false);

  // Get the first available variant (lowest price)
  const defaultVariant =
    product.variants?.find((v) => v.inventory?.inStock) ||
    product.variants?.[0];
  const price = defaultVariant?.priceSale || defaultVariant?.priceMrp;

  useEffect(() => {
    if (!authLoading && user && defaultVariant) {
      checkWishlistStatus();
      checkCartStatus();
    } else if (!authLoading && !user && defaultVariant) {
      checkCartStatus();
    }
  }, [authLoading, user, defaultVariant?.id]);

  const checkWishlistStatus = async () => {
    if (!user || !defaultVariant) return;
    try {
      const inWishlist = await wishlistApi.isInWishlist(defaultVariant.id);
      setIsInWishlist(inWishlist);
    } catch (error) {
      console.error("Failed to check wishlist status:", error);
    }
  };

  const checkCartStatus = async () => {
    if (!defaultVariant) return;
    try {
      const cart = await cartApi.getCart();
      const cartItem = cart.items.find(
        (item) => item.variant?.id === defaultVariant.id
      );
      setQuantity(cartItem?.quantity || 0);
    } catch (error) {
      console.error("Failed to check cart status:", error);
    }
  };

  const handleAddToCart = async () => {
    if (!defaultVariant) return;

    if (!user && !localStorage.getItem("accessToken")) {
      toast.error("Please login to add items to cart");
      return;
    }

    try {
      setLoading(true);
      await cartApi.addToCart({
        variantId: defaultVariant.id,
        quantity: 1,
      });
      setQuantity(1);
      toast.success("Added to cart");

      // Dispatch custom event for cart icon update
      window.dispatchEvent(new CustomEvent("cartUpdated"));
    } catch (error: any) {
      console.error("Failed to add to cart:", error);
      toast.error(error.response?.data?.message || "Failed to add to cart");
    } finally {
      setLoading(false);
    }
  };

  const handleIncrease = async () => {
    if (!defaultVariant || updatingQty) return;

    try {
      setUpdatingQty(true);
      // Get current cart to find the cart item ID
      const cart = await cartApi.getCart();
      const cartItem = cart.items.find(
        (item) => item.variant?.id === defaultVariant.id
      );

      if (!cartItem) {
        toast.error("Item not found in cart");
        return;
      }

      await cartApi.updateCartItem(cartItem.id, {
        quantity: quantity + 1,
      });
      setQuantity(quantity + 1);

      window.dispatchEvent(new CustomEvent("cartUpdated"));
    } catch (error: any) {
      console.error("Failed to update cart:", error);
      toast.error(error.response?.data?.message || "Failed to update cart");
    } finally {
      setUpdatingQty(false);
    }
  };

  const handleDecrease = async () => {
    if (!defaultVariant || updatingQty) return;

    try {
      setUpdatingQty(true);
      // Get current cart to find the cart item ID
      const cart = await cartApi.getCart();
      const cartItem = cart.items.find(
        (item) => item.variant?.id === defaultVariant.id
      );

      if (!cartItem) {
        toast.error("Item not found in cart");
        return;
      }

      if (quantity <= 1) {
        await cartApi.removeFromCart(cartItem.id);
        setQuantity(0);
      } else {
        await cartApi.updateCartItem(cartItem.id, {
          quantity: quantity - 1,
        });
        setQuantity(quantity - 1);
      }

      window.dispatchEvent(new CustomEvent("cartUpdated"));
    } catch (error: any) {
      console.error("Failed to update cart:", error);
      toast.error(error.response?.data?.message || "Failed to update cart");
    } finally {
      setUpdatingQty(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!defaultVariant) {
      console.error("No default variant available for wishlist");
      return;
    }

    if (!user && !localStorage.getItem("accessToken")) {
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

      window.dispatchEvent(new CustomEvent("wishlistUpdated"));
    } catch (error: any) {
      console.error("Failed to toggle wishlist:", error);
      toast.error(error.response?.data?.message || "Failed to update wishlist");
    } finally {
      setWishlistLoading(false);
    }
  };

  const getConditionBadge = (grade: string) => {
    const conditions = {
      A: {
        label: "Grade A",
        color: "bg-green-100 text-green-800 border-green-200",
      },
      B: {
        label: "Grade B",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      C: {
        label: "Grade C",
        color: "bg-orange-100 text-orange-800 border-orange-200",
      },
    };
    const condition =
      conditions[grade as keyof typeof conditions] || conditions.B;

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${condition.color}`}
      >
        {condition.label}
      </span>
    );
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-sm">
      <CardContent className="p-0">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gray-100">
          <Link href={`/products/${product.slug}`}>
            <img
              src={product.images?.[0]?.url || "/placeholder-product.jpg"}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </Link>

          {/* Wishlist Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleToggleWishlist();
            }}
            disabled={wishlistLoading || authLoading}
            className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-all duration-200 ${
              isInWishlist
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-white text-gray-600 hover:bg-gray-50"
            } ${wishlistLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Heart
              className={`w-4 h-4 ${isInWishlist ? "fill-current" : ""}`}
            />
          </button>

          {/* Condition Badge */}
          <div className="absolute top-3 left-3">
            {getConditionBadge(product.conditionGrade)}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-2">
            <Link href={`/products/${product.slug}`}>
              <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 hover:text-primary transition-colors">
                {product.title}
              </h3>
            </Link>
          </div>

          <p className="text-foreground-secondary text-sm mb-2">
            {product.brand?.name} • {product.warrantyMonths} months warranty
          </p>

          {/* Rating */}
          <div className="mb-3">
            <ProductRating
              productId={product.id}
              variant="compact"
              showReviewCount={false}
            />
          </div>

          {/* Price */}
          {price ? (
            <div className="flex items-center justify-between mb-4">
              <span className="text-xl font-bold text-price">
                ₹{price.toLocaleString()}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-4">
              <span className="text-xl font-bold text-price">
                Price not available
              </span>
            </div>
          )}

          {/* Cart Actions */}
          <div className="mt-4">
            {defaultVariant ? (
              defaultVariant.inventory?.inStock ? (
                quantity > 0 ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleDecrease}
                        disabled={updatingQty}
                        className="p-1 rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-medium min-w-[2rem] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={handleIncrease}
                        disabled={updatingQty}
                        className="p-1 rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => router.push("/cart")}
                      className="text-xs"
                    >
                      View Cart
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleAddToCart}
                    disabled={loading}
                    className="w-full"
                    size="sm"
                  >
                    {loading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Adding...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <ShoppingCart className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </div>
                    )}
                  </Button>
                )
              ) : (
                <Button disabled className="w-full" size="sm">
                  Out of Stock
                </Button>
              )
            ) : (
              <Button disabled className="w-full" size="sm">
                No variants available
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
