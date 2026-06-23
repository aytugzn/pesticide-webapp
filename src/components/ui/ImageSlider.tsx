"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import { ImagePlaceholder } from "./ImagePlaceholder";
import { HERO_IMAGE_SIZES } from "@/constants/ui";

export interface SliderImage {
  id: string;
  url: string;
  altText?: string;
}

interface ImageSliderProps {
  images: SliderImage[];
  autoplayDelay?: number;
}

export const ImageSlider = ({ images, autoplayDelay = 5000 }: ImageSliderProps) => {
  const [emblaRef] = useEmblaCarousel(
    { loop: true }, 
    [Autoplay({ delay: autoplayDelay, stopOnInteraction: false })]
  );

  if (!images || images.length === 0) {
    return <ImagePlaceholder />;
  }

  return (
    <div className="overflow-hidden w-full h-full relative" ref={emblaRef}>
      <div className="flex h-full">
        {images.map((img, index) => (
          <div className="flex-none w-full min-w-0 h-full relative" key={img.id}>
            <Image
              src={img.url}
              alt={img.altText || `Slide ${index + 1}`}
              fill
              priority={index === 0}
              className="object-cover"
              sizes={HERO_IMAGE_SIZES}
            />
            {/* Subtle Gradient Overlay for text readability if needed later */}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent pointer-events-none" aria-hidden="true" />
          </div>
        ))}
      </div>
    </div>
  );
};
