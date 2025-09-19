"use client";

import Link from "next/link";
import { HiShoppingBag } from "react-icons/hi";
import { Button } from "@/components/ui/Button";
import { BrandStrip } from "./BrandStrip";

interface HeroSectionProps {
  scrollY: number;
}

export function HeroSection({ scrollY }: HeroSectionProps) {
  return (
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
  );
}
