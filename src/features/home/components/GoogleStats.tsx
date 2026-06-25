"use client";

import { Star, BadgeCheck } from "lucide-react";
import Image from "next/image";
import { DICTIONARY } from "@/constants/dictionary";
import { ScrollButton } from "@/components/ui/ScrollButton";
import logoImg from '@/../public/dmr.svg';
import type { GoogleStatsDoc } from "@/features/home/types";

import { InstagramIcon, FacebookIcon } from "@/components/ui/Icons";

export const GoogleStats = ({ stats, instagramUrl, facebookUrl }: { stats?: GoogleStatsDoc, instagramUrl?: string, facebookUrl?: string }) => {
  // Safe fallbacks to dictionary if no dynamic stats are passed yet
  const displayRating = stats?.rating || DICTIONARY.home.googleStats.rating;
  const displayReviewCount = stats?.reviewCount || DICTIONARY.home.googleStats.reviewCount;
  
  const finalInstagramUrl = instagramUrl || DICTIONARY.social.instagram.url;
  const finalFacebookUrl = facebookUrl || DICTIONARY.social.facebook.url;

  return (
    <div className="flex items-center w-full pt-6 border-t border-brand-border/50">
      
      <div className="flex items-center gap-4">
        {/* Business Logo */}
        <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full bg-brand-surface flex items-center justify-center flex-shrink-0 shadow-sm border border-brand-border overflow-hidden">
          <Image 
            src={logoImg} 
            alt={DICTIONARY.navbar.logo.alt} 
            title={DICTIONARY.navbar.logo.title} 
            fill 
            className="object-contain p-1.5 dark:invert dark:brightness-0"
          />
        </div>
        
        {/* Business Info & Stars */}
        <div className="flex flex-col justify-center gap-1.5">
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-text-primary leading-none text-sm md:text-base">
              {DICTIONARY.home.googleStats.businessName}
            </p>
            <BadgeCheck 
              className="w-4 h-4 md:w-5 md:h-5 text-google-blue" 
              strokeWidth={2.5} 
              aria-label={DICTIONARY.home.googleStats.verifiedBadgeAria}  
              role="img" 
            />
          </div>
          
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm md:text-base font-black text-text-primary leading-none">{displayRating}</span>
            <div 
              className="flex gap-0.5"
              aria-label={DICTIONARY.home.googleReviews.ariaStars}
              role="img"
            >
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 md:w-4 md:h-4 fill-google-yellow text-google-yellow"  aria-hidden="true" />
              ))}
            </div>
            <ScrollButton 
              targetId="google-reviews"
              variant="unstyled"
              className="text-xs md:text-sm font-medium text-text-muted hover:text-brand-primary hover:underline transition-all ml-0.5"
            >
              ({displayReviewCount} {DICTIONARY.home.googleStats.reviewsText})
            </ScrollButton>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="flex items-center gap-2 md:gap-3 ml-auto pl-2">
        <a 
          href={finalInstagramUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2.5 sm:p-3 rounded-full bg-brand-surface border border-brand-border/50 text-instagram hover:bg-instagram/5 hover:scale-110 transition-all duration-300 shadow-sm"
          aria-label={DICTIONARY.social.instagram.aria}
        >
          <InstagramIcon className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
        </a>
        <a 
          href={finalFacebookUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-2.5 sm:p-3 rounded-full bg-brand-surface border border-brand-border/50 text-facebook hover:bg-facebook/5 hover:scale-110 transition-all duration-300 shadow-sm"
          aria-label={DICTIONARY.social.facebook.aria}
        >
          <FacebookIcon className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
        </a>
      </div>

    </div>
  );
};
