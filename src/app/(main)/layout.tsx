import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

/** Renders public chrome with static provider reads. */
const MainLayout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1 flex flex-col">
      {children}
    </main>
    <Footer />
  </div>
);

export default MainLayout;
