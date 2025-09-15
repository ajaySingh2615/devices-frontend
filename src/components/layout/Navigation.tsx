"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  HiMenu,
  HiX,
  HiShoppingCart,
  HiHeart,
  HiUser,
  HiSearch,
} from "react-icons/hi";
import { Button } from "@/components/ui/Button";
import {
  catalogApi,
  Category,
  getTokens,
  clearTokens,
  userApi,
} from "@/lib/api";
import CartIcon from "@/components/cart/CartIcon";
import WishlistIcon from "@/components/wishlist/WishlistIcon";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    loadCategories();
    checkAuthStatus();

    const handleAuthStateChange = () => checkAuthStatus();
    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "accessToken" ||
        e.key === "refreshToken" ||
        e.key === null
      ) {
        checkAuthStatus();
      }
    };
    window.addEventListener("authStateChanged", handleAuthStateChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("authStateChanged", handleAuthStateChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // close mobile menu & user menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setUserMenuOpen(false);
    checkAuthStatus();
  }, [pathname]);

  // lock scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
  }, [isMenuOpen]);

  const loadCategories = async () => {
    try {
      const data = await catalogApi.getCategories();
      setCategories(data.slice(0, 6));
    } catch (e) {
      console.error("Failed to load categories:", e);
    }
  };

  const checkAuthStatus = async () => {
    const tokens = getTokens();
    const loggedIn = !!tokens.accessToken;
    setIsLoggedIn(loggedIn);
    if (!loggedIn) return setIsAdmin(false);

    try {
      const user = await userApi.getProfile();
      setIsAdmin(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN");
    } catch {
      setIsAdmin(false);
    }
  };

  const handleLogout = () => {
    clearTokens();
    setIsLoggedIn(false);
    setIsAdmin(false);
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* top bar */}
        <div className="flex h-14 items-center justify-between">
          {/* left: burger + logo (logo also clickable area) */}
          <div className="flex items-center gap-3">
            <Button
              aria-label="Open menu"
              variant="ghost"
              size="sm"
              className="md:hidden -ml-2"
              onClick={() => setIsMenuOpen(true)}
            >
              <HiMenu className="w-5 h-5" />
            </Button>

            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg grid place-items-center">
                <span className="text-primary font-bold text-sm">DH</span>
              </div>
              <span className="text-xl font-bold font-display text-foreground">
                DeviceHub
              </span>
            </Link>
          </div>

          {/* center: desktop links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/products"
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith("/products")
                  ? "text-primary"
                  : "text-foreground-secondary hover:text-primary"
              }`}
            >
              All Products
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/products?category=${c.slug}`}
                className="text-sm font-medium text-foreground-secondary hover:text-primary transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>

          {/* right: actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search */}
            <Button
              aria-label="Search"
              variant="ghost"
              size="sm"
              onClick={() => router.push("/products")}
            >
              <HiSearch className="w-5 h-5" />
            </Button>

            {/* Wishlist (hide on very small screens) */}
            <div className="hidden sm:block">
              <WishlistIcon />
            </div>

            {/* Cart */}
            <CartIcon />

            {/* Auth/User */}
            {isLoggedIn ? (
              <div className="relative">
                <Button
                  aria-haspopup="menu"
                  aria-expanded={userMenuOpen}
                  variant="ghost"
                  size="sm"
                  onClick={() => setUserMenuOpen((v) => !v)}
                >
                  <HiUser className="w-5 h-5" />
                </Button>
                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-surface rounded-lg shadow-lg border border-border py-2"
                    role="menu"
                  >
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm hover:bg-background-secondary"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/account/orders"
                      className="block px-4 py-2 text-sm hover:bg-background-secondary"
                    >
                      My Orders
                    </Link>
                    <Link
                      href="/account/profile"
                      className="block px-4 py-2 text-sm hover:bg-background-secondary"
                    >
                      Profile
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm hover:bg-background-secondary"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-error hover:bg-background-secondary"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // show auth buttons only on md+
              <div className="hidden md:flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/auth/login")}
                >
                  Sign In
                </Button>
                <Button size="sm" onClick={() => router.push("/auth/register")}>
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu (slide down panel) */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <span className="font-medium">Menu</span>
            <Button
              aria-label="Close menu"
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(false)}
            >
              <HiX className="w-5 h-5" />
            </Button>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 pb-4 space-y-3">
            <Link
              href="/products"
              className="block text-foreground-secondary hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              All Products
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/products?category=${c.slug}`}
                className="block text-foreground-secondary hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                {c.name}
              </Link>
            ))}

            {!isLoggedIn && (
              <>
                <hr />
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    router.push("/auth/login");
                    setIsMenuOpen(false);
                  }}
                >
                  Sign In
                </Button>
                <Button
                  className="w-full"
                  onClick={() => {
                    router.push("/auth/register");
                    setIsMenuOpen(false);
                  }}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
