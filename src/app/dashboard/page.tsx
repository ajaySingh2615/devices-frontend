"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { userApi, getTokens, clearTokens, User } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showSavedModal, setShowSavedModal] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "UNSPECIFIED">(
    "UNSPECIFIED"
  );
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [emailToken, setEmailToken] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const formatIst = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
      : "";

  useEffect(() => {
    (async () => {
      try {
        const tokens = getTokens();
        if (!tokens.accessToken) {
          router.push("/auth/login");
          return;
        }
        const u = await userApi.getProfile();
        setUser(u);
        const parts = (u.name || "").split(" ");
        setFirstName(parts[0] || "");
        setLastName(parts.slice(1).join(" ") || "");
        setEmail(u.email || "");
        setMobile(u.phone || "");
        if (u.gender) setGender(u.gender as any);
      } catch {
        clearTokens();
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const onSave = async () => {
    if (!user) return;
    try {
      setSaving(true);
      const payload = {
        name: [firstName, lastName].filter(Boolean).join(" "),
        phone: mobile || undefined,
        firstName,
        lastName,
        gender,
      } as const;
      await userApi.updateProfile(payload);
      // reflect changes locally
      setUser((prev) =>
        prev
          ? {
              ...prev,
              name: payload.name,
              phone: payload.phone,
              firstName,
              lastName,
              gender,
            }
          : prev
      );
      toast.success("Profile updated");
      setShowSavedModal(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <aside className="md:col-span-1">
          <Card>
            <CardContent className="p-0">
              <nav className="divide-y divide-border">
                <div className="p-4">
                  <div className="text-sm text-foreground-muted mb-2">
                    Hello,
                  </div>
                  <div className="font-semibold">{user?.name}</div>
                </div>
                <div className="p-4 space-y-1">
                  <div className="text-xs font-semibold text-foreground-muted mb-2">
                    MY ORDERS
                  </div>
                  <Link
                    href="/account/orders"
                    className="block px-3 py-2 rounded hover:bg-background"
                  >
                    My Orders
                  </Link>
                </div>
                <div className="p-4 space-y-1">
                  <div className="text-xs font-semibold text-foreground-muted mb-2">
                    ACCOUNT SETTINGS
                  </div>
                  <div className="px-3 py-2 rounded bg-background font-medium">
                    Profile Information
                  </div>
                  <Link
                    href="/account/addresses"
                    className="block px-3 py-2 rounded hover:bg-background"
                  >
                    Manage Addresses
                  </Link>
                  <button className="block w-full text-left px-3 py-2 rounded hover:bg-background text-foreground-muted cursor-not-allowed">
                    PAN Card Information
                  </button>
                </div>
                <div className="p-4 space-y-1">
                  <div className="text-xs font-semibold text-foreground-muted mb-2">
                    PAYMENTS
                  </div>
                  <button className="block w-full text-left px-3 py-2 rounded hover:bg-background">
                    Gift Cards
                  </button>
                  <button className="block w-full text-left px-3 py-2 rounded hover:bg-background">
                    Saved UPI
                  </button>
                  <button className="block w-full text-left px-3 py-2 rounded hover:bg-background">
                    Saved Cards
                  </button>
                </div>
                <div className="p-4 space-y-1">
                  <div className="text-xs font-semibold text-foreground-muted mb-2">
                    MY STUFF
                  </div>
                  <button className="block w-full text-left px-3 py-2 rounded hover:bg-background">
                    My Coupons
                  </button>
                  <button className="block w-full text-left px-3 py-2 rounded hover:bg-background">
                    My Reviews & Ratings
                  </button>
                  <button className="block w-full text-left px-3 py-2 rounded hover:bg-background">
                    All Notifications
                  </button>
                  <button className="block w-full text-left px-3 py-2 rounded hover:bg-background">
                    My Wishlist
                  </button>
                </div>
                <div className="p-4">
                  <Link
                    href="/auth/logout"
                    className="block px-3 py-2 rounded hover:bg-background"
                  >
                    Logout
                  </Link>
                </div>
              </nav>
            </CardContent>
          </Card>
        </aside>

        {/* Content */}
        <section className="md:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-foreground-muted">
                    First Name
                  </label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="text-sm text-foreground-muted">
                    Last Name
                  </label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <div className="text-sm text-foreground-muted mb-1">
                  Your Gender
                </div>
                <div className="flex items-center gap-6">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="gender"
                      className="accent-primary"
                      checked={gender === "MALE"}
                      onChange={() => setGender("MALE")}
                    />
                    Male
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="gender"
                      className="accent-primary"
                      checked={gender === "FEMALE"}
                      onChange={() => setGender("FEMALE")}
                    />
                    Female
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Email Address</CardTitle>
                {user?.emailVerifiedAt ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 text-xs">
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-xs">
                    Unverified
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
                <Button
                  variant="outline"
                  disabled={!!user?.googleSub && !user?.hasPassword}
                  onClick={async () => {
                    try {
                      const token = await userApi.requestEmailChange(email);
                      setEmailToken(token);
                      toast.success("Verification link sent");
                    } catch (e: any) {
                      const msg =
                        e?.response?.data?.message ||
                        e?.message ||
                        "Failed to send verification";
                      toast.error(msg);
                    }
                  }}
                >
                  Verify
                </Button>
              </div>
              {!!user?.googleSub && !user?.hasPassword && (
                <div className="text-xs text-foreground-muted">
                  Email is managed by Google for this account.
                </div>
              )}
              {user?.emailVerifiedAt && (
                <div className="text-xs text-foreground-muted">
                  Verified on {formatIst(user.emailVerifiedAt)}
                </div>
              )}
              {emailToken && (
                <div className="flex items-center gap-2">
                  <Input
                    value={emailToken}
                    onChange={(e) => setEmailToken(e.target.value)}
                    placeholder="Enter token"
                  />
                  <Button
                    onClick={async () => {
                      try {
                        const updated = await userApi.confirmEmail(emailToken);
                        setUser(updated);
                        setEmail(updated.email || "");
                        setEmailToken("");
                        toast.success("Email verified");
                      } catch (e: any) {
                        const msg =
                          e?.response?.data?.message ||
                          e?.message ||
                          "Invalid token";
                        toast.error(msg);
                      }
                    }}
                  >
                    Confirm
                  </Button>
                </div>
              )}
              {!user?.emailVerifiedAt && !emailToken && (
                <div className="text-xs text-foreground-muted">
                  Not verified. Click Verify to receive a code.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Mobile Number</CardTitle>
                {user?.phoneVerifiedAt ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 text-xs">
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 text-xs">
                    Unverified
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="+91xxxxxxxxxx"
                />
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const otp = await userApi.requestPhoneChange(mobile);
                      setPhoneOtp(otp);
                      toast.success("OTP sent");
                    } catch (e: any) {
                      const msg =
                        e?.response?.data?.message ||
                        e?.message ||
                        "Failed to send OTP";
                      toast.error(msg);
                    }
                  }}
                >
                  Send OTP
                </Button>
              </div>
              {user?.phoneVerifiedAt && (
                <div className="text-xs text-foreground-muted">
                  Verified on {formatIst(user.phoneVerifiedAt)}
                </div>
              )}
              {phoneOtp && (
                <div className="flex items-center gap-2">
                  <Input
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value)}
                    placeholder="Enter OTP"
                  />
                  <Button
                    onClick={async () => {
                      try {
                        const updated = await userApi.verifyPhone(phoneOtp);
                        setUser(updated);
                        setMobile(updated.phone || "");
                        setPhoneOtp("");
                        toast.success("Phone verified");
                      } catch (e: any) {
                        const msg =
                          e?.response?.data?.message ||
                          e?.message ||
                          "Invalid OTP";
                        toast.error(msg);
                      }
                    }}
                  >
                    Verify
                  </Button>
                </div>
              )}
              {!user?.phoneVerifiedAt && !phoneOtp && (
                <div className="text-xs text-foreground-muted">
                  Not verified. Click Send OTP to receive a code.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={onSave} disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>FAQs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-foreground-muted">
              <div>
                <div className="font-medium text-foreground">
                  What happens when I update my email address (or mobile
                  number)?
                </div>
                <p>
                  Your login email id (or mobile number) changes likewise.
                  You’ll receive all account related communication on your
                  updated email address (or mobile number).
                </p>
              </div>
              <div>
                <div className="font-medium text-foreground">
                  When will my account be updated with the new email address (or
                  mobile number)?
                </div>
                <p>
                  As soon as you confirm the verification code sent to your
                  email (or mobile) and save the changes.
                </p>
              </div>
              <div>
                <div className="font-medium text-foreground">
                  What happens to my existing account when I update my email
                  address (or mobile number)?
                </div>
                <p>
                  Updating your email (or mobile number) doesn’t invalidate your
                  account. Your account remains fully functional.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
      {/* Success Modal */}
      {showSavedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-md rounded-lg shadow-lg p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <svg
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Profile updated
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Your personal information has been saved successfully.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowSavedModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
