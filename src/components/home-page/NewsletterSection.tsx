"use client";

import { Button } from "@/components/ui/Button";
import { RevealSection } from "./RevealSection";

export function NewsletterSection() {
  return (
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
  );
}
