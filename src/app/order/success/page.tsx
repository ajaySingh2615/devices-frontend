"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Package, Truck } from "lucide-react";

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    // TODO: Fetch order details using orderId
    if (orderId) {
      // For now, just set some mock data
      setOrderDetails({
        id: orderId,
        status: "PAID",
        total: "₹1,999",
        estimatedDelivery: "3-5 business days",
      });
    }
  }, [orderId]);

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">
            Order Placed Successfully!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-lg text-gray-600 mb-2">
              Thank you for your purchase! Your order has been confirmed.
            </p>
            {orderId && (
              <p className="text-sm text-gray-500">
                Order ID:{" "}
                <span className="font-mono font-medium">{orderId}</span>
              </p>
            )}
          </div>

          {orderDetails && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Order Total:</span>
                <span className="font-semibold">{orderDetails.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status:</span>
                <span className="text-green-600 font-medium">
                  {orderDetails.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Estimated Delivery:
                </span>
                <span className="text-sm">
                  {orderDetails.estimatedDelivery}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Package className="h-4 w-4" />
              <span>We'll send you a confirmation email shortly</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Truck className="h-4 w-4" />
              <span>You can track your order in your account</span>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Link href="/account/orders">
              <Button variant="outline">View Orders</Button>
            </Link>
            <Link href="/">
              <Button>Continue Shopping</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
