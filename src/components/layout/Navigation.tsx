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
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    loadCategories();
    checkAuthStatus();

    // Check auth status on route changes
    const handleRouteChange = () => {
      checkAuthStatus();
    };

    // Listen for custom auth state changes
    const handleAuthStateChange = () => {
      checkAuthStatus();
    };

    // Listen for storage changes (when tokens are updated)
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

    // Also check on focus (when user comes back to tab)
    window.addEventListener("focus", handleRouteChange);

    return () => {
      window.removeEventListener("authStateChanged", handleAuthStateChange);
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleRouteChange);
    };
  }, []);

  // Check auth status whenever pathname changes
  useEffect(() => {
    checkAuthStatus();
  }, [pathname]);

  const loadCategories = async () => {
    try {
      const data = await catalogApi.getCategories();
      setCategories(data.slice(0, 6)); // Show top 6 categories
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const checkAuthStatus = async () => {
    const tokens = getTokens();
    const loggedIn = !!tokens.accessToken;
    setIsLoggedIn(loggedIn);

    if (loggedIn) {
      try {
        const user = await userApi.getProfile();
        const adminRole =
          user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN");
        setIsAdmin(adminRole || false);
      } catch (error) {
        console.error("Failed to get user info:", error);
        setIsAdmin(false);
      }
    } else {
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
    <nav className="bg-surface border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-primary font-bold text-sm">DH</span>
            </div>
            <span className="text-xl font-bold font-display text-foreground">
              DeviceHub
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
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

            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="text-sm font-medium text-foreground-secondary hover:text-primary transition-colors"
              >
                {category.name}
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/products")}
            >
              <HiSearch className="w-5 h-5" />
            </Button>

            {/* Cart */}
            <CartIcon />

            {/* Wishlist */}
            <WishlistIcon />

            {/* User Menu */}
            {isLoggedIn ? (
              <div className="relative group">
                <Button variant="ghost" size="sm">
                  <HiUser className="w-5 h-5" />
                </Button>
                <div className="absolute right-0 mt-2 w-48 bg-surface rounded-lg shadow-lg border border-border py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-sm text-foreground-secondary hover:bg-background-secondary"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/account/orders"
                    className="block px-4 py-2 text-sm text-foreground-secondary hover:bg-background-secondary"
                  >
                    My Orders
                  </Link>
                  <Link
                    href="/account/profile"
                    className="block px-4 py-2 text-sm text-foreground-secondary hover:bg-background-secondary"
                  >
                    Profile
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="block px-4 py-2 text-sm text-foreground-secondary hover:bg-background-secondary"
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
              </div>
            ) : (
              <div className="flex space-x-2">
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

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <HiX className="w-5 h-5" />
              ) : (
                <HiMenu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="space-y-4">
              <Link
                href="/products"
                className="block text-foreground-secondary hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                All Products
              </Link>

              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="block text-foreground-secondary hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}

              <hr />

              {!isLoggedIn && (
                <div className="space-y-2">
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
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
