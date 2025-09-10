"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ShoppingBag,
  Shield,
  Truck,
  IndianRupee,
  Percent,
  Tag,
} from "lucide-react";
import { Cart } from "@/lib/api";

interface CartSummaryProps {
  cart: Cart;
  onProceedToCheckout: () => void;
}

export default function CartSummary({
  cart,
  onProceedToCheckout,
}: CartSummaryProps) {
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateSavings = () => {
    if (cart.couponDiscount && cart.couponDiscount > 0) {
      return cart.grandTotal - (cart.finalTotal || cart.grandTotal);
    }
    return 0;
  };

  const savings = calculateSavings();
  const finalTotal = cart.finalTotal || cart.grandTotal;

  return (
    <Card className="p-6 sticky top-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Order Summary</h3>
        </div>

        {/* Price Breakdown */}
        <div className="space-y-3">
          {/* Subtotal */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Subtotal ({cart.totalItems}{" "}
              {cart.totalItems === 1 ? "item" : "items"})
            </span>
            <span className="font-medium">{formatPrice(cart.subtotal)}</span>
          </div>

          {/* Tax */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax & Charges</span>
            <span className="font-medium">{formatPrice(cart.taxTotal)}</span>
          </div>

          {/* Delivery */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery Charges</span>
            <div className="flex items-center gap-1">
              <span className="font-medium text-green-600">FREE</span>
              <Badge
                variant="secondary"
                className="text-xs bg-green-100 text-green-800"
              >
                <Truck className="h-3 w-3 mr-1" />
                Standard
              </Badge>
            </div>
          </div>

          {/* Coupon Discount */}
          {cart.appliedCoupon &&
            cart.couponDiscount &&
            cart.couponDiscount > 0 && (
              <div className="flex justify-between text-sm border-t pt-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">
                    {cart.appliedCoupon.code}
                    {cart.appliedCoupon.type === "PERCENTAGE" ? (
                      <span className="ml-1">
                        ({cart.appliedCoupon.value}% OFF)
                      </span>
                    ) : (
                      <span className="ml-1">
                        (₹{cart.appliedCoupon.value} OFF)
                      </span>
                    )}
                  </span>
                </div>
                <span className="font-medium text-green-600">
                  -{formatPrice(cart.couponDiscount)}
                </span>
              </div>
            )}

          {/* Total */}
          <div className="flex justify-between text-lg font-semibold border-t pt-3">
            <span>Total Amount</span>
            <span>{formatPrice(finalTotal)}</span>
          </div>

          {/* Savings Display */}
          {savings > 0 && (
            <div className="flex justify-between text-sm text-green-600 bg-green-50 p-2 rounded-lg">
              <span className="flex items-center gap-1">
                <Percent className="h-4 w-4" />
                You Save
              </span>
              <span className="font-medium">{formatPrice(savings)}</span>
            </div>
          )}
        </div>

        {/* Security Badge */}
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <Shield className="h-4 w-4 text-blue-600" />
          <span className="text-xs text-blue-600 font-medium">
            Secure checkout with SSL encryption
          </span>
        </div>

        {/* Checkout Button */}
        <Button
          onClick={onProceedToCheckout}
          className="w-full h-12 text-base font-semibold"
          size="lg"
        >
          <IndianRupee className="h-4 w-4 mr-2" />
          Proceed to Checkout ({formatPrice(finalTotal)})
        </Button>

        {/* Additional Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Free delivery on orders above ₹999</p>
          <p>• 7-day return policy</p>
          <p>• 1-year warranty on all products</p>
        </div>
      </div>
    </Card>
  );
}
