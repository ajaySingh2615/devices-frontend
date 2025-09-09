"use client";

import { Product, ProductVariant } from "@/lib/api";
import {
  HiCheck,
  HiChip,
  HiShieldCheck,
  HiScale,
  HiTag,
  HiGift,
} from "react-icons/hi";

interface ProductDescriptionProps {
  product: Product;
}

export default function ProductDescription({
  product,
}: ProductDescriptionProps) {
  // Get the default variant (first variant)
  const defaultVariant = product.variants?.[0];

  if (!defaultVariant) {
    return null;
  }

  // Helper functions
  const getConditionLabel = (grade: string) => {
    switch (grade?.toUpperCase()) {
      case "A":
        return "Excellent";
      case "B":
        return "Good";
      case "C":
        return "Fair";
      default:
        return "Good";
    }
  };

  const getDiscountPercentage = () => {
    if (!defaultVariant.priceMrp || !defaultVariant.priceSale) return 0;
    const discount =
      ((defaultVariant.priceMrp - defaultVariant.priceSale) /
        defaultVariant.priceMrp) *
      100;
    return Math.round(discount);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Generate key highlights
  const keyHighlights = [
    `${product.brand?.name || "Brand"} ${product.title} — ${
      defaultVariant.ramGb
    }GB RAM, ${defaultVariant.storageGb}GB Storage`,
    `Color: ${defaultVariant.color || "Standard"}`,
    `Grade ${product.conditionGrade} (${getConditionLabel(
      product.conditionGrade
    )} - professionally tested)`,
    `Warranty: ${product.warrantyMonths || 6}-month seller warranty`,
    `Weight: ${defaultVariant.weightGrams || "N/A"}g (approx.)`,
    `Save ${getDiscountPercentage()}% vs MRP (${formatPrice(
      defaultVariant.priceMrp
    )} → ${formatPrice(defaultVariant.priceSale)})`,
  ];

  return (
    <div className="space-y-6">
      {/* Key Highlights */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <HiChip className="w-5 h-5 mr-2 text-primary" />
          Key Highlights
        </h3>
        <div className="grid gap-3">
          {keyHighlights.map((highlight, index) => (
            <div key={index} className="flex items-start space-x-3">
              <HiCheck className="w-5 h-5 text-success mt-0.5 flex-shrink-0" />
              <span className="text-foreground-secondary text-sm leading-relaxed">
                {highlight}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Specifications Table */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <HiShieldCheck className="w-5 h-5 mr-2 text-primary" />
          Specifications
        </h3>
        <div className="bg-background-secondary rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <div className="font-medium text-foreground-muted">RAM</div>
              <div className="text-foreground font-medium">
                {defaultVariant.ramGb}GB
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-foreground-muted">Storage</div>
              <div className="text-foreground font-medium">
                {defaultVariant.storageGb}GB
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-foreground-muted">Color</div>
              <div className="text-foreground font-medium">
                {defaultVariant.color || "Standard"}
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-foreground-muted">Weight</div>
              <div className="text-foreground font-medium">
                {defaultVariant.weightGrams || "N/A"}g
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-foreground-muted">Condition</div>
              <div className="text-foreground font-medium">
                Grade {product.conditionGrade}
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-foreground-muted">Warranty</div>
              <div className="text-foreground font-medium">
                {product.warrantyMonths || 6} months
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Narrative */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
          <HiGift className="w-5 h-5 mr-2 text-primary" />
          Product Overview
        </h3>
        <div className="bg-background-secondary rounded-lg p-4">
          <p className="text-foreground-secondary leading-relaxed">
            <strong>
              {product.brand?.name || "Brand"} {product.title}
            </strong>{" "}
            in {defaultVariant.color || "standard color"}
            with {defaultVariant.ramGb}GB RAM and {defaultVariant.storageGb}GB
            storage. Certified Grade {product.conditionGrade} unit—fully tested
            and professionally refurbished. Covered by{" "}
            {product.warrantyMonths || 6}-month seller warranty for peace of
            mind. Great value with a {getDiscountPercentage()}% saving over MRP,
            making it an excellent choice for productivity, entertainment, and
            everyday computing needs.
          </p>
        </div>
      </div>

      {/* Additional Details (from description field) */}
      {product.description && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Additional Details
          </h3>
          <div className="bg-background-secondary rounded-lg p-4">
            <p className="text-foreground-secondary whitespace-pre-line leading-relaxed">
              {product.description}
            </p>
          </div>
        </div>
      )}

      {/* Standard Disclaimer */}
      <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <HiTag className="w-5 h-5 text-warning mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-warning mb-1">Important Note</h4>
            <p className="text-sm text-foreground-secondary">
              Images may be representative. Minor cosmetic wear possible;
              functionality fully tested and guaranteed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
