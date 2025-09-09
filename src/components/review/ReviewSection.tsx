"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  reviewApi,
  Review,
  ProductReviewSummary,
  CreateReviewRequest,
} from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Star, MessageSquare, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ReviewSectionProps {
  productId: string;
  className?: string;
}

export default function ReviewSection({
  productId,
  className,
}: ReviewSectionProps) {
  const { user, loading: authLoading } = useAuth();
  const [summary, setSummary] = useState<ProductReviewSummary | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    content: "",
  });

  useEffect(() => {
    // Always load public reviews immediately; user-only call is conditional inside
    loadReviews();

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { productId?: string }
        | undefined;
      if (!detail || detail.productId === productId) {
        loadReviews();
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("reviewsUpdated", handler as EventListener);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("reviewsUpdated", handler as EventListener);
      }
    };
  }, [productId, authLoading, user?.id]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const [summaryData, reviewsData, userReviewData] = await Promise.all([
        reviewApi.getProductReviewSummary(productId),
        reviewApi.getProductReviews(productId, 0, 10),
        user
          ? reviewApi.getUserReviewForProduct(productId)
          : Promise.resolve(null),
      ]);

      setSummary(summaryData);
      setReviews(reviewsData.content);
      setUserReview(userReviewData);
    } catch (error) {
      console.error("Failed to load reviews:", error);
      // Do not block UI with a toast; keep page clean
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authLoading) {
      toast.loading("Checking your session...", { id: "authLoadingReview" });
      setTimeout(() => toast.dismiss("authLoadingReview"), 800);
      return;
    }
    if (!user) {
      toast.error("Please login to write a review");
      return;
    }

    try {
      setSubmitting(true);
      const request: CreateReviewRequest = {
        productId,
        rating: reviewForm.rating,
        title: reviewForm.title,
        content: reviewForm.content,
      };

      await reviewApi.createReview(request);
      toast.success("Review submitted successfully");
      setShowReviewForm(false);
      setReviewForm({ rating: 5, title: "", content: "" });
      loadReviews(); // Reload reviews
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("reviewsUpdated", { detail: { productId } })
        );
      }
    } catch (error: any) {
      console.error("Failed to submit review:", error);
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive: boolean = false) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
            onClick={
              interactive
                ? () => setReviewForm({ ...reviewForm, rating: star })
                : undefined
            }
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Compact Review Summary */}
      {summary && (
        <div className="border border-border rounded-lg p-4 bg-background-secondary">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-foreground">
              Customer Reviews
            </h3>
            {authLoading ? (
              <span className="text-xs text-foreground-muted">Checking...</span>
            ) : user ? (
              userReview ? (
                <div className="flex items-center gap-2">
                  {renderStars(userReview.rating)}
                  <span className="text-xs text-foreground-muted">
                    Your review
                  </span>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowReviewForm(true)}
                  className="text-xs px-3 py-1 h-7"
                >
                  Write Review
                </Button>
              )
            ) : (
              <span className="text-xs text-foreground-muted">
                Login to review
              </span>
            )}
          </div>

          <div className="flex items-center gap-6">
            {/* Rating Score */}
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-foreground">
                {summary.averageRating.toFixed(1)}
              </div>
              <div>
                {renderStars(Math.round(summary.averageRating))}
                <div className="text-xs text-foreground-muted mt-1">
                  {summary.totalReviews}{" "}
                  {summary.totalReviews === 1 ? "review" : "reviews"}
                </div>
              </div>
            </div>

            {/* Compact Rating Distribution */}
            <div className="flex-1 max-w-xs">
              <div className="space-y-1">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = summary.ratingDistribution[rating] || 0;
                  const percentage =
                    summary.totalReviews > 0
                      ? (count / summary.totalReviews) * 100
                      : 0;

                  return (
                    <div
                      key={rating}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span className="w-4">{rating}</span>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-yellow-400 h-1.5 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-6 text-foreground-muted">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact Review Form */}
      {showReviewForm && (
        <div className="border border-border rounded-lg p-4 bg-background-secondary">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-foreground">
              Write a Review
            </h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowReviewForm(false)}
              className="text-xs px-2 py-1 h-6"
            >
              ✕
            </Button>
          </div>

          <form onSubmit={handleSubmitReview} className="space-y-3">
            <div>
              <Label htmlFor="rating" className="text-sm">
                Rating
              </Label>
              <div className="mt-1">{renderStars(reviewForm.rating, true)}</div>
            </div>

            <div>
              <Label htmlFor="title" className="text-sm">
                Title
              </Label>
              <Input
                id="title"
                value={reviewForm.title}
                onChange={(e) =>
                  setReviewForm({ ...reviewForm, title: e.target.value })
                }
                placeholder="Summarize your experience"
                required
                className="h-8 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="content" className="text-sm">
                Review
              </Label>
              <Textarea
                id="content"
                value={reviewForm.content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setReviewForm({ ...reviewForm, content: e.target.value })
                }
                placeholder="Tell us about your experience with this product"
                rows={3}
                className="text-sm"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                disabled={submitting}
                size="sm"
                className="text-xs px-4 py-1 h-7"
              >
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowReviewForm(false)}
                className="text-xs px-4 py-1 h-7"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Compact Reviews List */}
      {reviews.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">
              Recent Reviews
            </h3>
            <span className="text-xs text-foreground-muted">
              Showing {reviews.length} of {summary?.totalReviews || 0}
            </span>
          </div>

          <div className="space-y-3">
            {reviews.slice(0, 3).map((review) => (
              <div
                key={review.id}
                className="border-b border-border pb-3 last:border-b-0"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-foreground">
                        {review.user?.name || "Anonymous"}
                      </span>
                      {renderStars(review.rating)}
                      <span className="text-xs text-foreground-muted">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-medium text-sm text-foreground mb-1 line-clamp-1">
                      {review.title}
                    </h4>
                    {review.content && (
                      <p className="text-xs text-foreground-secondary line-clamp-2 leading-relaxed">
                        {review.content}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {reviews.length > 3 && (
            <div className="text-center pt-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs px-4 py-1 h-7"
                onClick={() => {
                  /* TODO: Implement view all reviews */
                }}
              >
                View All {summary?.totalReviews || 0} Reviews
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
