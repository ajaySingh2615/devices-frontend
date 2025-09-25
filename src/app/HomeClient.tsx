"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
// removed initial client-side data fetch for faster first paint
import "./home.css";

// Above-the-fold: use lightweight static fallback, defer animated hero
const HeroClient = dynamic(
  () => import("@/components/home-page/HeroSection").then((m) => m.HeroSection),
  {
    ssr: false,
    loading: () => (
      <section className="home-hero">
        <div className="home-container relative">
          <div className="text-center">
            <h1 className="home-hero-title">
              Premium Refurbished{" "}
              <span className="home-hero-accent">Electronics</span>
            </h1>
            <p className="home-hero-sub">
              Get the latest smartphones, laptops, and tablets at unbeatable
              prices.
            </p>
          </div>
        </div>
      </section>
    ),
  }
);

// Below-the-fold sections (lazy)
const BannerCarousel = dynamic(
  () =>
    import("@/components/home-page/BannerCarousel").then(
      (m) => m.BannerCarousel
    ),
  { ssr: false }
);
const FeatureSection = dynamic(
  () =>
    import("@/components/home-page/FeatureSection").then(
      (m) => m.FeatureSection
    ),
  { ssr: false }
);
const ShopByBrandSection = dynamic(
  () =>
    import("@/components/home-page/ShopByBrandSection").then(
      (m) => m.ShopByBrandSection
    ),
  { ssr: false }
);
const CompanyLogosSection = dynamic(
  () =>
    import("@/components/home-page/CompanyLogosSection").then(
      (m) => m.CompanyLogosSection
    ),
  { ssr: false }
);
const ShopByProcessorSection = dynamic(
  () =>
    import("@/components/home-page/ShopByProcessorSection").then(
      (m) => m.ShopByProcessorSection
    ),
  { ssr: false }
);
const BestsellersSection = dynamic(
  () =>
    import("@/components/home-page/BestsellersSection").then(
      (m) => m.BestsellersSection
    ),
  { ssr: false }
);
const ShopByOSSection = dynamic(
  () =>
    import("@/components/home-page/ShopByOSSection").then(
      (m) => m.ShopByOSSection
    ),
  { ssr: false }
);
const KPISection = dynamic(
  () => import("@/components/home-page/KPISection").then((m) => m.KPISection),
  { ssr: false }
);
const NewsletterSection = dynamic(
  () =>
    import("@/components/home-page/NewsletterSection").then(
      (m) => m.NewsletterSection
    ),
  { ssr: false }
);
const FooterSection = dynamic(
  () =>
    import("@/components/home-page/FooterSection").then((m) => m.FooterSection),
  { ssr: false }
);

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

export default function HomeClient() {
  const scrollY = useParallax();

  return (
    <div className="min-h-screen bg-background">
      <HeroClient scrollY={scrollY} />
      <BannerCarousel />
      <FeatureSection />
      <ShopByBrandSection />
      <CompanyLogosSection />
      <ShopByProcessorSection />
      <BestsellersSection />
      <ShopByOSSection />
      {/* <CategorySection categories={categories} loading={loading} /> */}
      {/* <FeaturedProductsSection featuredProducts={featuredProducts} loading={loading} /> */}
      <KPISection scrollY={scrollY} />
      <NewsletterSection />
      <FooterSection scrollY={scrollY} />
    </div>
  );
}
