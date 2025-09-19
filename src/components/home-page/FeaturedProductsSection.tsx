"use client";

import { useRouter } from "next/navigation";
import { HiArrowRight } from "react-icons/hi";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Product } from "@/lib/api";
import { ProductCard } from "@/components/home-page/ProductCard";
import { RevealSection } from "@/components/home-page/RevealSection";

interface FeaturedProductsSectionProps {
  featuredProducts: Product[];
  loading: boolean;
}

export function FeaturedProductsSection({
  featuredProducts,
  loading,
}: FeaturedProductsSectionProps) {
  const router = useRouter();

  return (
    <RevealSection>
      <section className="home-section">
        <div className="home-container">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="home-section-title">Featured Products</h2>
              <p className="home-section-sub">
                Handpicked deals you won't want to miss
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push("/products")}>
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
  );
}
