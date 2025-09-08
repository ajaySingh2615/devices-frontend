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
    if (!authLoading) {
      loadReviews();
    }
  }, [productId, authLoading]);

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
      toast.error("Failed to load reviews");
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
    <div className={`space-y-6 ${className}`}>
      {/* Review Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Customer Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rating Overview */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-3xl font-bold">
                    {summary.averageRating.toFixed(1)}
                  </div>
                  <div>
                    {renderStars(Math.round(summary.averageRating))}
                    <div className="text-sm text-muted-foreground">
                      {summary.totalReviews}{" "}
                      {summary.totalReviews === 1 ? "review" : "reviews"}
                    </div>
                  </div>
                </div>

                {/* Rating Distribution */}
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = summary.ratingDistribution[rating] || 0;
                    const percentage =
                      summary.totalReviews > 0
                        ? (count / summary.totalReviews) * 100
                        : 0;

                    return (
                      <div key={rating} className="flex items-center gap-2">
                        <span className="text-sm w-8">{rating}</span>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-400 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-8">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Write Review Button */}
              <div className="flex items-center justify-center">
                {authLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Checking session…
                  </p>
                ) : user ? (
                  userReview ? (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        You've already reviewed this product
                      </p>
                      <div className="flex items-center justify-center gap-2">
                        {renderStars(userReview.rating)}
                        <span className="text-sm">{userReview.title}</span>
                      </div>
                    </div>
                  ) : (
                    <Button onClick={() => setShowReviewForm(true)}>
                      Write a Review
                    </Button>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Login to write a review
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <Card>
          <CardHeader>
            <CardTitle>Write a Review</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <Label htmlFor="rating">Rating</Label>
                <div className="mt-2">
                  {renderStars(reviewForm.rating, true)}
                </div>
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={reviewForm.title}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, title: e.target.value })
                  }
                  placeholder="Summarize your experience"
                  required
                />
              </div>

              <div>
                <Label htmlFor="content">Review</Label>
                <Textarea
                  id="content"
                  value={reviewForm.content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setReviewForm({ ...reviewForm, content: e.target.value })
                  }
                  placeholder="Tell us about your experience with this product"
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Review"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReviewForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {reviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Reviews</h3>
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">
                        {review.user?.name || "Anonymous"}
                      </span>
                      {renderStars(review.rating)}
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-medium mb-2">{review.title}</h4>
                    {review.content && (
                      <p className="text-muted-foreground">{review.content}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
