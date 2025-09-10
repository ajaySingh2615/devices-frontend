"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Tag,
  Check,
  X,
  Loader2,
  Gift,
  Percent,
  IndianRupee,
} from "lucide-react";
import {
  cartApiWithCoupons,
  ApplyCouponRequest,
  CouponApplicationResult,
} from "@/lib/api";
import toast from "react-hot-toast";

interface CouponInputProps {
  onCouponApplied: (result: CouponApplicationResult) => void;
  onCouponRemoved: () => Promise<void>;
  appliedCoupon?: any;
  cartTotal: number;
}

export default function CouponInput({
  onCouponApplied,
  onCouponRemoved,
  appliedCoupon,
  cartTotal,
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    setIsLoading(true);
    try {
      const request: ApplyCouponRequest = {
        code: couponCode.trim().toUpperCase(),
      };
      console.log("Applying coupon with request:", request);
      const result = await cartApiWithCoupons.applyCoupon(request);
      console.log("Coupon application result:", result);

      if (result.success) {
        toast.success(result.message);
        onCouponApplied(result);
        setCouponCode("");
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error("Error applying coupon:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error response status:", error.response?.status);
      console.error("Error response headers:", error.response?.headers);
      toast.error(error.response?.data?.message || "Failed to apply coupon");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCoupon = async () => {
    setIsLoading(true);
    try {
      await onCouponRemoved();
      toast.success("Coupon removed successfully");
    } catch (error: any) {
      console.error("Error removing coupon:", error);
      toast.error("Failed to remove coupon");
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time validation can be added later if needed

  const formatDiscount = (coupon: any) => {
    if (coupon.type === "PERCENTAGE") {
      return `${coupon.value}% OFF`;
    } else {
      return `₹${coupon.value} OFF`;
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Applied Coupon Display */}
        {appliedCoupon ? (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-800"
                  >
                    {appliedCoupon.code}
                  </Badge>
                  <span className="text-sm font-medium text-green-800">
                    {formatDiscount(appliedCoupon)}
                  </span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  {appliedCoupon.name}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveCoupon}
              disabled={isLoading}
              className="text-green-600 hover:text-green-700 hover:bg-green-100"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          /* Coupon Input */
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="coupon-code" className="text-sm font-medium">
                Have a coupon code?
              </Label>
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="coupon-code"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleApplyCoupon();
                    }
                  }}
                  className="uppercase"
                  disabled={isLoading}
                />
              </div>
              <Button
                onClick={handleApplyCoupon}
                disabled={isLoading || !couponCode.trim()}
                className="px-6"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Apply"
                )}
              </Button>
            </div>

            {isValidating && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Validating coupon...
              </div>
            )}
          </div>
        )}

        {/* Available Coupons Hint */}
        {!appliedCoupon && (
          <div className="text-xs text-muted-foreground">
            <p>
              Popular codes: <span className="font-medium">WELCOME10</span>,{" "}
              <span className="font-medium">SAVE100</span>
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
