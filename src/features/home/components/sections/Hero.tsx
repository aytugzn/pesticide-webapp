import { DICTIONARY } from "@/constants/dictionary";
import { Button } from "@/components/ui/Button";
import { ScrollButton } from "@/components/ui/ScrollButton";
import { Phone, MessageCircle, PhoneCall } from "lucide-react";
import { GoogleStats } from "../GoogleStats";
import { ImageSlider } from "@/components/ui/ImageSlider";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { HeroSlideDoc, GoogleStatsDoc } from "@/features/home/types";

export const Hero = ({
  slides,
  telUrl,
  whatsappUrl,
  autoplayDelay,
  stats,
  instagramUrl,
  facebookUrl,
}: {
  slides: HeroSlideDoc[];
  telUrl: string;
  whatsappUrl: string;
  autoplayDelay?: number;
  stats?: GoogleStatsDoc;
  instagramUrl?: string;
  facebookUrl?: string;
}) => {
  return (
    <section className="relative w-full pt-4 pb-16 md:pb-24 md:pt-16" aria-labelledby="hero-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column: Text & Actions */}
          <div className="flex flex-col space-y-8 mt-8 lg:mt-0">
            <div className="space-y-4">
              <Eyebrow>{DICTIONARY.home.hero.tagline}</Eyebrow>
              <h1 id="hero-heading" className="text-4xl md:text-5xl lg:text-6xl font-heading font-black text-text-primary leading-tight tracking-tight">
                {DICTIONARY.home.hero.titleLine1}{" "}
                <br className="hidden md:block" />
                <span className="text-brand-primary">
                  {DICTIONARY.home.hero.titleLine2}
                </span>
              </h1>
              <p className="text-text-secondary text-base md:text-lg max-w-lg mt-4 leading-relaxed font-medium">
                {DICTIONARY.home.hero.description}
              </p>
              <p className="text-text-secondary text-base md:text-lg max-w-lg leading-relaxed font-medium">
                {DICTIONARY.home.hero.descriptionCta}
              </p>
            </div>

            {/* Actions */}
            <div
              id="hero-actions"
              className="grid grid-cols-2 lg:flex lg:flex-row gap-3 pt-2 w-full"
            >
              <Button
                href={telUrl}
                variant="outline"
                size="none"
                className="rounded-full px-3 py-4 text-xs sm:text-sm xl:text-base font-bold shadow-sm lg:flex-1 inline-flex items-center justify-center gap-2 transition-all duration-200 bg-brand-surface"
              >
                <Phone
                  className="w-4 h-4 mr-1.5 flex-shrink-0"
                  aria-hidden="true"
                />
                <span className="truncate">
                  {DICTIONARY.social.phone.callNow}
                </span>
              </Button>

              <Button
                href={whatsappUrl}
                variant="success"
                size="none"
                className="rounded-full px-3 py-4 text-xs sm:text-sm xl:text-base font-bold shadow-sm lg:flex-1 inline-flex items-center justify-center gap-2 transition-all duration-200 border border-whatsapp/50 dark:border-whatsapp/30"
                external
              >
                <MessageCircle
                  className="w-4 h-4 mr-1.5 fill-current flex-shrink-0"
                  aria-hidden="true"
                />
                <span className="truncate">
                  {DICTIONARY.social.whatsapp.text}
                </span>
              </Button>

              <ScrollButton
                targetId="contact"
                variant="primary"
                size="none"
                className="rounded-full col-span-2 lg:col-span-1 px-3 py-4 text-xs sm:text-sm xl:text-base font-bold shadow-md hover:shadow-xl shadow-brand-primary/20 lg:flex-1 inline-flex items-center justify-center gap-2 transition-all duration-200"
              >
                <PhoneCall
                  className="w-4 h-4 mr-1.5 flex-shrink-0"
                  aria-hidden="true"
                />
                <span className="truncate">
                  {DICTIONARY.social.phone.callMeBack}
                </span>
              </ScrollButton>
            </div>

            {/* Stats */}
            <GoogleStats
              stats={stats}
              instagramUrl={instagramUrl}
              facebookUrl={facebookUrl}
            />
          </div>

          {/* Right Column: Slider */}
          <div className="w-full aspect-square md:aspect-landscape lg:aspect-square xl:aspect-landscape rounded-3xl overflow-hidden shadow-2xl relative group">
            <ImageSlider
              images={slides.map((slide) => ({
                id: slide.id || slide.imageUrl,
                url: slide.imageUrl,
                altText: slide.altText,
              }))}
              autoplayDelay={autoplayDelay}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
