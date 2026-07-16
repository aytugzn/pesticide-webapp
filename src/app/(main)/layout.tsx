import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GoogleStatsProvider } from "@/features/home/components/GoogleStatsProvider";
import { getPublicGoogleStats } from "@/features/home/googlePlaces";
import { getPublicSettings } from "@/features/settings/data";

const MainLayout = async ({ children }: { children: ReactNode }) => {
  const settings = await getPublicSettings();
  const googleStatsPromise = getPublicGoogleStats(settings.googlePlaceId);

  return (
    <GoogleStatsProvider statsPromise={googleStatsPromise}>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </div>
    </GoogleStatsProvider>
  );
};

export default MainLayout;
