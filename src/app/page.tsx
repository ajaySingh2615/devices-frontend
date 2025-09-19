"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HiShoppingBag,
  HiShieldCheck,
  HiTruck,
  HiStar,
  HiArrowRight,
  HiRefresh,
  HiBadgeCheck,
  HiClock,
  HiCreditCard,
} from "react-icons/hi";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { catalogApi, Category, Product } from "@/lib/api";
import "./home.css";

/* ---------- tiny in-view hook (no dependencies) ---------- */
function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!ref.current || inView) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.15, ...options }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [options, inView]);

  return { ref, inView };
}

/* ---------- parallax hook for hero overlay ---------- */
function useParallax() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const onScroll = () => setY(window.scrollY || 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return y;
}

export default function Home() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [categoriesData, productsData] = await Promise.all([
          catalogApi.getCategories(),
          catalogApi.searchProducts({
            size: 12,
            sort: "createdAt",
            direction: "desc",
          }),
        ]);
        setCategories(categoriesData);
        setFeaturedProducts(productsData.content);
      } catch (err) {
        console.error("Failed to load home data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const scrollY = useParallax();

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Assurance Bar (Cashify-like trust signals) */}
      <AssuranceBar />

      {/* Hero Section with subtle parallax overlay */}
      <section className="home-hero">
        <div
          className="home-hero-overlay"
          style={{ transform: `translateY(${scrollY * 0.08}px)` }}
        />
        <div className="home-container relative">
          <div className="text-center">
            <h1 className="home-hero-title reveal-up in-view">
              Premium Refurbished{" "}
              <span className="home-hero-accent">Electronics</span>
            </h1>
            <p className="home-hero-sub reveal-up delay-1 in-view">
              Get the latest smartphones, laptops, and tablets at unbeatable
              prices. All devices come with quality guarantee and warranty.
            </p>
            <div className="home-hero-ctas reveal-up delay-2 in-view">
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

          {/* Brand strip (auto-scroll) */}
          <BrandStrip />
        </div>
      </section>

      {/* Feature highlights (QC, Replacement, Warranty …) */}
      <RevealSection>
        <section className="home-section">
          <div className="home-container">
            <div className="text-center mb-16">
              <h2 className="home-section-title">Why Choose DeviceHub?</h2>
              <p className="home-section-sub">
                We ensure every device meets our high standards of quality and
                reliability
              </p>
            </div>

            <div className="home-feature-grid">
              <FeatureCard
                icon={<HiShieldCheck className="w-8 h-8" />}
                iconBg="rgba(5,150,105,.10)"
                iconColor="var(--color-secondary)"
                title="32-Point Quality Check"
                sub="Every device is tested thoroughly for performance, battery, display & ports."
              />
              <FeatureCard
                icon={<HiRefresh className="w-8 h-8" />}
                iconBg="rgba(245,158,11,.10)"
                iconColor="var(--color-accent)"
                title="15-Day Replacement"
                sub="If something’s off, we’ll replace it quickly—no long forms."
              />
              <FeatureCard
                icon={<HiBadgeCheck className="w-8 h-8" />}
                iconBg="rgba(37,99,235,.10)"
                iconColor="var(--color-primary)"
                title="6-Month Warranty"
                sub="Peace of mind on all refurbished devices you buy from us."
              />
            </div>
          </div>
        </section>
      </RevealSection>

      {/* Horizontal Category Scroller (Cashify vibe) */}
      <RevealSection>
        <section className="home-section-surface">
          <div className="home-container">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="home-section-title">Shop by Category</h2>
                <p className="home-section-sub">
                  Discover our wide range of refurbished electronics across
                  categories
                </p>
              </div>
              {!loading && (
                <Button
                  variant="outline"
                  onClick={() => router.push("/products")}
                >
                  View All <HiArrowRight className="ml-2 w-4 h-4" />
                </Button>
              )}
            </div>

            {loading ? (
              <div className="cat-scroll">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="cat-pill skeleton" />
                ))}
              </div>
            ) : (
              <div className="cat-scroll">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/products?category=${c.slug}`}
                    className="cat-pill"
                  >
                    <span className="cat-emoji">{getCategoryIcon(c.slug)}</span>
                    <span className="cat-text">{c.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </RevealSection>

      {/* Featured grid with reveal & hover lift */}
      <RevealSection>
        <section className="home-section">
          <div className="home-container">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="home-section-title">Featured Products</h2>
                <p className="home-section-sub">
                  Handpicked deals you won’t want to miss
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push("/products")}
              >
                View All <HiArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>

            {loading ? (
              <div className="home-product-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="home-skel-card">
                    <CardContent className="p-0">
                      <div className="home-skel-img" />
                      <div className="p-4">
                        <div className="home-skel-line mb-2" />
                        <div className="home-skel-line w-2/3 mb-4" />
                        <div className="h-6 bg-background-secondary rounded w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="home-product-grid">
                {featuredProducts.map((p) => (
                  <div key={p.id} className="reveal-up">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </RevealSection>

      {/* KPI counters (trust & scale) */}
      <RevealSection>
        <section className="kpi-strip">
          <div className="home-container kpi-grid">
            <KPI label="Happy Customers" valueTo={200000} suffix="+" />
            <KPI label="Devices Refurbished" valueTo={500000} suffix="+" />
            <KPI label="Cities Covered" valueTo={120} />
            <KPI label="Avg. Rating" valueTo={4.7} decimals={1} />
          </div>
        </section>
      </RevealSection>

      {/* Newsletter CTA */}
      <RevealSection>
        <section className="home-newsletter">
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
      </RevealSection>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-container">
          <div className="home-footer-grid">
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

            <FooterCol
              title="Company"
              items={["About Us", "Careers", "Press", "Contact"]}
            />
            <FooterCol
              title="Support"
              items={["Help Center", "Returns", "Warranty", "Shipping"]}
            />
            <FooterCol
              title="Legal"
              items={["Terms of Service", "Privacy Policy", "Cookie Policy"]}
            />
          </div>

          <div className="home-footer-bottom">
            <p>
              &copy; {new Date().getFullYear()} DeviceHub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Subcomponents ---------- */

function AssuranceBar() {
  return (
    <div className="assurance-bar">
      <div className="home-container assurance-flex">
        <div className="assurance-item">
          <HiShieldCheck className="assurance-ic" />
          <span>Cashify-style QC</span>
        </div>
        <div className="assurance-item">
          <HiRefresh className="assurance-ic" />
          <span>15-Day Replacement</span>
        </div>
        <div className="assurance-item">
          <HiBadgeCheck className="assurance-ic" />
          <span>6-Month Warranty</span>
        </div>
        <div className="assurance-item">
          <HiCreditCard className="assurance-ic" />
          <span>No-Cost EMI*</span>
        </div>
        <div className="assurance-item">
          <HiClock className="assurance-ic" />
          <span>Fast Delivery</span>
        </div>
      </div>
    </div>
  );
}

function BrandStrip() {
  return (
    <div className="brand-strip">
      <div className="brand-marquee">
        <div className="brand-track">
          {[
            "Apple",
            "Dell",
            "HP",
            "Lenovo",
            "ASUS",
            "Acer",
            "Samsung",
            "Microsoft",
          ].map((b, i) => (
            <div key={i} className="brand-pill">
              {b}
            </div>
          ))}
          {[
            "Apple",
            "Dell",
            "HP",
            "Lenovo",
            "ASUS",
            "Acer",
            "Samsung",
            "Microsoft",
          ].map((b, i) => (
            <div key={`dup-${i}`} className="brand-pill">
              {b}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  iconBg,
  iconColor,
  title,
  sub,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="feat-card reveal-up">
      <div className="feat-ic" style={{ background: iconBg, color: iconColor }}>
        {icon}
      </div>
      <h3 className="feat-title">{title}</h3>
      <p className="feat-sub">{sub}</p>
    </div>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="font-semibold mb-4">{title}</h3>
      <ul className="space-y-2 text-white/70">
        {items.map((t) => (
          <li key={t}>
            <a href="#" className="hover:text-white">
              {t}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function KPI({
  label,
  valueTo,
  suffix = "",
  decimals = 0,
}: {
  label: string;
  valueTo: number;
  suffix?: string;
  decimals?: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 900;
    const start = performance.now();
    const from = 0;
    const to = valueTo;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = from + (to - from) * eased;
      setValue(current);
      if (p < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, valueTo]);

  return (
    <div ref={ref} className="kpi-item">
      <div className="kpi-value">
        {value.toFixed(decimals)}
        {suffix}
      </div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}

// Category Icons
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

function ProductCard({ product }: { product: Product }) {
  const getConditionBadge = (grade: string) => {
    const colors: Record<string, React.CSSProperties> = {
      A: { background: "rgba(5,150,105,.10)", color: "var(--color-secondary)" },
      B: { background: "rgba(245,158,11,.10)", color: "var(--color-warning)" },
      C: { background: "rgba(245,158,11,.10)", color: "var(--color-accent)" },
    };
    return (
      <span className="badge" style={colors[grade] || {}}>
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
    <Link href={`/products/${product.slug}`} className="prod-card">
      <Card className="hover:shadow-lg cursor-pointer">
        <CardContent className="p-0">
          <div className="prod-img">
            {product.images?.length ? (
              <img
                src={product.images[0].url}
                alt={product.title}
                className="prod-img-el"
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

/* ---------- RevealSection wrapper (applies stagger via CSS) ---------- */
function RevealSection({ children }: { children: React.ReactNode }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={`reveal-wrap ${inView ? "in-view" : ""}`}>
      {children}
    </div>
  );
}
