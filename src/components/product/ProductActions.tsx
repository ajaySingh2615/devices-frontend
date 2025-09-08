"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { cartApi, wishlistApi, ProductVariant } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Heart, ShoppingCart, Plus, Minus } from "lucide-react";
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
  const [quantity, setQuantity] = useState<number>(0);
  const [updatingQty, setUpdatingQty] = useState<boolean>(false);

  useEffect(() => {
    if (!authLoading && user) {
      checkWishlistStatus();
      checkCartStatus();
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

  const checkCartStatus = async () => {
    try {
      const cart = await cartApi.getCart();
      const cartItem = cart.items?.find(
        (item) => item.variantId === variant.id
      );
      setQuantity(cartItem?.quantity || 0);
    } catch (error) {
      console.error("Failed to check cart status:", error);
    }
  };

  const handleAddToCart = async () => {
    if (!variant.inventory?.inStock) {
      toast.error("This variant is not available");
      return;
    }

    try {
      setLoading(true);
      const result = await cartApi.addToCart({
        variantId: variant.id,
        quantity: 1,
      });
      // Find quantity for this variant from returned cart and update local state
      const currentItem = result.items?.find((i) => i.variantId === variant.id);
      setQuantity(currentItem?.quantity || 1);
      toast.success("Added to cart");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cartUpdated"));
      }
    } catch (error: any) {
      console.error("Failed to add to cart:", error);
      toast.error(error.response?.data?.message || "Failed to add to cart");
    } finally {
      setLoading(false);
    }
  };

  const handleIncrease = async () => {
    try {
      setUpdatingQty(true);
      const result = await cartApi.addToCart({
        variantId: variant.id,
        quantity: 1,
      });
      const currentItem = result.items?.find((i) => i.variantId === variant.id);
      setQuantity(currentItem?.quantity || quantity + 1);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cartUpdated"));
      }
    } catch (error: any) {
      console.error("Failed to increase quantity:", error);
      toast.error(error.response?.data?.message || "Failed to update quantity");
    } finally {
      setUpdatingQty(false);
    }
  };

  const handleDecrease = async () => {
    if (quantity <= 1) {
      // Removing the only unit should remove the item
      try {
        setUpdatingQty(true);
        // Need the cart item id; fetch cart and remove matching item
        const currentCart = await cartApi.getCart();
        const item = currentCart.items.find((i) => i.variantId === variant.id);
        if (item) {
          const result = await cartApi.removeFromCart(item.id);
          setQuantity(0);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("cartUpdated"));
          }
        }
      } catch (error: any) {
        console.error("Failed to decrease quantity:", error);
        toast.error(
          error.response?.data?.message || "Failed to update quantity"
        );
      } finally {
        setUpdatingQty(false);
      }
      return;
    }

    try {
      setUpdatingQty(true);
      // Decrease by 1 using updateCartItem
      const currentCart = await cartApi.getCart();
      const item = currentCart.items.find((i) => i.variantId === variant.id);
      if (item) {
        const result = await cartApi.updateCartItem(item.id, {
          quantity: item.quantity - 1,
        });
        const updated = result.items.find((i) => i.variantId === variant.id);
        setQuantity(updated?.quantity || Math.max(0, quantity - 1));
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("cartUpdated"));
        }
      }
    } catch (error: any) {
      console.error("Failed to decrease quantity:", error);
      toast.error(error.response?.data?.message || "Failed to update quantity");
    } finally {
      setUpdatingQty(false);
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
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("wishlistUpdated"));
        }
      } else {
        await wishlistApi.addToWishlist({ variantId: variant.id });
        setIsInWishlist(true);
        toast.success("Added to wishlist");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("wishlistUpdated"));
        }
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
      {quantity > 0 ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleDecrease}
            disabled={updatingQty}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="min-w-[3rem] text-center font-medium">{quantity}</div>
          <Button
            size="icon"
            onClick={handleIncrease}
            disabled={updatingQty || !variant.inventory?.inStock}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      ) : (
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
      )}

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
