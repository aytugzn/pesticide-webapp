import type { Metadata } from "next";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Dashboard | DMR İlaçlama Yönetim Paneli",
  robots: { index: false, follow: false },
};

const NAV_ITEMS = [
  { label: "Bölgeler",       href: ROUTES.adminRegions },
  { label: "Haşereler",      href: ROUTES.adminPests },
  { label: "Kombinasyonlar", href: ROUTES.adminCombinations },
  { label: "Raporlar",       href: ROUTES.adminReports },
  { label: "Mesajlar",       href: ROUTES.adminMessages },
  { label: "Referanslar",    href: ROUTES.adminReferences },
  { label: "Ayarlar",        href: ROUTES.adminSettings },
] as const;

const AdminPage = () => (
  <main className="min-h-screen bg-background p-8">
    <header className="mb-10 border-b border-brand-border pb-6">
      <p className="text-text-muted text-xs font-medium tracking-widest uppercase mb-1">
        Yönetim Paneli
      </p>
      <h1 className="font-heading font-bold text-text-primary text-3xl">
        DMR İlaçlama
      </h1>
    </header>

    <nav aria-label="Admin navigasyon">
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" role="list">
        {NAV_ITEMS.map(({ label, href }) => (
          <li key={href}>
            <a
              href={href}
              className="flex items-center justify-between px-5 py-4 bg-brand-surface border border-brand-border rounded-brand-lg text-text-primary text-sm font-medium hover:border-brand-border-strong hover:bg-brand-surface-light transition-colors duration-150"
            >
              <span>{label}</span>
              <span className="text-text-muted" aria-hidden="true">→</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  </main>
);

export default AdminPage;
