"use client";

import { RevealSection } from "@/components/home-page/RevealSection";

export function CompanyLogosSection() {
  const logos = [
    { name: "Apple", src: "/companies_logo/apple.webp" },
    { name: "Dell", src: "/companies_logo/dell.webp" },
    { name: "HP", src: "/companies_logo/hp.webp" },
    { name: "Lenovo", src: "/companies_logo/lenovo.webp" },
    { name: "Acer", src: "/companies_logo/acer.webp" },
    { name: "Asus", src: "/companies_logo/asus.webp" },
    { name: "Microsoft", src: "/companies_logo/microsoft.webp" },
    { name: "MSI", src: "/companies_logo/msi.webp" },
    { name: "LG", src: "/companies_logo/lg.webp" },
    { name: "Honor", src: "/companies_logo/honor.webp" },
    { name: "MI", src: "/companies_logo/mi.webp" },
    { name: "Infinix", src: "/companies_logo/infinix.webp" },
    { name: "Samsung", src: "/companies_logo/sumsung.webp" },
  ];

  const looped = [...logos, ...logos];

  return (
    <RevealSection>
      <section className="bg-white py-10">
        <div className="home-container">
          <div className="relative overflow-hidden">
            <div className="marquee flex items-center gap-10 will-change-transform">
              {looped.map((logo, idx) => (
                <div
                  key={idx}
                  className="shrink-0 opacity-80 hover:opacity-100 transition-opacity duration-200"
                >
                  <img
                    src={logo.src}
                    alt={`${logo.name} logo`}
                    className="h-10 w-auto object-contain transition-all duration-200"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes scrollX {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          .marquee {
            animation: scrollX 30s linear infinite;
            width: max-content;
          }
        `}</style>
      </section>
    </RevealSection>
  );
}
