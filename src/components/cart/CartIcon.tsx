"use client";

import { useState, useEffect } from "react";
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

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const cartData = await cartApi.getCart();
      setCart(cartData);
    } catch (error) {
      console.error("Failed to load cart:", error);
    } finally {
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
        {cart && cart.totalItems > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {cart.totalItems > 99 ? "99+" : cart.totalItems}
          </Badge>
        )}
      </div>
    </Button>
  );
}
