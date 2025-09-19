"use client";

import Link from "next/link";
import { HiStar } from "react-icons/hi";
import { Card, CardContent } from "@/components/ui/Card";
import { Product } from "@/lib/api";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
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
