"use client";

import { Star, BadgeCheck } from "lucide-react";
import Image from "next/image";
import { DICTIONARY } from "@/constants/dictionary";
import logoImg from '@/../public/dmr.svg';
import type { GoogleStatsDoc } from "@/features/home/types";

export const GoogleStats = ({ stats }: { stats?: GoogleStatsDoc }) => {
  // Safe fallbacks to dictionary if no dynamic stats are passed yet
  const displayRating = stats?.rating || DICTIONARY.home.googleStats.rating;
  const displayReviewCount = stats?.reviewCount || DICTIONARY.home.googleStats.reviewCount;

  return (
    <div className="flex items-center gap-4 pt-6 border-t border-brand-border/50">
      {/* Business Logo */}
      <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full bg-brand-surface flex items-center justify-center flex-shrink-0 shadow-sm border border-brand-border overflow-hidden">
        <Image 
          src={logoImg} 
          alt={DICTIONARY.navbar.logoAlt} 
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
          <BadgeCheck className="w-4 h-4 md:w-5 md:h-5 text-google-blue" strokeWidth={2.5} aria-label={DICTIONARY.home.googleStats.verifiedBadgeAria} />
        </div>
        
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm md:text-base font-black text-text-primary leading-none">{displayRating}</span>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 md:w-4 md:h-4 fill-google-yellow text-google-yellow" />
            ))}
          </div>
          <a 
            href="#google-reviews"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("google-reviews")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="text-xs md:text-sm font-medium text-text-muted hover:text-brand-primary hover:underline transition-all ml-0.5"
          >
            ({displayReviewCount} {DICTIONARY.home.googleStats.reviewsText})
          </a>
        </div>
      </div>
    </div>
  );
};
