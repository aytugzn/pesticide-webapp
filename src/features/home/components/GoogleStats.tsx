"use client";

import { Suspense, use, type ReactNode } from "react";
import { BadgeCheck, Star } from "lucide-react";
import Image from "next/image";
import logoImg from "@/../public/logo.svg";
import { DICTIONARY } from "@/constants/dictionary";
import { ScrollButton } from "@/components/ui/ScrollButton";
import { InstagramIcon, FacebookIcon } from "@/components/ui/Icons";
import { useGoogleStatsPromise } from "@/features/home/components/GoogleStatsProvider";
import type { GoogleStatsData } from "@/features/home/types";

type GoogleStatsFrameProps = {
  statsContent: ReactNode;
  socialContent?: ReactNode;
};

type GoogleSocialLinksProps = {
  instagramUrl?: string;
  facebookUrl?: string;
};

/**
 * Preserves the Google stats area dimensions while the server promise resolves.
 *
 * @returns A decorative, non-blocking skeleton for the stats content only
 */
const GoogleStatsSkeleton = () => (
  <div
    className="flex min-h-20 min-w-0 flex-1 items-center gap-3 sm:min-h-14 sm:min-w-64 sm:gap-4"
    aria-hidden="true"
  >
    <div
      className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-brand-surface-muted md:h-14 md:w-14"
    />
    <div className="flex min-w-0 flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="h-4 w-24 animate-pulse rounded-brand-sm bg-brand-surface-muted" />
        <div className="h-4 w-20 animate-pulse rounded-full bg-brand-surface-muted" />
      </div>
      <div className="flex flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:gap-1.5">
        <div className="flex items-center gap-1.5">
          <div className="h-4 w-10 animate-pulse rounded-brand-sm bg-brand-surface-muted" />
          <div className="h-3 w-16 animate-pulse rounded-brand-sm bg-brand-surface-muted" />
        </div>
        <div className="h-3 w-24 animate-pulse rounded-brand-sm bg-brand-surface-muted" />
      </div>
    </div>
  </div>
);

/**
 * Provides the shared visual frame for stats and independently available links.
 *
 * @param props - Stats slot and optional social-link slot
 * @returns The bordered Google and social information row
 */
const GoogleStatsFrame = ({
  statsContent,
  socialContent,
}: GoogleStatsFrameProps) => (
  <div className="flex w-full min-w-0 items-center justify-between gap-3 border-t border-brand-border/50 pt-6 sm:gap-4">
    {statsContent}
    {socialContent}
  </div>
);

/**
 * Formats and renders a validated Google rating with its source attribution.
 *
 * @param props - Validated numeric rating and positive review count
 * @returns The business identity, rating, single star, count, and attribution
 */
const GoogleStatsDetails = ({ data }: { data: GoogleStatsData }) => {
  const ratingText = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(data.rating);
  const reviewCountText = new Intl.NumberFormat("tr-TR").format(
    data.reviewCount,
  );

  return (
    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-border bg-brand-surface shadow-sm md:h-14 md:w-14">
        <Image
          src={logoImg}
          alt={DICTIONARY.global.logo.alt}
          title={DICTIONARY.global.logo.title}
          fill
          className="object-contain p-1.5 dark:invert dark:brightness-0"
        />
      </div>

      <div className="flex min-w-0 flex-col justify-center gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-bold leading-none text-text-primary md:text-base">
            {DICTIONARY.home.googleStats.businessName}
          </p>
          <span
            className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-surface-neutral px-1.5 py-0.5 text-xs font-normal leading-none tracking-normal text-text-muted"
            translate="no"
          >
            <BadgeCheck
              className="h-3.5 w-3.5 text-google-blue"
              aria-hidden="true"
            />
            {DICTIONARY.home.googleStats.sourceBadge}
          </span>
        </div>

        <div className="mt-0.5 flex flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:gap-1.5">
          <div className="flex items-center gap-1.5">
            <span
              className="text-sm font-black leading-none text-text-primary md:text-base"
              aria-hidden="true"
            >
              {ratingText}
            </span>
            <Star
              className="h-3.5 w-3.5 fill-google-yellow text-google-yellow md:h-4 md:w-4"
              aria-label={DICTIONARY.home.googleStats.ratingAria.replace(
                "{rating}",
                ratingText,
              )}
              role="img"
            />
          </div>
          <ScrollButton
            targetId="google-reviews"
            variant="unstyled"
            title={DICTIONARY.home.googleReviews.title}
            className="h-auto min-h-0 whitespace-nowrap px-0 text-xs font-medium text-text-secondary transition-all hover:text-brand-primary hover:underline md:text-sm"
          >
            ({reviewCountText} {DICTIONARY.home.googleStats.reviewsText})
          </ScrollButton>
        </div>
      </div>
    </div>
  );
};

