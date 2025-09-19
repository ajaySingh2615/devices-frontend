"use client";

import { HiShieldCheck, HiRefresh, HiBadgeCheck } from "react-icons/hi";
import { RevealSection } from "@/components/home-page/RevealSection";

export function FeatureSection() {
  const features = [
    {
      icon: <HiShieldCheck className="w-8 h-8" />,
      title: "32-Point Quality Check",
      description:
        "Every device undergoes rigorous testing for performance, battery life, display quality, and all ports.",
    },
    {
      icon: <HiRefresh className="w-8 h-8" />,
      title: "15-Day Replacement",
      description:
        "If something's not right, we'll replace it quickly with no lengthy forms or hassles.",
    },
    {
      icon: <HiBadgeCheck className="w-8 h-8" />,
      title: "6-Month Warranty",
      description:
        "Peace of mind on all refurbished devices with comprehensive warranty coverage.",
    },
  ];

  return (
    <RevealSection>
      <section className="py-20 bg-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose DeviceHub?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We ensure every device meets our high standards of quality and
              reliability
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                  <div className="text-blue-600">{feature.icon}</div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </RevealSection>
  );
}
