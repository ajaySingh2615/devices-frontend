"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  HiShoppingBag,
  HiShieldCheck,
  HiTruck,
  HiStar,
  HiArrowRight,
  HiRefresh,
} from "react-icons/hi";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { catalogApi, Category, Product } from "@/lib/api";

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const [categoriesData, productsData] = await Promise.all([
        catalogApi.getCategories(),
        catalogApi.searchProducts({
          size: 8,
          sort: "createdAt",
          direction: "desc",
        }),
      ]);

      setCategories(categoriesData);
      setFeaturedProducts(productsData.content);
    } catch (error) {
      console.error("Failed to load home data:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-background via-background-secondary to-background-tertiary">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground font-display mb-6 leading-tight">
              Premium Refurbished
              <span className="block text-primary">Electronics</span>
            </h1>
            <p className="text-xl text-foreground-secondary mb-8 max-w-3xl mx-auto">
              Get the latest smartphones, laptops, and tablets at unbeatable
              prices. All devices come with quality guarantee and warranty.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="w-full sm:w-auto">
                  <HiShoppingBag className="w-5 h-5" />
                  Start Shopping
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground font-display mb-4">
              Why Choose DeviceHub?
            </h2>
            <p className="text-lg text-foreground-secondary">
              We ensure every device meets our high standards of quality and
              reliability
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <HiShieldCheck className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2 font-display">
                Quality Guaranteed
              </h3>
              <p className="text-foreground-muted">
                Every device undergoes rigorous testing and comes with our
                quality guarantee
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-accent/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <HiTruck className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2 font-display">
                Free Shipping
              </h3>
              <p className="text-foreground-muted">
                Free shipping on all orders over $50 with fast and secure
                delivery
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <HiStar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2 font-display">
                30-Day Returns
              </h3>
              <p className="text-foreground-muted">
                Not satisfied? Return any device within 30 days for a full
                refund
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white font-display mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of satisfied customers and find your perfect device
            today
          </p>
          <Link href="/auth/register">
            <Button
              variant="secondary"
              size="lg"
              className="bg-white text-primary hover:bg-white/90"
            >
              Create Your Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-display text-foreground mb-4">
              Shop by Category
            </h2>
            <p className="text-foreground-secondary max-w-2xl mx-auto">
              Discover our wide range of refurbished electronics across
              different categories
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-background-secondary rounded-full mx-auto mb-4" />
                    <div className="h-4 bg-background-secondary rounded mb-2" />
                    <div className="h-3 bg-background-secondary rounded w-2/3 mx-auto" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">
                          {getCategoryIcon(category.slug)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {category.name}
                      </h3>
                      <p className="text-sm text-foreground-secondary">
                        View Collection
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold font-display text-foreground mb-2">
                Featured Products
              </h2>
              <p className="text-foreground-secondary">
                Handpicked deals you won't want to miss
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/products")}
            >
              View All
              <HiArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-0">
                    <div className="aspect-square bg-background-secondary rounded-t-lg" />
                    <div className="p-4">
                      <div className="h-4 bg-background-secondary rounded mb-2" />
                      <div className="h-4 bg-background-secondary rounded w-2/3 mb-4" />
                      <div className="h-6 bg-background-secondary rounded w-1/2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold font-display mb-4">
            Stay Updated with Latest Deals
          </h2>
          <p className="text-white font-bold mb-8">
            Subscribe to our newsletter and be the first to know about new
            arrivals and exclusive offers
          </p>

          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg bg-white text-black placeholder-gray-500 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button className="bg-white text-primary hover:bg-gray-100">
              Subscribe
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Grid with logo spanning 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-8 items-start">
            {/* Logo + description (span 2 cols) */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-lg font-bold text-white">D</span>
                </div>
                <span className="text-xl font-bold font-display">
                  DeviceHub
                </span>
              </div>
              <p className="text-white/70">
                Premium refurbished electronics with quality guarantee and
                warranty.
              </p>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-white/70">
                <li>
                  <a href="#" className="hover:text-white">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Press
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-white/70">
                <li>
                  <a href="#" className="hover:text-white">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Returns
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Warranty
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Shipping
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-white/70">
                <li>
                  <a href="/terms" className="hover:text-white">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="hover:text-white">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom copyright */}
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/70">
            <p>&copy; 2024 DeviceHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper function for category icons
function getCategoryIcon(slug: string) {
  const icons: Record<string, string> = {
    laptops: "💻",
    "mobile-phones": "📱",
    tablets: "📱",
    cameras: "📷",
    printers: "🖨️",
  };
  return icons[slug] || "📦";
}

// Product Card Component
function ProductCard({ product }: { product: Product }) {
  const getConditionBadge = (grade: string) => {
    const colors = {
      A: "bg-secondary/10 text-secondary",
      B: "bg-warning/10 text-warning",
      C: "bg-accent/10 text-accent",
    };
    const labels = {
      A: "Excellent",
      B: "Good",
      C: "Fair",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[grade as keyof typeof colors]
        }`}
      >
        Grade {grade}
      </span>
    );
  };

  const getLowestPrice = () => {
    if (!product.variants?.length) return null;
    return Math.min(...product.variants.map((v) => v.priceSale));
  };

  const price = getLowestPrice();

  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
        <CardContent className="p-0">
          <div className="aspect-square bg-background-secondary rounded-t-lg flex items-center justify-center">
            {product.images?.length ? (
              <img
                src={product.images[0].url}
                alt={product.title}
                className="w-full h-full object-cover rounded-t-lg"
              />
            ) : (
              <div className="text-foreground-muted text-6xl">📱</div>
            )}
          </div>

          <div className="p-4">
            <div className="mb-2">
              {getConditionBadge(product.conditionGrade)}
            </div>

            <h3 className="text-sm font-semibold text-foreground mb-2 line-clamp-2">
              {product.title}
            </h3>

            <div className="flex items-center mb-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <HiStar key={i} className="w-3 h-3 text-rating" />
                ))}
              </div>
              <span className="text-xs text-foreground-secondary ml-1">
                (4.5)
              </span>
            </div>

            {price && (
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-price">
                  ₹{price.toLocaleString()}
                </span>
                <span className="text-xs text-foreground-muted">
                  Starting from
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