/**
 * Renders social links independently from Google promise resolution.
 *
 * @param props - Optional published Instagram and Facebook URLs
 * @returns External social links, or null when neither URL is available
 */
const GoogleSocialLinks = ({
  instagramUrl,
  facebookUrl,
}: GoogleSocialLinksProps) => {
  if (!instagramUrl && !facebookUrl) return null;

  return (
    <div className="flex shrink-0 items-center gap-2 md:gap-3">
      {instagramUrl && (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-brand-border/50 bg-brand-surface p-2.5 text-instagram shadow-sm transition-all duration-300 hover:scale-110 hover:bg-instagram/5 sm:p-3"
          aria-label={DICTIONARY.social.instagram.aria}
          title={DICTIONARY.social.instagram.aria}
        >
          <InstagramIcon
            className="h-4 w-4 md:h-5 md:w-5"
            aria-hidden="true"
          />
        </a>
      )}
      {facebookUrl && (
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-brand-border/50 bg-brand-surface p-2.5 text-facebook shadow-sm transition-all duration-300 hover:scale-110 hover:bg-facebook/5 sm:p-3"
          aria-label={DICTIONARY.social.facebook.aria}
          title={DICTIONARY.social.facebook.aria}
        >
          <FacebookIcon
            className="h-4 w-4 md:h-5 md:w-5"
            aria-hidden="true"
          />
        </a>
      )}
    </div>
  );
};

/**
 * Resolves the shared server promise inside the stats-only Suspense boundary.
 *
 * @returns Validated stats details, or null for empty and error states
 */
const ResolvedGoogleStats = ({
  instagramUrl,
  facebookUrl,
}: GoogleSocialLinksProps) => {
  const statsPromise = useGoogleStatsPromise();
  const state = use(statsPromise);
  const socialContent = (
    <GoogleSocialLinks
      instagramUrl={instagramUrl}
      facebookUrl={facebookUrl}
    />
  );

  if (state.status === "success") {
    return (
      <GoogleStatsFrame
        statsContent={<GoogleStatsDetails data={state.data} />}
        socialContent={socialContent}
      />
    );
  }

  if (!instagramUrl && !facebookUrl) return null;

  return (
    <div className="flex w-full items-center justify-start">{socialContent}</div>
  );
};

/**
 * Renders the stats-only loading frame for a server Suspense boundary.
 *
 * @param props - Optional published Instagram and Facebook URLs
 * @returns Google stats skeleton with independently available social links
 */
export const GoogleStatsLoading = ({
  instagramUrl,
  facebookUrl,
}: GoogleSocialLinksProps) => {
  const finalInstagramUrl = instagramUrl ?? DICTIONARY.social.instagram.url;
  const finalFacebookUrl = facebookUrl ?? DICTIONARY.social.facebook.url;
  const hasSocialLinks = Boolean(finalInstagramUrl || finalFacebookUrl);

  return (
    <GoogleStatsFrame
      statsContent={<GoogleStatsSkeleton />}
      socialContent={
        hasSocialLinks ? (
          <GoogleSocialLinks
            instagramUrl={finalInstagramUrl}
            facebookUrl={finalFacebookUrl}
          />
        ) : undefined
      }
    />
  );
};

/**
 * Displays Google stats from the public-layout promise and independent socials.
 * Suspense is limited to the stats slot so the rest of the Hero remains ready.
 *
 * @param props - Optional published Instagram and Facebook URLs
 * @returns The stats/social row, a stats skeleton, or null after an empty result
 */
export const GoogleStats = ({
  instagramUrl,
  facebookUrl,
}: GoogleSocialLinksProps) => {
  const finalInstagramUrl = instagramUrl ?? DICTIONARY.social.instagram.url;
  const finalFacebookUrl = facebookUrl ?? DICTIONARY.social.facebook.url;

  return (
    <Suspense
      fallback={
        <GoogleStatsLoading
          instagramUrl={finalInstagramUrl}
          facebookUrl={finalFacebookUrl}
        />
      }
    >
      <ResolvedGoogleStats
        instagramUrl={finalInstagramUrl}
        facebookUrl={finalFacebookUrl}
      />
    </Suspense>
  );
};
