import { DICTIONARY } from "@/constants/dictionary";
import { Button } from "@/components/ui/Button";
import { Phone, MessageCircle, PhoneCall } from "lucide-react";
import { GoogleStats } from "./GoogleStats";
import { ImageSlider } from "@/components/ui/ImageSlider";
import { StickyMobileActions } from "./StickyMobileActions";
import type { HeroSlideDoc, GoogleStatsDoc } from "@/features/home/types";

export const Hero = ({ 
  slides, 
  telUrl,
  whatsappUrl,
  autoplayDelay,
  stats,
  instagramUrl,
  facebookUrl
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
    <section className="relative w-full pt-4 pb-16 md:pb-24 md:pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Text & Actions */}
          <div className="flex flex-col space-y-8 mt-8 lg:mt-0">
            <div className="space-y-4">
              <span className="text-xs font-black text-brand-primary tracking-widest uppercase">
                {DICTIONARY.home.hero.tagline}
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black text-text-primary leading-tight tracking-tight">
                {DICTIONARY.home.hero.titleLine1} <br className="hidden md:block" />
                <span className="text-brand-primary">{DICTIONARY.home.hero.titleLine2}</span>
              </h1>
              <p className="text-text-secondary text-base md:text-lg max-w-lg mt-4 leading-relaxed font-medium">
                {DICTIONARY.home.hero.description1}{" "}
                <strong className="text-text-primary font-bold">{DICTIONARY.home.hero.description2}</strong>{" "}
                {DICTIONARY.home.hero.description3}
              </p>
            </div>

            {/* Actions */}
            <div id="hero-actions" className="grid grid-cols-2 lg:flex lg:flex-row gap-3 pt-2 w-full">
              <Button 
                href={telUrl}
                variant="outline"
                className="!rounded-full px-3 py-4 text-xs sm:text-sm xl:text-base font-bold shadow-sm lg:flex-1 justify-center bg-brand-surface"
              >
                <Phone className="w-4 h-4 mr-1.5 flex-shrink-0"  aria-hidden="true" />
                <span className="truncate">{DICTIONARY.home.stickyActions.callNow}</span>
              </Button>

              <Button 
                href={whatsappUrl}
                variant="success"
                className="!rounded-full px-3 py-4 text-xs sm:text-sm xl:text-base font-bold shadow-sm lg:flex-1 justify-center border border-whatsapp/50 dark:border-whatsapp/30"
                external
              >
                <MessageCircle className="w-4 h-4 mr-1.5 fill-current flex-shrink-0"  aria-hidden="true" />
                <span className="truncate">{DICTIONARY.social.whatsapp.text}</span>
              </Button>

              <Button 
                variant="primary"
                className="!rounded-full col-span-2 lg:col-span-1 px-3 py-4 text-xs sm:text-sm xl:text-base font-bold shadow-md hover:shadow-xl shadow-brand-primary/20 lg:flex-1 justify-center"
              >
                <PhoneCall className="w-4 h-4 mr-1.5 flex-shrink-0"  aria-hidden="true" />
                <span className="truncate">{DICTIONARY.navbar.callMeBack}</span>
              </Button>
            </div>

            {/* Stats */}
            <GoogleStats stats={stats} instagramUrl={instagramUrl} facebookUrl={facebookUrl} />
          </div>

          {/* Right Column: Slider */}
          <div className="w-full aspect-square md:aspect-landscape lg:aspect-square xl:aspect-landscape rounded-3xl overflow-hidden shadow-2xl relative group">
            <ImageSlider 
              images={slides.map(slide => ({
                id: slide.id || slide.imageUrl,
                url: slide.imageUrl,
                altText: slide.altText
              }))} 
              autoplayDelay={autoplayDelay} 
            />
          </div>

        </div>
      </div>
      
      {/* Mobile Sticky Bottom Bar */}
      <StickyMobileActions telUrl={telUrl} whatsappUrl={whatsappUrl} />
    </section>
  );
};
