"use client";

import { useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Image from "next/image";
import { ImagePlaceholder } from "./ImagePlaceholder";
import { HERO_IMAGE_SIZES } from "@/constants/ui";

export type SliderImage = {
  id: string;
  url: string;
  altText?: string;
  title?: string;
};

type ImageSliderProps = {
  images: SliderImage[];
  fallbackImages?: SliderImage[];
  autoplayDelay?: number;
};

export const ImageSlider = ({
  images,
  fallbackImages = [],
  autoplayDelay = 5000,
}: ImageSliderProps) => {
  const [failedImageKeys, setFailedImageKeys] = useState<string[]>([]);
  const visiblePrimaryImages = images.filter(
    (image) => !failedImageKeys.includes(`${image.id}:${image.url}`),
  );
  const visibleFallbackImages = fallbackImages.filter(
    (image) => !failedImageKeys.includes(`${image.id}:${image.url}`),
  );
  const visibleImages =
    visiblePrimaryImages.length > 0
      ? visiblePrimaryImages
      : visibleFallbackImages;
  const isSingleImage = visibleImages.length === 1;

  const [emblaRef] = useEmblaCarousel(
    {
      loop: !isSingleImage,
      watchDrag: !isSingleImage,
    },
    isSingleImage
      ? []
      : [Autoplay({ delay: autoplayDelay, stopOnInteraction: false })],
  );

  if (visibleImages.length === 0) {
    return <ImagePlaceholder />;
  }

  return (
    <div className="overflow-hidden w-full h-full relative" ref={emblaRef}>
      <div className="flex h-full">
        {visibleImages.map((img, index) => (
          <div
            className="flex-none w-full min-w-0 h-full relative"
            key={img.id}
          >
            <Image
              src={img.url}
              alt={img.altText || `Slide ${index + 1}`}
              title={img.title || img.altText}
              fill
              priority={index === 0}
              className="object-cover"
              sizes={HERO_IMAGE_SIZES}
              onError={() => {
                const failedImageKey = `${img.id}:${img.url}`;
                setFailedImageKeys((current) =>
                  current.includes(failedImageKey)
                    ? current
                    : [...current, failedImageKey],
                );
              }}
            />
            {/* Subtle Gradient Overlay for text readability if needed later */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent pointer-events-none"
              aria-hidden="true"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
