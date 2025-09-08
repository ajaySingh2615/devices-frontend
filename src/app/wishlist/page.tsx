"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { wishlistApi, cartApi, Wishlist, WishlistItem } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Heart, ShoppingBag, ArrowLeft, Trash2, Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function WishlistPage() {
  const router = useRouter();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      const wishlistData = await wishlistApi.getWishlist();
      setWishlist(wishlistData);
    } catch (error: any) {
      console.error("Failed to load wishlist:", error);
      toast.error("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (itemId: string) => {
    try {
      setUpdating(itemId);
      const updatedWishlist = await wishlistApi.removeFromWishlist(itemId);
      setWishlist(updatedWishlist);
      toast.success("Item removed from wishlist");
    } catch (error: any) {
      console.error("Failed to remove item:", error);
      toast.error("Failed to remove item");
    } finally {
      setUpdating(null);
    }
  };

  const addToCart = async (variantId: string) => {
    try {
      setUpdating(variantId);
      await cartApi.addToCart({ variantId, quantity: 1 });
      toast.success("Item added to cart");
    } catch (error: any) {
      console.error("Failed to add to cart:", error);
      toast.error("Failed to add to cart");
    } finally {
      setUpdating(null);
    }
  };

  const clearWishlist = async () => {
    if (!confirm("Are you sure you want to clear your wishlist?")) return;

    try {
      const updatedWishlist = await wishlistApi.clearWishlist();
      setWishlist(updatedWishlist);
      toast.success("Wishlist cleared");
    } catch (error: any) {
      console.error("Failed to clear wishlist:", error);
      toast.error("Failed to clear wishlist");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading wishlist...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!wishlist || wishlist.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <Heart className="h-24 w-24 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Your wishlist is empty</h1>
            <p className="text-muted-foreground mb-8">
              Save items you love to your wishlist and they'll appear here.
            </p>
            <Link href="/products">
              <Button size="lg">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Wishlist</h1>
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">
            {wishlist.totalItems} {wishlist.totalItems === 1 ? "item" : "items"}
          </span>
          <Button variant="outline" onClick={clearWishlist}>
            Clear Wishlist
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {wishlist.items.map((item) => (
          <WishlistItemCard
            key={item.id}
            item={item}
            onRemove={removeFromWishlist}
            onAddToCart={addToCart}
            updating={updating === item.id || updating === item.variantId}
          />
        ))}
      </div>
    </div>
  );
}

interface WishlistItemCardProps {
  item: WishlistItem;
  onRemove: (itemId: string) => void;
  onAddToCart: (variantId: string) => void;
  updating: boolean;
}

function WishlistItemCard({
  item,
  onRemove,
  onAddToCart,
  updating,
}: WishlistItemCardProps) {
  const router = useRouter();

  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        {/* Product Image */}
        <div className="relative w-full h-48 bg-gray-100 rounded-t-lg overflow-hidden">
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ShoppingBag className="h-12 w-12" />
          </div>

          {/* Remove Button */}
          <Button
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onRemove(item.id)}
            disabled={updating}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Product Details */}
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
            Product Variant
          </h3>

          <div className="text-sm text-muted-foreground mb-3">
            {item.variant?.color && <div>Color: {item.variant.color}</div>}
            {item.variant?.storageGb && (
              <div>{item.variant.storageGb}GB Storage</div>
            )}
            {item.variant?.ramGb && <div>{item.variant.ramGb}GB RAM</div>}
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-semibold">
              ₹{item.variant?.priceSale?.toLocaleString() || "0"}
            </div>
            {item.variant?.priceMrp &&
              item.variant.priceMrp > item.variant.priceSale && (
                <div className="text-sm text-muted-foreground line-through">
                  ₹{item.variant.priceMrp.toLocaleString()}
                </div>
              )}
          </div>

          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={() => onAddToCart(item.variantId)}
              disabled={updating || !item.variant?.isActive}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(`/products`)}
            >
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
