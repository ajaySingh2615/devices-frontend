"use client";

import { useRouter } from "next/navigation";
import { RevealSection } from "@/components/home-page/RevealSection";
import { motion } from "framer-motion";

export function ShopByBrandSection() {
  const router = useRouter();

  const brands = [
    {
      id: 1,
      name: "Apple",
      slug: "apple",
      image: "/shop_by_brand/apple.webp",
    },
    {
      id: 2,
      name: "Dell",
      slug: "dell",
      image: "/shop_by_brand/dell.webp",
    },
    {
      id: 3,
      name: "HP",
      slug: "hp",
      image: "/shop_by_brand/hp.webp",
    },
    {
      id: 4,
      name: "Lenovo",
      slug: "lenovo",
      image: "/shop_by_brand/lenovo.webp",
    },
  ];

  const handleBrandClick = (brandSlug: string) => {
    router.push(`/products?brand=${brandSlug}`);
  };

  return (
    <RevealSection>
      <section className="bg-blue-50 py-16">
        <div className="home-container">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="home-section-title text-3xl md:text-4xl font-extrabold font-display">
              Shop by Brand
            </h2>
          </div>

          {/* Brand Cards Grid */}
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {brands.map((brand) => (
              <motion.div
                key={brand.id}
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { type: "spring", stiffness: 100, damping: 18 },
                  },
                }}
                className="rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                onClick={() => handleBrandClick(brand.slug)}
              >
                <img
                  src={brand.image}
                  alt={`${brand.name} Brand`}
                  className="w-full h-auto object-cover"
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </RevealSection>
  );
}
