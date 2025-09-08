"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { cartApi, Cart } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface CartIconProps {
  className?: string;
}

export default function CartIcon({ className }: CartIconProps) {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const inFlight = useRef(false);

  useEffect(() => {
    loadCart();

    const handler = () => loadCart();
    if (typeof window !== "undefined") {
      window.addEventListener("cartUpdated", handler);
      window.addEventListener("authStateChanged", handler);
      // removed window 'focus' listener to avoid noisy reloads
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("cartUpdated", handler);
        window.removeEventListener("authStateChanged", handler);
      }
    };
  }, []);

  const loadCart = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const cartData = await cartApi.getCart();
      setCart(cartData);
    } catch (error) {
      console.error("Failed to load cart:", error);
      setCart(null);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  };

  const handleClick = () => {
    router.push("/cart");
  };

  if (loading) {
    return (
      <Button variant="ghost" size="sm" className={className} disabled>
        <ShoppingCart className="h-5 w-5" />
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
        <ShoppingCart className="h-5 w-5" />
        {cart && cart.items && cart.items.length > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {cart.items.length > 99 ? "99+" : cart.items.length}
          </Badge>
        )}
      </div>
    </Button>
  );
}
