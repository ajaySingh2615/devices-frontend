"use client";

export function BrandStrip() {
  const brands = [
    "Apple",
    "Samsung",
    "Microsoft",
    "Dell",
    "HP",
    "Lenovo",
    "ASUS",
    "Acer",
    "LG",
    "MSI",
    "Razer",
    "Gigabyte",
    "Huawei",
    "HONOR",
    "Xiaomi",
    "Dynabook",
    "VAIO",
    "NEC",
    "Panasonic",
    "Framework",
    "System76",
    "TUXEDO",
    "Purism",
    "Medion",
    "Chuwi",
    "realme",
    "Nokia",
    "Infinix",
    "TECNO",
    "Jio",
  ];

  return (
    <div className="brand-strip">
      <div className="brand-marquee">
        <div className="brand-track">
          {brands.map((brand, i) => (
            <div key={i} className="brand-pill">
              <span className="brand-text">{brand}</span>
            </div>
          ))}
        </div>
        <div className="brand-track brand-track-2">
          {brands.map((brand, i) => (
            <div key={`dup-${i}`} className="brand-pill">
              <span className="brand-text">{brand}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
