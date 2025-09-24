"use client";

import Link from "next/link";
import { RevealSection } from "@/components/home-page/RevealSection";

export function ShopByOSSection() {
  const top = [
    {
      title: "Windows\nLaptops",
      image: "/shop_by_os/windows-laptops.webp",
      href: "/products?operatingSystem=windows",
      gradient: "from-rose-100 to-rose-200",
      priceText: "Starting at",
      price: "₹9,999",
    },
    {
      title: "Apple\nMac OS",
      image: "/shop_by_os/apple-mac-os.webp",
      href: "/products?operatingSystem=macos",
      gradient: "from-sky-100 to-indigo-100",
      priceText: "Starting at",
      price: "₹19,999",
    },
  ] as const;

  const bottom = [
    {
      title: "Laptops for\nMulti-tasking",
      image: "/shop_by_os/laptop/laptops-for-everyday-needs.webp",
      href: "/products?useCase=MULTI_TASKING",
    },
    {
      title: "Laptops that are\nTouchscreen",
      image: "/shop_by_os/laptop/laptops-that-are-touchscreen.webp",
      href: "/products?touchscreen=true",
    },
    {
      title: "Laptops for\nEveryday Needs",
      image: "/shop_by_os/laptop/laptops-for-multi-tasking.webp",
      href: "/products?useCase=EVERYDAY_NEEDS",
    },
  ] as const;

  return (
    <RevealSection>
      <section className="py-12 bg-sky-50">
        <div className="home-container">
          <h2 className="home-section-title text-center mb-8">
            Shop by Operating System
          </h2>

          {/* Top row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            {top.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className={`block rounded-2xl overflow-hidden bg-gradient-to-br ${card.gradient}`}
              >
                <div className="p-6 md:p-8 flex items-center gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="text-2xl md:text-3xl font-extrabold whitespace-pre-line text-foreground mb-3">
                      {card.title}
                    </div>
                    <div className="text-sm text-foreground-secondary">
                      {card.priceText}
                    </div>
                    <div className="text-2xl md:text-3xl font-black text-foreground">
                      {card.price}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <img
                      src={card.image}
                      alt={card.title.replace("\n", " ")}
                      className="h-28 md:h-36 w-auto object-contain"
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {bottom.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="block rounded-2xl overflow-hidden bg-white border border-border"
              >
                <div className="p-4 md:p-5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm md:text-base font-semibold whitespace-pre-line mb-3 text-foreground">
                      {card.title}
                    </div>
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-primary/10 text-primary">
                      Shop Now
                    </span>
                  </div>
                  <img
                    src={card.image}
                    alt={card.title.replace("\n", " ")}
                    className="h-20 md:h-24 w-auto object-contain"
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </RevealSection>
  );
}
