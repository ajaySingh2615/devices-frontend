"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RevealSection } from "@/components/home-page/RevealSection";
import { catalogApi, Product, PageResponse } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import ProductRating from "@/components/rating/ProductRating";

export function BestsellersSection() {
  const [data, setData] = useState<PageResponse<Product> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await catalogApi.searchProducts({
          page: 0,
          size: 8,
          bestseller: true,
        });
        setData(res);
      } catch (e) {
        // swallow; section is optional
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <RevealSection>
        <section className="py-12 bg-white">
          <div className="home-container">
            <div className="text-center mb-8">
              <h2 className="home-section-title">Bestsellers</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="aspect-square bg-background-secondary animate-pulse" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 w-3/4 bg-background-secondary rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-background-secondary rounded animate-pulse" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </RevealSection>
    );
  }

  if (!data || data.content.length === 0) return null;

  return (
    <RevealSection>
      <section className="py-12 bg-white">
        <div className="home-container">
          <div className="flex items-center justify-between mb-8">
            <h2 className="home-section-title">Bestsellers</h2>
            <Link href="/products">
              <Button variant="outline" size="sm">
                View all
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {data.content.map((p) => {
              const prices = (p.variants || []).map((v) => ({
                sale: v.priceSale,
                mrp: v.priceMrp || v.priceSale,
              }));
              const best = prices.length
                ? prices.sort((a, b) => a.sale - b.sale)[0]
                : undefined;
              const price = best?.sale;
              const mrp = best?.mrp;
              const discount =
                mrp && price && mrp > price
                  ? Math.round(((mrp - price) / mrp) * 100)
                  : 0;

              return (
                <Card
                  key={p.id}
                  className="overflow-hidden hover:shadow-md transition-shadow duration-200"
                >
                  <CardContent className="p-3">
                    <Link href={`/products/${p.slug}`} className="block">
                      <div className="relative bg-background-secondary rounded-md flex items-center justify-center h-40 md:h-44 lg:h-48">
                        {discount > 0 && (
                          <span className="absolute left-2 top-2 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-error text-white">
                            {discount}% OFF
                          </span>
                        )}
                        {p.images?.[0]?.url ? (
                          <img
                            src={p.images[0].url}
                            alt={p.title}
                            className="h-full w-auto object-contain"
                          />
                        ) : (
                          <div className="text-4xl">📱</div>
                        )}
                      </div>

                      <div className="mt-3 space-y-1">
                        {mrp !== undefined &&
                          price !== undefined &&
                          mrp > price && (
                            <span
                              className="inline-flex items-center rounded-md px-2.5 py-1 text-[12px] font-semibold"
                              style={{
                                background:
                                  "linear-gradient(90deg, #FED7AA 0%, #FFF3E0 100%)",
                                color: "#111827",
                              }}
                            >
                              ₹{(mrp - price).toLocaleString("en-IN")} OFF
                            </span>
                          )}
                        <h3 className="text-[14px] font-semibold leading-5 line-clamp-2">
                          {p.title}
                        </h3>
                        <div className="flex items-center gap-1 text-[12px] text-foreground-secondary">
                          <ProductRating
                            productId={p.id as string}
                            variant="compact"
                            showReviewCount={false}
                            hideIfNoReviews={true}
                            className="!m-0"
                          />
                          <span className="ml-1">{p.brand?.name || ""}</span>
                        </div>
                        <div className="flex items-end gap-2 mt-1">
                          {discount > 0 && (
                            <span
                              className="text-[12px] font-semibold"
                              style={{ color: "#dc2626" }}
                            >
                              -{discount}%
                            </span>
                          )}
                          {price !== undefined && (
                            <span className="text-[16px] font-bold text-price">
                              ₹{price.toLocaleString("en-IN")}
                            </span>
                          )}
                          {mrp !== undefined && mrp > (price || 0) && (
                            <span className="text-xs line-through text-foreground-muted">
                              ₹{mrp.toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </RevealSection>
  );
}
