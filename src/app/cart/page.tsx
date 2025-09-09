"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { cartApi, Cart, CartItem } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const cartData = await cartApi.getCart();
      setCart(cartData);
    } catch (error: any) {
      console.error("Failed to load cart:", error);
      toast.error("Failed to load cart");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      setUpdating(itemId);
      const updatedCart = await cartApi.updateCartItem(itemId, {
        quantity: newQuantity,
      });
      setCart(updatedCart);
      toast.success("Cart updated");
    } catch (error: any) {
      console.error("Failed to update cart item:", error);
      toast.error("Failed to update cart item");
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      setUpdating(itemId);
      const updatedCart = await cartApi.removeFromCart(itemId);
      setCart(updatedCart);
      toast.success("Item removed from cart");
    } catch (error: any) {
      console.error("Failed to remove item:", error);
      toast.error("Failed to remove item");
    } finally {
      setUpdating(null);
    }
  };

  const clearCart = async () => {
    if (!confirm("Are you sure you want to clear your cart?")) return;

    try {
      const updatedCart = await cartApi.clearCart();
      setCart(updatedCart);
      toast.success("Cart cleared");
    } catch (error: any) {
      console.error("Failed to clear cart:", error);
      toast.error("Failed to clear cart");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading cart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background-secondary">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="mb-8">
              <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mx-auto mb-6 border border-border">
                <ShoppingBag className="h-12 w-12 text-foreground-muted" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Your cart is empty
              </h1>
              <p className="text-foreground-muted mb-8 text-sm">
                Looks like you haven't added any items to your cart yet. Start
                shopping to add items to your cart.
              </p>
              <Link href="/products">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary-dark text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Shopping Cart
            </h1>
            <p className="text-sm text-foreground-muted mt-1">
              {cart.totalItems} {cart.totalItems === 1 ? "item" : "items"} in
              your cart
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearCart}
            className="text-xs px-3 py-1 h-7"
          >
            Clear Cart
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-surface rounded-lg border border-border">
              {/* Cart Header */}
              <div className="px-4 py-3 border-b border-border bg-background-secondary rounded-t-lg">
                <div className="flex items-center justify-between text-sm font-medium text-foreground-secondary">
                  <span>Product Details</span>
                  <div className="flex items-center gap-8">
                    <span>Quantity</span>
                    <span>Price</span>
                    <span>Total</span>
                  </div>
                </div>
              </div>

              {/* Cart Items */}
              <div className="divide-y divide-border">
                {cart.items.map((item) => (
                  <CartItemCard
                    key={item.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                    updating={updating === item.id}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-surface rounded-lg border border-border p-4 sticky top-4">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Order Summary
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">
                    Subtotal ({cart.totalItems} items)
                  </span>
                  <span className="text-foreground">
                    ₹{cart.subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">
                    Delivery Charges
                  </span>
                  <span className="text-success">FREE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Tax</span>
                  <span className="text-foreground">
                    ₹{cart.taxTotal.toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between text-base font-semibold">
                    <span className="text-foreground">Total Amount</span>
                    <span className="text-foreground">
                      ₹{cart.grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Button
                  className="w-full bg-primary hover:bg-primary-dark text-white"
                  size="lg"
                  onClick={() => router.push("/checkout")}
                >
                  Proceed to Checkout
                </Button>
                <Link href="/products">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </div>

              {/* Security Badge */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-foreground-muted">
                  <div className="w-4 h-4 bg-success rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span>Secure checkout with SSL encryption</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  updating: boolean;
}

function CartItemCard({
  item,
  onUpdateQuantity,
  onRemove,
  updating,
}: CartItemCardProps) {
  const [quantity, setQuantity] = useState(item.quantity);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    setQuantity(newQuantity);
    onUpdateQuantity(item.id, newQuantity);
  };

  return (
    <div className="p-4 hover:bg-background-secondary/50 transition-colors">
      <div className="flex items-center gap-4">
        {/* Product Image */}
        <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
          {item.product?.images?.[0]?.url ? (
            <Image
              src={item.product.images[0].url}
              alt={item.product.title}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ShoppingBag className="h-6 w-6" />
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-1">
            {item.product?.title || "Product Variant"}
          </h3>
          <div className="text-xs text-foreground-muted mb-2">
            {item.variant?.color && (
              <span className="mr-3">Color: {item.variant.color}</span>
            )}
            {item.variant?.storageGb && (
              <span className="mr-3">{item.variant.storageGb}GB Storage</span>
            )}
            {item.variant?.ramGb && <span>{item.variant.ramGb}GB RAM</span>}
          </div>
          <div className="text-xs text-foreground-muted">
            {item.product?.brand?.name && `Brand: ${item.product.brand.name}`}
            {item.variant?.sku && ` • SKU: ${item.variant.sku}`}
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuantityChange(quantity - 1)}
            disabled={updating || quantity <= 1}
            className="w-8 h-8 p-0"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-8 text-center text-sm font-medium">
            {quantity}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuantityChange(quantity + 1)}
            disabled={updating}
            className="w-8 h-8 p-0"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        {/* Price */}
        <div className="text-right min-w-[80px]">
          <div className="text-sm font-medium text-foreground">
            ₹{item.priceSnapshot.toLocaleString()}
          </div>
        </div>

        {/* Total */}
        <div className="text-right min-w-[80px]">
          <div className="text-sm font-semibold text-foreground">
            ₹{item.total.toLocaleString()}
          </div>
        </div>

        {/* Remove Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(item.id)}
          disabled={updating}
          className="w-8 h-8 p-0 text-foreground-muted hover:text-error"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
