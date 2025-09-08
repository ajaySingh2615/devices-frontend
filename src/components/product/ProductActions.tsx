"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { cartApi, wishlistApi, ProductVariant } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Heart, ShoppingCart, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ProductActionsProps {
  variant: ProductVariant;
  className?: string;
}

export default function ProductActions({
  variant,
  className,
}: ProductActionsProps) {
  const { user, loading: authLoading } = useAuth();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      checkWishlistStatus();
    }
  }, [authLoading, user, variant.id]);

  const checkWishlistStatus = async () => {
    try {
      const inWishlist = await wishlistApi.isInWishlist(variant.id);
      setIsInWishlist(inWishlist);
    } catch (error) {
      console.error("Failed to check wishlist status:", error);
    }
  };

  const handleAddToCart = async () => {
    if (!variant.inventory?.inStock) {
      toast.error("This variant is not available");
      return;
    }

    try {
      setLoading(true);
      await cartApi.addToCart({ variantId: variant.id, quantity: 1 });
      toast.success("Added to cart");
    } catch (error: any) {
      console.error("Failed to add to cart:", error);
      toast.error(error.response?.data?.message || "Failed to add to cart");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (authLoading) {
      // Avoid incorrect prompt while auth is resolving
      toast.loading("Checking your session...", { id: "authLoading" });
      setTimeout(() => toast.dismiss("authLoading"), 800);
      return;
    }
    if (!user) {
      toast.error("Please login to add items to wishlist");
      return;
    }

    try {
      setWishlistLoading(true);
      if (isInWishlist) {
        await wishlistApi.removeFromWishlistByVariant(variant.id);
        setIsInWishlist(false);
        toast.success("Removed from wishlist");
      } else {
        await wishlistApi.addToWishlist({ variantId: variant.id });
        setIsInWishlist(true);
        toast.success("Added to wishlist");
      }
    } catch (error: any) {
      console.error("Failed to toggle wishlist:", error);
      toast.error(error.response?.data?.message || "Failed to update wishlist");
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Button
        className="w-full"
        size="lg"
        onClick={handleAddToCart}
        disabled={loading || !variant.inventory?.inStock}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
        ) : (
          <ShoppingCart className="h-4 w-4 mr-2" />
        )}
        {variant.inventory?.inStock ? "Add to Cart" : "Out of Stock"}
      </Button>

      <Button
        variant="outline"
        className="w-full"
        size="lg"
        onClick={handleToggleWishlist}
        disabled={wishlistLoading}
      >
        {wishlistLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
        ) : (
          <Heart
            className={`h-4 w-4 mr-2 ${
              isInWishlist ? "fill-red-500 text-red-500" : ""
            }`}
          />
        )}
        {isInWishlist ? "In Wishlist" : "Add to Wishlist"}
      </Button>
    </div>
  );
}
