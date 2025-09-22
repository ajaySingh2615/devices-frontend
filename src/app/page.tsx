"use client";

import { useState, useEffect } from "react";
import { catalogApi, Category, Product } from "@/lib/api";
import "./home.css";
import {
  HeroSection,
  BannerCarousel,
  FeatureSection,
  ShopByBrandSection,
  CompanyLogosSection,
  CategorySection,
  FeaturedProductsSection,
  KPISection,
  NewsletterSection,
  FooterSection,
} from "@/components/home-page";

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
      <HeroSection scrollY={scrollY} />
      <BannerCarousel />
      <FeatureSection />
      <ShopByBrandSection />
      <CompanyLogosSection />
      <CategorySection categories={categories} loading={loading} />
      <FeaturedProductsSection
        featuredProducts={featuredProducts}
        loading={loading}
      />
      <KPISection scrollY={scrollY} />
      <NewsletterSection />
      <FooterSection scrollY={scrollY} />
    </div>
  );
}
