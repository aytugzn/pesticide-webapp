import type { Metadata } from "next";
import { DICTIONARY } from "@/constants/dictionary";
import { adminDb } from "@/lib/firebase-admin";
import { Hero } from "@/features/home/components/Hero";
import { GoogleReviewsSection } from "@/features/home/components/GoogleReviewsSection";
import type { SettingsDoc } from "@/types";
import type { HeroSlideDoc, GoogleStatsDoc } from "@/features/home/types";

export const metadata: Metadata = {
  title: DICTIONARY.meta.title,
  description: DICTIONARY.meta.description,
};

export const revalidate = 3600;

const HomePage = async () => {
  let slides: HeroSlideDoc[] = [];
  let settings: SettingsDoc = {};

  // Mock Data for Google Reviews (Will be replaced with real fetch from Google Places API on-demand later)
  const mockStats: GoogleStatsDoc = {
    rating: "5.0",
    reviewCount: "244"
  };

  try {
    const [sliderSnap, settingsSnap] = await Promise.all([
      adminDb.collection("settings").doc("heroSlider").get(),
      adminDb.collection("settings").doc("general").get()
    ]);

    if (sliderSnap.exists) {
      const data = sliderSnap.data();
      if (data && data.slides) {
        slides = data.slides as HeroSlideDoc[];
      }
    }


    if (settingsSnap.exists) {
      settings = settingsSnap.data() as SettingsDoc;
    }
  } catch (error) {
    console.error("Home page data fetch error:", error);
  }

  // Placeholder images
  if (slides.length === 0) {
    slides = [
      { imageUrl: "https://www.dmrilaclama.com/wp-content/uploads/2024/02/umraniye-hasere-bocek-fin-ilaclama-943-1536x1023.jpeg", order: 1 },
      { imageUrl: "https://www.dmrilaclama.com/wp-content/uploads/2024/02/X-Bocek-Ilaclama-Dezenfeksiyon-Hizmetleri.jpeg", order: 2 }
    ];
  }

  const rawPhone = settings.phone || "905000000000";
  const formattedPhone = rawPhone.replace(/\s+/g, "");
  const whatsappUrl = `https://wa.me/${formattedPhone.startsWith("+") ? formattedPhone.slice(1) : formattedPhone}`;
  const telUrl = `tel:${formattedPhone.startsWith("+") ? formattedPhone : `+${formattedPhone}`}`;
  const autoplayDelay = settings.heroAutoplayDelay || 5000;

  return (
    <main className="flex-1 flex flex-col w-full">
      <Hero 
        slides={slides} 
        telUrl={telUrl}
        whatsappUrl={whatsappUrl}
        autoplayDelay={autoplayDelay}
        stats={mockStats}
      />
      <GoogleReviewsSection />
    </main>
  );
};

export default HomePage;
