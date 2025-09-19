"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { HiArrowRight } from "react-icons/hi";
import { Button } from "@/components/ui/Button";
import { Category } from "@/lib/api";
import { RevealSection } from "./RevealSection";

interface CategorySectionProps {
  categories: Category[];
  loading: boolean;
}

export function CategorySection({ categories, loading }: CategorySectionProps) {
  const router = useRouter();

  return (
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
