import { Suspense, type ReactNode } from "react";
import {
  Navbar,
  NavbarFallback,
} from "@/components/layout/Navbar";
import {
  Footer,
  FooterFallback,
} from "@/components/layout/Footer";

/** Renders public chrome with provider reads isolated to their own boundaries. */
const MainLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Suspense fallback={<NavbarFallback />}>
      <Navbar />
    </Suspense>
    <main className="flex-1 flex flex-col">
      <Suspense fallback={null}>{children}</Suspense>
    </main>
    <Suspense fallback={<FooterFallback />}>
      <Footer />
    </Suspense>
  </div>
);

export default MainLayout;
