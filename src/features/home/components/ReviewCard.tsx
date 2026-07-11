import Image from "next/image";
import { Star } from "lucide-react";
import type { GoogleReviewDoc } from "@/features/home/types";
import { DICTIONARY } from "@/constants/dictionary";
import { getAvatarUrl } from "@/utils/avatar";

export const ReviewCard = ({
  review,
  isClone = false,
}: {
  review: GoogleReviewDoc;
  isClone?: boolean;
}) => {
  const avatarUrl = getAvatarUrl(review.authorName, review.authorPhotoUrl);
  const hasReviewUrl = Boolean(review.reviewUrl);

  const content = (
    <>
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-brand-surface-muted border border-brand-border flex-shrink-0">
          <Image
            src={avatarUrl}
            alt={review.authorName}
            title={`${review.authorName} - ${DICTIONARY.home.googleReviews.avatarTitleSuffix}`}
            fill
            sizes="48px"
            className="object-cover"
            unoptimized
          />
        </div>
        <div>
          <h3 className="font-bold text-text-primary">{review.authorName}</h3>
        </div>
      </div>

      <div
        className="flex items-center gap-0.5 mb-3"
        aria-label={`${review.rating} ${DICTIONARY.home.googleReviews.ariaRating}`}
        role="img"
      >
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < review.rating
                ? "fill-google-yellow text-google-yellow"
                : "fill-brand-border text-brand-border"
            }`}
            aria-hidden="true"
          />
        ))}
      </div>

      <p className="text-text-secondary text-sm leading-relaxed flex-grow">
        &quot;{review.text}&quot;
      </p>
    </>
  );

  const containerClasses =
    "w-72 md:w-96 flex-shrink-0 bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-md hover:shadow-lg transition-all flex flex-col";

  if (hasReviewUrl && !isClone) {
    return (
      <a
        href={review.reviewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`block cursor-pointer ${containerClasses}`}
        title={`${review.authorName} - ${DICTIONARY.home.googleReviews.avatarTitleSuffix}`}
      >
        {content}
      </a>
    );
  }

  if (hasReviewUrl && isClone) {
    return (
      <div
        className={containerClasses}
        aria-hidden="true"
      >
        {content}
      </div>
    );
  }

  return <div className={containerClasses}>{content}</div>;
};
