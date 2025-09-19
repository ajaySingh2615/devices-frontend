"use client";

import { HiShieldCheck } from "react-icons/hi";
import { FeatureCard } from "./FeatureCard";
import { RevealSection } from "./RevealSection";

export function FeatureSection() {
  return (
    <RevealSection>
      <section className="home-section">
        <div className="home-container">
          <div className="text-center mb-16">
            <h2 className="home-section-title">Why Choose DeviceHub?</h2>
            <p className="home-section-sub">
              We ensure every device meets our high standards of quality and
              reliability
            </p>
          </div>

          <div className="home-feature-grid">
            <FeatureCard
              icon={<HiShieldCheck className="w-8 h-8" />}
              iconBg="rgba(5,150,105,.10)"
              iconColor="var(--color-secondary)"
              title="32-Point Quality Check"
              sub="Every device is tested thoroughly for performance, battery, display & ports."
            />
          </div>
        </div>
      </section>
    </RevealSection>
  );
}
