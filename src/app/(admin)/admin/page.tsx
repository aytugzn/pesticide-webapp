import type { Metadata } from "next";
import { ROUTES } from "@/constants/routes";
import { ArrowRight } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";

export const metadata: Metadata = {
  title: "Dashboard | DMR İlaçlama Yönetim Paneli",
  robots: { index: false, follow: false },
};

const NAV_ITEMS = [
  { label: DICTIONARY.admin.dashboard.menu.regions,       href: ROUTES.adminRegions },
  { label: DICTIONARY.admin.dashboard.menu.pests,      href: ROUTES.adminPests },
  { label: DICTIONARY.admin.dashboard.menu.combinations, href: ROUTES.adminCombinations },
  { label: DICTIONARY.admin.dashboard.menu.reports,       href: ROUTES.adminReports },
  { label: DICTIONARY.admin.dashboard.menu.messages,       href: ROUTES.adminMessages },
  { label: DICTIONARY.admin.dashboard.menu.reviews,       href: ROUTES.adminReviews },
  { label: DICTIONARY.admin.dashboard.menu.settings,        href: ROUTES.adminSettings },
] as const;

const AdminPage = () => (
  <main className="min-h-screen bg-background p-8">
    <header className="mb-10 border-b border-brand-border pb-6">
      <p className="text-text-muted text-xs font-medium tracking-widest uppercase mb-1">
        {DICTIONARY.admin.dashboard.subtitle}
      </p>
      <h1 className="font-heading font-bold text-text-primary text-3xl">
        {DICTIONARY.admin.dashboard.title}
      </h1>
    </header>

    <nav aria-label={DICTIONARY.admin.dashboard.navAria}>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" role="list">
        {NAV_ITEMS.map(({ label, href }) => (
          <li key={href}>
            <a
              href={href}
              className="flex items-center justify-between px-5 py-4 bg-brand-surface border border-brand-border rounded-brand-lg text-text-primary text-sm font-medium hover:border-brand-border-strong hover:bg-brand-surface-light transition-colors duration-150"
            >
              <span>{label}</span>
              <ArrowRight size={20} className="sm:w-6 sm:h-6" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  </main>
);

export default AdminPage;
