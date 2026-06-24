import { DICTIONARY } from "@/constants/dictionary";
import { Button } from "@/components/ui/Button";
import { Star } from "lucide-react";
import { ReviewsMarquee } from "./ReviewsMarquee";
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
        <ReviewsMarquee reviews={reviews} autoplayDelay={autoplayDelay} />

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
