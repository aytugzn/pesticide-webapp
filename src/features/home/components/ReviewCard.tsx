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

  // Runtime background image style
  const cloneAvatarStyle = { backgroundImage: `url(${avatarUrl})` };

  const content = (
    <>
      {/* Author Info */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-brand-surface-muted border border-brand-border flex-shrink-0">
          {isClone ? (
            <div
              className="w-full h-full bg-cover bg-center"
              style={cloneAvatarStyle}
            />
          ) : (
            <Image
              src={avatarUrl}
              alt={review.authorName}
              title={`${review.authorName} - ${DICTIONARY.home.googleReviews.avatarTitleSuffix}`}
              fill
              sizes="48px"
              className="object-cover"
              unoptimized // Added temporarily to fix 404 image error
            />
          )}
        </div>
        <div>
          <h3 className="font-bold text-text-primary">{review.authorName}</h3>
        </div>
      </div>

      {/* Stars */}
      <div
        className="flex items-center gap-0.5 mb-3"
        aria-label={`${review.rating} ${DICTIONARY.home.googleReviews.ariaRating}`}
        role="img"
      >
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < review.rating ? "fill-google-yellow text-google-yellow" : "fill-brand-border text-brand-border"}`}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Review Text */}
      <p className="text-text-secondary text-sm leading-relaxed flex-grow">
        "{review.text}"
      </p>
    </>
  );

  const containerClasses =
    "w-72 md:w-96 flex-shrink-0 bg-brand-surface border border-brand-border rounded-2xl p-6 shadow-md hover:shadow-lg transition-all flex flex-col";

  if (review.reviewUrl) {
    if (isClone) {
      // Clones use onClick instead of <a> to hide from SEO tools looking for duplicate links
      return (
        <div
          onClick={() =>
            window.open(review.reviewUrl, "_blank", "noopener,noreferrer")
          }
          className={`block cursor-pointer ${containerClasses}`}
          aria-hidden="true"
          tabIndex={-1}
        >
          {content}
        </div>
      );
    }

    return (
      <a
        href={review.reviewUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`block cursor-pointer ${containerClasses}`}
      >
        {content}
      </a>
    );
  }

  return (
    <article
      className={containerClasses}
      aria-hidden={isClone ? "true" : undefined}
    >
      {content}
    </article>
  );
};
