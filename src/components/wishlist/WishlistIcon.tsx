"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { wishlistApi, Wishlist } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Heart } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface WishlistIconProps {
  className?: string;
}

export default function WishlistIcon({ className }: WishlistIconProps) {
  const router = useRouter();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();

    const handler = () => loadWishlist();
    if (typeof window !== "undefined") {
      window.addEventListener("wishlistUpdated", handler);
      window.addEventListener("authStateChanged", handler);
      window.addEventListener("focus", handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("wishlistUpdated", handler);
        window.removeEventListener("authStateChanged", handler);
        window.removeEventListener("focus", handler);
      }
    };
  }, []);

  const loadWishlist = async () => {
    try {
      const wishlistData = await wishlistApi.getWishlist();
      setWishlist(wishlistData);
    } catch (error) {
      console.error("Failed to load wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    router.push("/wishlist");
  };

  if (loading) {
    return (
      <Button variant="ghost" size="sm" className={className} disabled>
        <Heart className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      onClick={handleClick}
    >
      <div className="relative">
        <Heart className="h-5 w-5" />
        {wishlist && wishlist.totalItems > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {wishlist.totalItems > 99 ? "99+" : wishlist.totalItems}
          </Badge>
        )}
      </div>
    </Button>
  );
}
