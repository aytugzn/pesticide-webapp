import type { Metadata } from "next";
import { DICTIONARY } from "@/constants/dictionary";
import { getGooglePlaceDetails } from "@/lib/google-places";
import { Hero } from "@/features/home/components/sections/Hero";
import { ServicesSection } from "@/features/home/components/sections/ServicesSection";
import { WhyUsSection } from "@/features/home/components/sections/WhyUsSection";
import { GoogleReviewsSection } from "@/features/home/components/sections/GoogleReviewsSection";
import { ContactSection } from "@/features/home/components/sections/ContactSection";
import { StickyMobileActions } from "@/features/home/components/StickyMobileActions";
import { AlternatingSections } from "@/components/layout/AlternatingSections";
import {
  HERO_SLIDER_AUTOPLAY_DELAY_FALLBACK,
  SERVICES_SLIDER_AUTOPLAY_DELAY_FALLBACK,
  REVIEWS_SLIDER_AUTOPLAY_DELAY_FALLBACK,
  DEFAULT_PHONE,
} from "@/constants/ui";
import type { RegionDoc, SettingsDoc, PestDoc } from "@/types";
import type { GoogleReviewDoc, HeroSlideDoc } from "@/features/home/types";
import { getHomeData } from "@/features/home/actions";
import { generateTelUrl, generateWhatsAppUrl } from "@/utils/phone";

export const metadata: Metadata = {
  title: DICTIONARY.meta.default.title,
  description: DICTIONARY.meta.default.description,
};

const DEFAULT_SETTINGS: SettingsDoc = {
  phone: DEFAULT_PHONE,
  heroAutoplayDelay: HERO_SLIDER_AUTOPLAY_DELAY_FALLBACK,
  servicesAutoplayDelay: SERVICES_SLIDER_AUTOPLAY_DELAY_FALLBACK,
  reviewsAutoplayDelay: REVIEWS_SLIDER_AUTOPLAY_DELAY_FALLBACK,
};

const HomePage = async () => {
  const homeDataResponse = await getHomeData();

  let slides: HeroSlideDoc[] = [];
  let pests: PestDoc[] = [];
  let customReviews: GoogleReviewDoc[] = [];
  let viewAllReviewsUrl: string = "#";
  let settings: SettingsDoc = DEFAULT_SETTINGS;

  let regions: RegionDoc[] = [];

  if (!homeDataResponse.success) {
    console.error(
      DICTIONARY.systemErrors.logs.homeDataFetch,
      homeDataResponse.error,
    );
  } else if (homeDataResponse.data) {
    slides = homeDataResponse.data.slides;
    pests = homeDataResponse.data.pests;
    regions = homeDataResponse.data.regions;
    customReviews = homeDataResponse.data.customReviews;
    viewAllReviewsUrl = homeDataResponse.data.viewAllReviewsUrl;
    settings = homeDataResponse.data.settings || DEFAULT_SETTINGS;
  }

  // Fetch Google Places data
  const placesResponse = await getGooglePlaceDetails(settings.googlePlaceId);
  const stats = placesResponse.success ? placesResponse.data?.stats : null;
  // Placeholder images

  const rawPhone = settings.phone || DEFAULT_PHONE;
  const whatsappUrl = generateWhatsAppUrl(rawPhone);
  const telUrl = generateTelUrl(rawPhone);
  // Delays are defined in seconds in the database/constants, but Embla expects milliseconds
  const heroAutoplayDelay =
    (settings.heroAutoplayDelay || HERO_SLIDER_AUTOPLAY_DELAY_FALLBACK) * 1000;
  const servicesAutoplayDelay =
    (settings.servicesAutoplayDelay ||
      SERVICES_SLIDER_AUTOPLAY_DELAY_FALLBACK) * 1000;
  const reviewsAutoplayDelay =
    (settings.reviewsAutoplayDelay || REVIEWS_SLIDER_AUTOPLAY_DELAY_FALLBACK) *
    1000;

  return (
    <main className="flex-1 flex flex-col w-full">
      <AlternatingSections>
        <Hero
          slides={slides}
          telUrl={telUrl}
          whatsappUrl={whatsappUrl}
          autoplayDelay={heroAutoplayDelay}
          stats={stats || undefined}
          instagramUrl={settings.instagramUrl}
          facebookUrl={settings.facebookUrl}
        />
        <ServicesSection pests={pests} autoplayDelay={servicesAutoplayDelay} />
        <WhyUsSection />
        <GoogleReviewsSection
          autoplayDelay={reviewsAutoplayDelay}
          reviews={customReviews}
          viewAllUrl={viewAllReviewsUrl}
        />
        <ContactSection pests={pests} regions={regions} />
      </AlternatingSections>
      {/* Mobile Sticky Bottom Bar (Placed here to escape local z-index stacking contexts) */}
      <StickyMobileActions telUrl={telUrl} whatsappUrl={whatsappUrl} />
    </main>
  );
};

export default HomePage;
