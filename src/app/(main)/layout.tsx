import { Suspense, type ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GoogleStatsProvider } from "@/features/home/components/GoogleStatsProvider";
import { getPublicGoogleStats } from "@/features/home/googlePlaces";
import { getPublicSettingsForMetadata } from "@/features/settings/data";
import { PublicRouteLoading } from "@/components/layout/PublicRouteLoading";

/** Renders public chrome with independent provider-safe boundaries. */
const PublicLayoutShell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1 flex flex-col">{children}</main>
    <Footer />
  </div>
);

/** Resolves optional Google stats without blocking the build-safe shell. */
const PublicLayoutContent = async ({ children }: { children: ReactNode }) => {
  const settings = await getPublicSettingsForMetadata();
  const googleStatsPromise = getPublicGoogleStats(settings.googlePlaceId);

  return (
    <GoogleStatsProvider statsPromise={googleStatsPromise}>
      <PublicLayoutShell>{children}</PublicLayoutShell>
    </GoogleStatsProvider>
  );
};

/** Keeps runtime public providers behind the Cache Components boundary. */
const MainLayout = ({ children }: { children: ReactNode }) => (
  <Suspense
    fallback={
      <div className="min-h-screen flex flex-col">
        <PublicRouteLoading />
      </div>
    }
  >
    <PublicLayoutContent>{children}</PublicLayoutContent>
  </Suspense>
);

export default MainLayout;
