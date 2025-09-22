"use client";

import { useRouter } from "next/navigation";
import { RevealSection } from "@/components/home-page/RevealSection";

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
            <h2 className="home-section-title">Shop by Brand</h2>
          </div>

          {/* Brand Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                onClick={() => handleBrandClick(brand.slug)}
              >
                <img
                  src={brand.image}
                  alt={`${brand.name} Brand`}
                  className="w-full h-auto object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </RevealSection>
  );
}
