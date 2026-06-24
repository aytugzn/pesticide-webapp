import { DICTIONARY } from "@/constants/dictionary";
import { Button } from "@/components/ui/Button";
import { Star } from "lucide-react";
import { ReviewCard } from "./ReviewCard";
import { REVIEWS_SLIDER_AUTOPLAY_DELAY_FALLBACK } from "@/constants/ui";
import type { GoogleReviewDoc } from "@/features/home/types";



export const GoogleReviewsSection = ({ 
  reviews = [], 
  autoplayDelay,
  viewAllUrl = "#"
}: { 
  reviews?: GoogleReviewDoc[], 
  autoplayDelay?: number,
  viewAllUrl?: string
}) => {
  // Ensure we have enough reviews to fill a wide screen (at least 6-8 items per set)
  // so the marquee doesn't run out of content on large desktop monitors.
  const baseReviews = [...reviews];
  if (baseReviews.length > 0) {
    while (baseReviews.length < 8) {
      baseReviews.push(...reviews);
    }
  }

  const marqueeStyle = { 
    animationDuration: `${(autoplayDelay || (REVIEWS_SLIDER_AUTOPLAY_DELAY_FALLBACK * 1000)) / 1000}s` 
  };

  return (
    <section id="google-reviews" className="w-full py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center space-y-4 mb-12">
          <div 
            className="flex items-center gap-1 mb-2"
            aria-label={DICTIONARY.home.googleReviews.ariaStars}
            role="img"
          >
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-8 h-8 md:w-10 md:h-10 fill-google-yellow text-google-yellow drop-shadow-sm"  aria-hidden="true" />
            ))}
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-black text-text-primary">
            {DICTIONARY.home.googleReviews.title}
          </h2>
          <p className="text-text-secondary max-w-2xl text-lg">
            {DICTIONARY.home.googleReviews.description}
          </p>
        </div>

        {/* Reviews Marquee */}
        {reviews.length > 0 ? (
          <div className="relative w-full overflow-hidden flex group py-4">
            {/* Gradient Masks for smooth fading edges (matches dynamic neutral background) */}
            <div className="absolute left-0 top-0 bottom-0 w-12 md:w-32 z-10 bg-gradient-to-r from-[var(--section-bg)] to-transparent pointer-events-none" aria-hidden="true"/>
            <div className="absolute right-0 top-0 bottom-0 w-12 md:w-32 z-10 bg-gradient-to-l from-[var(--section-bg)] to-transparent pointer-events-none" aria-hidden="true"/>

            {/* Scrolling Track */}
            <div 
              className="flex animate-marquee group-hover:[animation-play-state:paused] w-max"
              style={marqueeStyle}
            >
              {/* We use two exact copies of the blocks. 
                  pr-6 matches gap-6 perfectly so the math for -50% translation is flawless. */}
              <div className="flex gap-6 pr-6">
                {baseReviews.map((review, idx) => (
                  <ReviewCard key={`set1-${review.id}-${idx}`} review={review} />
                ))}
              </div>
              <div className="flex gap-6 pr-6" aria-hidden="true">
                {baseReviews.map((review, idx) => (
                  <ReviewCard key={`set2-${review.id}-${idx}`} review={review} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-brand-primary opacity-20">
            <Star className="w-16 h-16" aria-hidden="true" />
          </div>
        )}

        {/* View All Action */}
        {viewAllUrl && viewAllUrl !== "#" && (
          <div className="mt-12 flex justify-center">
            <Button 
              variant="outline" 
              href={viewAllUrl}
              className="rounded-full px-8 py-6 font-bold shadow-sm"
              external
            >
              {DICTIONARY.home.googleReviews.viewAllButton}
            </Button>
          </div>
        )}

      </div>
    </section>
  );
};
