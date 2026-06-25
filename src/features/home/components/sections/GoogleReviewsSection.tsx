import { DICTIONARY } from "@/constants/dictionary";
import { Button } from "@/components/ui/Button";
import { Star } from "lucide-react";
import { ReviewsMarquee } from "../ReviewsMarquee";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { GoogleReviewDoc } from "@/features/home/types";

export const GoogleReviewsSection = ({
  reviews = [],
  autoplayDelay,
  viewAllUrl = "#",
}: {
  reviews?: GoogleReviewDoc[];
  autoplayDelay?: number;
  viewAllUrl?: string;
}) => {
  return (
    <section id="google-reviews" aria-labelledby="google-reviews-heading" className="w-full py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <SectionHeader 
          id="google-reviews-heading"
          align="center"
          eyebrow={
            <div 
              className="flex items-center justify-center gap-1"
              aria-label={DICTIONARY.home.googleReviews.ariaStars}
              role="img"
            >
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-8 h-8 md:w-10 md:h-10 fill-google-yellow text-google-yellow drop-shadow-sm"
                  aria-hidden="true"
                />
              ))}
            </div>
          }
          titlePrefix={DICTIONARY.home.googleReviews.title}
          description={DICTIONARY.home.googleReviews.description}
        />

        {/* Reviews Marquee */}
        <ReviewsMarquee reviews={reviews} autoplayDelay={autoplayDelay} />

        {/* View All Action */}
        {viewAllUrl && viewAllUrl !== "#" && (
          <div className="mt-12 flex justify-center">
            <Button
              variant="outline"
              size="none"
              href={viewAllUrl}
              className="rounded-full px-8 py-4 md:py-5 font-bold shadow-sm"
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
