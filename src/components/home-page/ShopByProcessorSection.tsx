"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { RevealSection } from "@/components/home-page/RevealSection";
import { motion } from "framer-motion";

export function ShopByProcessorSection() {
  const router = useRouter();

  const processors = [
    {
      id: 1,
      image: "/shop_by_processor/hhcgat6b7qnrvtstl2rc.webp",
      link: "/products?processorVendor=intel",
    },
    {
      id: 2,
      image: "/shop_by_processor/tfkqk9yjowfrkx8t5nh5.webp",
      link: "/products?processorVendor=amd",
    },
    {
      id: 3,
      image: "/shop_by_processor/pzvigopu0y6ftdxsd4bi.webp",
      link: "/products?processorVendor=apple",
    },
  ];

  return (
    <RevealSection>
      <section className="py-12 bg-blue-50">
        <div className="home-container">
          <div className="text-center mb-8">
            <h2 className="home-section-title">Shop By Processor</h2>
          </div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.25 }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.12, delayChildren: 0.08 },
              },
            }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {processors.map((p) => (
              <motion.div
                key={p.id}
                className="rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                onClick={() => router.push(p.link)}
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { type: "spring", stiffness: 100, damping: 18 },
                  },
                }}
              >
                <Image
                  src={p.image}
                  alt="processor card"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                  priority={false}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </RevealSection>
  );
}
