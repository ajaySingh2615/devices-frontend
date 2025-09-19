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
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Simple Header */}
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Why Choose DeviceHub?
            </h2>
            <p className="text-gray-600">Quality devices with peace of mind</p>
          </div>

          {/* Simple Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <div className="text-green-600 text-lg">{feature.icon}</div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </RevealSection>
  );
}
