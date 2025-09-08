"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { wishlistApi, Wishlist } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Heart } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";

interface WishlistIconProps {
  className?: string;
}

export default function WishlistIcon({ className }: WishlistIconProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!authLoading) {
      loadWishlist();
    }

    const handler = () => {
      if (!authLoading) {
        loadWishlist();
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("wishlistUpdated", handler);
      window.addEventListener("authStateChanged", handler);
      // removed window 'focus' listener to avoid frequent reloads
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("wishlistUpdated", handler);
        window.removeEventListener("authStateChanged", handler);
        window.removeEventListener("focus", handler);
      }
    };
  }, [authLoading, user]);

  const loadWishlist = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    if (!user) {
      setWishlist(null);
      setLoading(false);
      inFlight.current = false;
      return;
    }

    try {
      const wishlistData = await wishlistApi.getWishlist();
      setWishlist(wishlistData);
    } catch (error) {
      console.error("Failed to load wishlist:", error);
      setWishlist(null);
    } finally {
      inFlight.current = false;
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
