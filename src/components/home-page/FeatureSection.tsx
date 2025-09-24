"use client";

import { HiShieldCheck, HiRefresh, HiBadgeCheck } from "react-icons/hi";
import { RevealSection } from "@/components/home-page/RevealSection";
import { motion } from "framer-motion";

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
            <h2 className="text-2xl font-bold font-display text-foreground mb-3">
              Why Choose DeviceHub?
            </h2>
            <p className="text-foreground-secondary">
              Quality devices with peace of mind
            </p>
          </div>

          {/* Simple Features Grid */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.12, delayChildren: 0.08 },
              },
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { type: "spring", stiffness: 100, damping: 18 },
                  },
                }}
                className="text-center"
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <div className="text-green-600 text-lg">{feature.icon}</div>
                </div>
                <h3 className="text-lg font-semibold font-display text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-foreground-secondary text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </RevealSection>
  );
}
