"use client";

import { Star } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { ReviewCard } from "./ReviewCard";
import { REVIEWS_SLIDER_AUTOPLAY_DELAY_FALLBACK } from "@/constants/ui";
import type { GoogleReviewDoc } from "@/features/home/types";

export const ReviewsMarquee = ({
  reviews,
  autoplayDelay,
  unavailable = false,
}: {
  reviews: GoogleReviewDoc[];
  autoplayDelay?: number;
  unavailable?: boolean;
}) => {
  if (!reviews || reviews.length === 0) {
    return (
      <div
        className="mx-auto flex max-w-xl flex-col items-center justify-center gap-3 py-8 text-center text-text-secondary"
        role={unavailable ? "status" : undefined}
      >
        <Star
          className="h-12 w-12 text-brand-primary/35"
          aria-hidden="true"
        />
        {unavailable && (
          <p className="text-sm leading-relaxed md:text-base">
            {DICTIONARY.home.googleReviews.unavailable}
          </p>
        )}
      </div>
    );
  }

  // Pad to at least 8 items so the marquee fills large screens
  const paddedReviews: typeof reviews = [];
  let currentLength = reviews.length;
  while (currentLength < 8) {
    paddedReviews.push(...reviews);
    currentLength += reviews.length;
  }

  // Set 2 is an exact clone of original + padded
  const set2Reviews = [...reviews, ...paddedReviews];

  // Runtime animation duration must be set via inline style
  const marqueeStyle = {
    animationDuration: `${(autoplayDelay ?? REVIEWS_SLIDER_AUTOPLAY_DELAY_FALLBACK * 1000) / 1000}s`,
  };

  return (
    <div className="relative w-full overflow-hidden flex group py-4">
      {/* Gradient Masks for smooth fading edges (matches dynamic neutral background) */}
      <div
        className="absolute left-0 top-0 bottom-0 w-12 md:w-32 z-10 reviews-marquee-fade-left pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-12 md:w-32 z-10 reviews-marquee-fade-right pointer-events-none"
        aria-hidden="true"
      />

      {/* Scrolling Track */}
      <div
        className="flex w-max animate-marquee group-hover:animate-paused"
        style={marqueeStyle}
      >
        {/* We use two exact copies of the blocks. 
            pr-6 matches gap-6 perfectly so the math for -50% translation is flawless. */}
        <div className="flex gap-6 pr-6">
          {/* SSR + Client: Only render original reviews for SEO */}
          {reviews.map((review, idx) => (
            <ReviewCard
              key={`set1-orig-${review.id}-${idx}`}
              review={review}
              isClone={false}
            />
          ))}

          {paddedReviews.map((review, idx) => (
            <ReviewCard
              key={`set1-clone-${review.id}-${idx}`}
              review={review}
              isClone={true}
            />
          ))}
        </div>

        {/* Duplicate for infinite effect */}
        <div className="flex gap-6 pr-6">
          {set2Reviews.map((review, idx) => (
            <ReviewCard
              key={`set2-${review.id}-${idx}`}
              review={review}
              isClone={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
