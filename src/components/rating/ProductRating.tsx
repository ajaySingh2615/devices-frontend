"use client";

import { useState, useEffect } from "react";
import { HiStar } from "react-icons/hi";
import { reviewApi, ProductReviewSummary } from "@/lib/api";

interface ProductRatingProps {
  productId: string;
  variant?: "compact" | "detailed";
  showReviewCount?: boolean;
  className?: string;
}

export default function ProductRating({
  productId,
  variant = "detailed",
  showReviewCount = true,
  className = "",
}: ProductRatingProps) {
  const [summary, setSummary] = useState<ProductReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRatingSummary();
  }, [productId]);

  const loadRatingSummary = async () => {
    try {
      setLoading(true);
      const data = await reviewApi.getProductReviewSummary(productId);
      setSummary(data);
    } catch (error) {
      console.error("Failed to load rating summary:", error);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <HiStar key={i} className="w-4 h-4 text-gray-300" />
          ))}
        </div>
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  if (!summary || summary.totalReviews === 0) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <HiStar key={i} className="w-4 h-4 text-gray-300" />
          ))}
        </div>
        <span className="text-sm text-gray-500">
          {variant === "compact" ? "No reviews" : "Be the first to review"}
        </span>
      </div>
    );
  }

  const averageRating = summary.averageRating;
  const totalReviews = summary.totalReviews;
  const filledStars = Math.floor(averageRating);
  const hasHalfStar = averageRating % 1 >= 0.5;

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-500";
    if (rating >= 4.0) return "text-blue-500";
    if (rating >= 3.0) return "text-yellow-500";
    if (rating >= 2.0) return "text-orange-500";
    return "text-red-500";
  };

  const getRatingText = (rating: number) => {
    if (rating >= 4.5) return "Excellent";
    if (rating >= 4.0) return "Very Good";
    if (rating >= 3.0) return "Good";
    if (rating >= 2.0) return "Fair";
    return "Poor";
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1">
        <div className="flex">
          {[...Array(5)].map((_, i) => {
            if (i < filledStars) {
              return (
                <HiStar
                  key={i}
                  className={`w-4 h-4 ${getRatingColor(averageRating)}`}
                />
              );
            } else if (i === filledStars && hasHalfStar) {
              return (
                <div key={i} className="relative w-4 h-4">
                  <HiStar className="w-4 h-4 text-gray-300" />
                  <div className="absolute inset-0 overflow-hidden w-1/2">
                    <HiStar
                      className={`w-4 h-4 ${getRatingColor(averageRating)}`}
                    />
                  </div>
                </div>
              );
            } else {
              return <HiStar key={i} className="w-4 h-4 text-gray-300" />;
            }
          })}
        </div>
        <span
          className={`text-sm font-medium ${getRatingColor(averageRating)}`}
        >
          {averageRating.toFixed(1)}
        </span>
      </div>

      {showReviewCount && (
        <span className="text-sm text-gray-600">
          ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
        </span>
      )}

      {variant === "detailed" && (
        <span
          className={`text-xs font-medium ${getRatingColor(averageRating)}`}
        >
          {getRatingText(averageRating)}
        </span>
      )}
    </div>
  );
}
