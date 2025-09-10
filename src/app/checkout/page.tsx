"use client";

import { useEffect, useState } from "react";
import {
  addressApi,
  AddressDto,
  cartApi,
  checkoutApi,
  CheckoutSummaryRequest,
  CheckoutSummaryResponse,
  CreateAddressRequest,
  UpdateAddressRequest,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { toast } from "react-hot-toast";
import Link from "next/link";

export default function CheckoutPage() {
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [couponCode, setCouponCode] = useState<string>("");
  const [summary, setSummary] = useState<CheckoutSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showAddressForm, setShowAddressForm] = useState<boolean>(false);
  const [editing, setEditing] = useState<AddressDto | null>(null);
  const [showOrderSummary, setShowOrderSummary] = useState<boolean>(false);
  const [showEmptyCartModal, setShowEmptyCartModal] = useState<boolean>(false);
  const [form, setForm] = useState<CreateAddressRequest>({
    name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    isDefault: false,
  });

  useEffect(() => {
    const init = async () => {
      try {
        const list = await addressApi.list();
        setAddresses(list);
        const def = list.find((a) => a.isDefault) || list[0];
        if (def) setSelectedAddressId(def.id);
      } catch (e: any) {
        toast.error(e?.message || "Failed to load addresses");
      }
    };
    init();
  }, []);

  const fetchSummary = async () => {
    if (!selectedAddressId) {
      toast.error("Please select an address");
      return;
    }
    setLoading(true);
    try {
      const body: CheckoutSummaryRequest = {
        addressId: selectedAddressId,
        couponCode: couponCode || undefined,
        paymentMethod: "RAZORPAY",
      };
      const res = await checkoutApi.summarize(body);
      setSummary(res);
      setShowOrderSummary(true);
    } catch (e: any) {
      toast.error(e?.message || "Failed to fetch summary");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      await cartApi.updateCartItem(itemId, { quantity: newQuantity });
      // Refresh the summary after quantity update
      await fetchSummary();
      // Dispatch cart updated event for navbar badge
      window.dispatchEvent(new CustomEvent("cartUpdated"));
      toast.success("Quantity updated");
    } catch (e: any) {
      toast.error(e?.message || "Failed to update quantity");
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      await cartApi.removeFromCart(itemId);
      // Refresh the summary after removal
      const body: CheckoutSummaryRequest = {
        addressId: selectedAddressId,
        couponCode: couponCode || undefined,
        paymentMethod: "RAZORPAY",
      };
      const res = await checkoutApi.summarize(body);
      setSummary(res);

      // Dispatch cart updated event for navbar badge
      window.dispatchEvent(new CustomEvent("cartUpdated"));

      // Check if cart is now empty
      if (res.items.length === 0) {
        setShowEmptyCartModal(true);
        setShowOrderSummary(false);
      } else {
        toast.success("Item removed from cart");
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to remove item");
    }
  };

  const currency = (n: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n);

  const resetForm = () => {
    setEditing(null);
    setForm({
      name: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
      isDefault: false,
    });
  };

  const submitAddress = async () => {
    try {
      if (
        !form.name ||
        !form.line1 ||
        !form.city ||
        !form.state ||
        !form.country ||
        !form.pincode
      ) {
        toast.error("Please fill all required fields");
        return;
      }
      if (!/^[0-9]{6}$/.test(form.pincode)) {
        toast.error("Invalid PIN code");
        return;
      }
      if (editing) {
        const payload: UpdateAddressRequest = { ...form };
        await addressApi.update(editing.id, payload);
        toast.success("Address updated");
      } else {
        const payload: CreateAddressRequest = { ...form };
        await addressApi.create(payload);
        toast.success("Address added");
      }
      setShowAddressForm(false);
      resetForm();
      const list = await addressApi.list();
      setAddresses(list);
      const def = list.find((a) => a.isDefault) || list[0];
      if (def) setSelectedAddressId(def.id);
    } catch (e: any) {
      toast.error(e?.message || "Failed to save address");
    }
  };

  const openAddAddress = () => {
    resetForm();
    setEditing(null);
    setShowAddressForm(true);
  };

  const openEditAddress = (a: AddressDto) => {
    setEditing(a);
    setForm({
      name: a.name,
      phone: a.phone || "",
      line1: a.line1,
      line2: a.line2 || "",
      city: a.city,
      state: a.state,
      country: a.country,
      pincode: a.pincode,
      isDefault: a.isDefault,
    });
    setShowAddressForm(true);
  };

  return (
    <>
      <div className="container mx-auto p-4 max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* Step 1: Delivery Address */}
          <Card className="mb-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold">
                    1
                  </span>
                  <CardTitle>Delivery Address</CardTitle>
                  {selectedAddressId && (
                    <span className="text-green-600 text-sm">✓</span>
                  )}
                </div>
                <div className="flex gap-2">
                  {!showOrderSummary && (
                    <>
                      <Button variant="outline" onClick={openAddAddress}>
                        + Add New Address
                      </Button>
                      <Link
                        href="/account/addresses"
                        className="text-sm underline"
                      >
                        Manage all addresses
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            {!showOrderSummary && (
              <CardContent>
                <div className="space-y-3">
                  {addresses.map((a) => (
                    <div
                      key={a.id}
                      className={`border rounded-md p-3 ${
                        selectedAddressId === a.id ? "ring-2 ring-blue-600" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === a.id}
                          onChange={() => setSelectedAddressId(a.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{a.name}</span>
                            {a.isDefault && <Badge>Default</Badge>}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <div>{a.line1}</div>
                            {a.line2 && <div>{a.line2}</div>}
                            <div>
                              {a.city}, {a.state}
                            </div>
                            <div>
                              {a.country} - {a.pincode}
                            </div>
                            {a.phone && <div>Phone: {a.phone}</div>}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedAddressId(a.id);
                                fetchSummary();
                              }}
                            >
                              Deliver here
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditAddress(a)}
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {addresses.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      No addresses found. Add a delivery address to proceed.
                      <div className="mt-3">
                        <Button onClick={openAddAddress}>
                          + Add New Address
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Input
                    placeholder="Coupon code (optional)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <Button onClick={fetchSummary} disabled={loading}>
                    Get Summary
                  </Button>
                </div>
              </CardContent>
            )}
            {showOrderSummary && selectedAddressId && (
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {addresses.find((a) => a.id === selectedAddressId)?.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {addresses.find((a) => a.id === selectedAddressId)?.line1}
                      {addresses.find((a) => a.id === selectedAddressId)
                        ?.line2 &&
                        `, ${
                          addresses.find((a) => a.id === selectedAddressId)
                            ?.line2
                        }`}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {addresses.find((a) => a.id === selectedAddressId)?.city},{" "}
                      {addresses.find((a) => a.id === selectedAddressId)?.state}{" "}
                      -{" "}
                      {
                        addresses.find((a) => a.id === selectedAddressId)
                          ?.pincode
                      }
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowOrderSummary(false)}
                  >
                    CHANGE
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Step 2: Order Summary */}
          {showOrderSummary && summary && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-semibold">
                    2
                  </span>
                  <CardTitle>Order Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Product Items */}
                  {summary.items.map((item) => (
                    <div key={item.id} className="flex gap-4 border-b pb-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                        {item.product?.images &&
                        item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0].url}
                            alt={item.product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-gray-500">
                            No Image
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {item.product?.title || "Product"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Delivery by{" "}
                          {new Date(
                            Date.now() + 3 * 24 * 60 * 60 * 1000
                          ).toLocaleDateString("en-IN", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm font-medium">
                            {currency(item.priceSnapshot)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            x{item.quantity}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="h-6 w-6 p-0"
                            disabled={item.quantity <= 1}
                          >
                            -
                          </Button>
                          <span className="text-sm">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="h-6 w-6 p-0"
                          >
                            +
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="ml-2"
                            onClick={() => removeItem(item.id)}
                          >
                            REMOVE
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Email Confirmation */}
                  <div className="text-sm text-muted-foreground">
                    Order confirmation email will be sent to your registered
                    email address.
                  </div>

                  {/* Continue Button */}
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                    CONTINUE
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="md:sticky md:top-4 h-fit">
          <Card>
            <CardHeader>
              <CardTitle>Price Details</CardTitle>
            </CardHeader>
            <CardContent>
              {!summary ? (
                <div className="text-sm text-muted-foreground">
                  Select address and click Get Summary.
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{currency(summary.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>
                      {summary.shipping === 0
                        ? "Free"
                        : currency(summary.shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{currency(summary.tax)}</span>
                  </div>
                  {summary.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{currency(summary.discount)}</span>
                    </div>
                  )}
                  <div className="border-t my-2"></div>
                  <div className="flex justify-between font-semibold text-base">
                    <span>Total Payable</span>
                    <span>{currency(summary.grandTotal)}</span>
                  </div>
                  {summary.appliedCoupon && (
                    <div className="text-xs text-green-700 bg-green-50 rounded px-2 py-1">
                      Your total savings on this order{" "}
                      {summary.discount > 0
                        ? `is ${currency(summary.discount)}`
                        : ""}
                      . Applied coupon: {summary.appliedCoupon.code}
                    </div>
                  )}
                  <div className="mt-3 text-[12px] text-muted-foreground flex items-start gap-2">
                    <span className="mt-0.5">🔒</span>
                    <span>
                      Safe and secure payments powered by Razorpay. Easy
                      returns. 100% authentic products.
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {showAddressForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-xl rounded-md shadow-lg">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editing ? "Edit Address" : "Add New Address"}
              </h2>
              <button
                className="text-sm"
                onClick={() => setShowAddressForm(false)}
              >
                Close
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Address Line 1</Label>
                  <Input
                    value={form.line1}
                    onChange={(e) =>
                      setForm({ ...form, line1: e.target.value })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Address Line 2 (optional)</Label>
                  <Input
                    value={form.line2}
                    onChange={(e) =>
                      setForm({ ...form, line2: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={form.state}
                    onChange={(e) =>
                      setForm({ ...form, state: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input
                    value={form.country}
                    onChange={(e) =>
                      setForm({ ...form, country: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>PIN Code</Label>
                  <Input
                    value={form.pincode}
                    onChange={(e) =>
                      setForm({ ...form, pincode: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input
                  id="isDefault"
                  type="checkbox"
                  checked={!!form.isDefault}
                  onChange={(e) =>
                    setForm({ ...form, isDefault: e.target.checked })
                  }
                />
                <Label htmlFor="isDefault">Set as default</Label>
              </div>
              <div className="flex gap-2 mt-4 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowAddressForm(false)}
                >
                  Cancel
                </Button>
                <Button onClick={submitAddress}>
                  {editing ? "Update" : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty Cart Modal */}
      {showEmptyCartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
                <svg
                  className="h-8 w-8 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Your checkout has no items
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Add some items to your cart to continue with checkout
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowEmptyCartModal(false)}
                >
                  Stay Here
                </Button>
                <Link href="/cart">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    GO TO CART
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
