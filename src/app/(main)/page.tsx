import type { Metadata } from "next";
import { DICTIONARY } from "@/constants/dictionary";
import { getGooglePlaceDetails } from "@/lib/google-places";
import { Hero } from "@/features/home/components/Hero";
import { ServicesSection } from "@/features/home/components/ServicesSection";
import { GoogleReviewsSection } from "@/features/home/components/GoogleReviewsSection";
import { AlternatingSections } from "@/components/layout/AlternatingSections";
import { HERO_SLIDER_AUTOPLAY_DELAY_FALLBACK, SERVICES_SLIDER_AUTOPLAY_DELAY_FALLBACK, REVIEWS_SLIDER_AUTOPLAY_DELAY_FALLBACK } from "@/constants/ui";
import type { SettingsDoc, PestDoc } from "@/types";
import type { HeroSlideDoc, GoogleReviewDoc } from "@/features/home/types";
import { getHomeData } from "@/features/home/actions";
import { generateWhatsAppUrl, generateTelUrl } from "@/utils/phone";

export const metadata: Metadata = {
  title: DICTIONARY.meta.title,
  description: DICTIONARY.meta.description,
};

const DEFAULT_SETTINGS: SettingsDoc = {
  phone: "905000000000",
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

  if (!homeDataResponse.success) {
    console.error("Failed to load home data:", homeDataResponse.error);
  } else if (homeDataResponse.data) {
    slides = homeDataResponse.data.slides;
    pests = homeDataResponse.data.pests;
    customReviews = homeDataResponse.data.customReviews;
    viewAllReviewsUrl = homeDataResponse.data.viewAllReviewsUrl;
    settings = homeDataResponse.data.settings || DEFAULT_SETTINGS;
  }

  // Fetch Google Places data
  const placesResponse = await getGooglePlaceDetails(settings.googlePlaceId);
  const stats = placesResponse.success ? placesResponse.data?.stats : null;
  // Placeholder images

  const rawPhone = settings.phone || "905000000000";
  const whatsappUrl = generateWhatsAppUrl(rawPhone);
  const telUrl = generateTelUrl(rawPhone);
  // Delays are defined in seconds in the database/constants, but Embla expects milliseconds
  const heroAutoplayDelay = (settings.heroAutoplayDelay || HERO_SLIDER_AUTOPLAY_DELAY_FALLBACK) * 1000;
  const servicesAutoplayDelay = (settings.servicesAutoplayDelay || SERVICES_SLIDER_AUTOPLAY_DELAY_FALLBACK) * 1000;
  const reviewsAutoplayDelay = (settings.reviewsAutoplayDelay || REVIEWS_SLIDER_AUTOPLAY_DELAY_FALLBACK) * 1000;

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
        <GoogleReviewsSection autoplayDelay={reviewsAutoplayDelay} reviews={customReviews} viewAllUrl={viewAllReviewsUrl} />
      </AlternatingSections>
    </main>
  );
};

export default HomePage;
