"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import type { HeroSlideDoc } from "@/features/home/types";

export const HeroSlider = ({ slides, autoplayDelay = 5000 }: { slides: HeroSlideDoc[], autoplayDelay?: number }) => {
  const [emblaRef] = useEmblaCarousel(
    { loop: true }, 
    [Autoplay({ delay: autoplayDelay, stopOnInteraction: false })]
  );

  if (!slides || slides.length === 0) {
    return <div className="w-full h-full bg-brand-surface-muted animate-pulse" />;
  }

  return (
    <div className="overflow-hidden w-full h-full relative" ref={emblaRef}>
      <div className="flex h-full">
        {slides.map((slide, index) => (
          <div className="flex-none w-full min-w-0 h-full relative" key={slide.id || slide.imageUrl}>
            <Image
              src={slide.imageUrl}
              alt={slide.altText || `Slide ${index + 1}`}
              fill
              priority={index === 0}
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {/* Subtle Gradient Overlay for text readability if needed later */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>
        ))}
      </div>
    </div>
  );
};
