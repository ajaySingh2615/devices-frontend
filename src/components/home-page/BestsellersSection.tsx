"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { RevealSection } from "@/components/home-page/RevealSection";
import { catalogApi, Product, PageResponse } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import ProductRating from "@/components/rating/ProductRating";

export function BestsellersSection() {
  const [data, setData] = useState<PageResponse<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);

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

          <div className="relative">
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() =>
                scrollRef.current?.scrollBy({ left: -400, behavior: "smooth" })
              }
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow border border-border hover:bg-white"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() =>
                scrollRef.current?.scrollBy({ left: 400, behavior: "smooth" })
              }
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow border border-border hover:bg-white"
            >
              ›
            </button>

            <div
              ref={scrollRef}
              className="overflow-x-auto snap-x snap-mandatory scroll-px-3 pr-2"
            >
              <div className="flex gap-3 min-w-max px-1">
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
                      className="overflow-hidden hover:shadow-md transition-shadow duration-200 snap-start flex-none w-[220px] sm:w-[230px] lg:w-[240px]"
                    >
                      <CardContent className="p-3">
                        <Link href={`/products/${p.slug}`} className="block">
                          <div className="relative bg-background-secondary rounded-md flex items-center justify-center h-36 md:h-40 lg:h-44">
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

                          <div className="mt-2 space-y-1">
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
                            <h3 className="text-[13px] font-semibold leading-5 line-clamp-2">
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
                              <span className="ml-1">
                                {p.brand?.name || ""}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 whitespace-nowrap">
                              {discount > 0 && (
                                <span
                                  className="text-[12px] font-semibold"
                                  style={{ color: "#dc2626" }}
                                >
                                  -{discount}%
                                </span>
                              )}
                              {price !== undefined && (
                                <span className="text-[18px] md:text-[19px] font-extrabold text-price">
                                  ₹{price.toLocaleString("en-IN")}
                                </span>
                              )}
                              {mrp !== undefined && mrp > (price || 0) && (
                                <span className="text-[12px] line-through text-foreground-muted">
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
          </div>
        </div>
      </section>
    </RevealSection>
  );
}
