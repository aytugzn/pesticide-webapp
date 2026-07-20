import { Suspense } from "react";
import type { Metadata, ResolvingMetadata } from "next";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
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
  WHY_US_SLIDER_AUTOPLAY_DELAY_FALLBACK,
  DEFAULT_PHONE,
} from "@/constants/ui";
import type { SettingsDoc } from "@/types";
import type {
  GoogleStatsPromise,
  HomeData,
} from "@/features/home/types";
import type { GlobalData } from "@/features/settings/types";
import { getHomeData } from "@/features/home/actions";
import { getGlobalData } from "@/features/settings/data";
import { getPublicGoogleStats } from "@/features/home/googlePlaces";
import {
  getLocalGlobalDataFallback,
  getLocalHomeDataFallback,
} from "@/lib/publicSnapshot";
import { generateTelUrl, generateWhatsAppUrl } from "@/utils/phone";

export const generateMetadata = async (
  _: Record<string, never>,
  parent: ResolvingMetadata,
): Promise<Metadata> => {
  const parentMetadata = await parent;
  const title = DICTIONARY.meta.default.title;
  const description = DICTIONARY.meta.default.description;

  return {
    title,
    description,
    alternates: { canonical: ROUTES.home },
    openGraph: {
      title,
      description,
      url: ROUTES.home,
      siteName: DICTIONARY.global.brand,
      images: parentMetadata.openGraph?.images,
      locale: DICTIONARY.meta.default.locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: parentMetadata.twitter?.images,
    },
  };
};

const DEFAULT_SETTINGS: SettingsDoc = {
  phone: DEFAULT_PHONE,
  heroAutoplayDelay: HERO_SLIDER_AUTOPLAY_DELAY_FALLBACK,
  servicesAutoplayDelay: SERVICES_SLIDER_AUTOPLAY_DELAY_FALLBACK,
  whyUsAutoplayDelay: WHY_US_SLIDER_AUTOPLAY_DELAY_FALLBACK,
  reviewsAutoplayDelay: REVIEWS_SLIDER_AUTOPLAY_DELAY_FALLBACK,
};

type HomePageViewProps = {
  homeData: HomeData;
  globalData: GlobalData;
  reviewsUnavailable: boolean;
  googleStatsPromise?: GoogleStatsPromise;
};

const HomePageView = ({
  homeData,
  globalData,
  reviewsUnavailable,
  googleStatsPromise,
}: HomePageViewProps) => {
  const { slides, customReviews, viewAllReviewsUrl } = homeData;
  const pests = globalData.pests || [];
  const regions = globalData.regions || [];
  const settings = globalData.settings || DEFAULT_SETTINGS;

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
  const whyUsAutoplayDelay =
    (settings.whyUsAutoplayDelay || WHY_US_SLIDER_AUTOPLAY_DELAY_FALLBACK) *
    1000;

  return (
    // <main> lives in (main)/layout.tsx — this div avoids double-nested <main>
    <div className="flex-1 flex flex-col w-full">
      <AlternatingSections>
        <Hero
          slides={slides}
          telUrl={telUrl}
          whatsappUrl={whatsappUrl}
          autoplayDelay={heroAutoplayDelay}
          instagramUrl={settings.instagramUrl}
          facebookUrl={settings.facebookUrl}
          googleStatsPromise={googleStatsPromise}
        />
        <ServicesSection
          pests={pests}
          slides={settings.servicesSlides}
          legacyImage={settings.servicesImage}
          autoplayDelay={servicesAutoplayDelay}
        />
        <WhyUsSection
          slides={settings.whyUsSlides}
          legacyImage={settings.whyUsImage}
          autoplayDelay={whyUsAutoplayDelay}
          variant={"embedded"}
        />
        <GoogleReviewsSection
          autoplayDelay={reviewsAutoplayDelay}
          reviews={customReviews}
          viewAllUrl={viewAllReviewsUrl}
          unavailable={reviewsUnavailable}
        />
        <ContactSection pests={pests} regions={regions} />
      </AlternatingSections>
      {/* Mobile Sticky Bottom Bar (Placed here to escape local z-index stacking contexts) */}
      <StickyMobileActions telUrl={telUrl} whatsappUrl={whatsappUrl} />
    </div>
  );
};

const HomePageContent = async () => {
  const [homeDataResponse, globalData] = await Promise.all([
    getHomeData(),
    getGlobalData(),
  ]);
  const localHomeData = getLocalHomeDataFallback();
  const homePageData =
    homeDataResponse.success && homeDataResponse.data
      ? homeDataResponse.data
      : { ...localHomeData, reviewsUnavailable: true };
  const settings = globalData.settings || DEFAULT_SETTINGS;
  const googleStatsPromise = getPublicGoogleStats(settings.googlePlaceId);

  return (
    <HomePageView
      homeData={homePageData}
      globalData={globalData}
      reviewsUnavailable={homePageData.reviewsUnavailable}
      googleStatsPromise={googleStatsPromise}
    />
  );
};

const HomePageFallback = () => (
  <HomePageView
    homeData={getLocalHomeDataFallback()}
    globalData={getLocalGlobalDataFallback()}
    reviewsUnavailable
  />
);

const HomePage = () => (
  <Suspense fallback={<HomePageFallback />}>
    <HomePageContent />
  </Suspense>
);

export default HomePage;
