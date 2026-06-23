import { ReactNode } from "react";
import { Navbar } from "@/components/layouts/Navbar";

const MainLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      {/* Footer buraya gelecek */}
    </div>
  );
};

export default MainLayout;
