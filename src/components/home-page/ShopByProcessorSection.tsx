"use client";

import { useRouter } from "next/navigation";
import { RevealSection } from "@/components/home-page/RevealSection";

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {processors.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                onClick={() => router.push(p.link)}
              >
                <img
                  src={p.image}
                  alt="processor card"
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </RevealSection>
  );
}
