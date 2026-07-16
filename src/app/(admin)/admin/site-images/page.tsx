import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Images } from "lucide-react";
import { AdminListPage } from "@/components/layout/AdminListPage";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { SiteImagesForm } from "@/features/settings/components/admin/SiteImagesForm";
import { getAdminSiteImagesData } from "@/features/settings/data";

export const metadata: Metadata = {
  title: `${DICTIONARY.admin.settings.siteImages.title} | ${DICTIONARY.global.brand}`,
  robots: { index: false, follow: false },
};

const AdminSiteImagesPage = async () => {
  await connection();
  const siteImages = await getAdminSiteImagesData();
  if (!siteImages) {
    redirect(ROUTES.login);
  }

  return (
    <AdminListPage
      eyebrow={DICTIONARY.admin.dashboard.subtitle}
      title={DICTIONARY.admin.settings.siteImages.title}
      description={DICTIONARY.admin.settings.siteImages.description}
      icon={Images}
    >
      <SiteImagesForm
        key={JSON.stringify(siteImages)}
        initialHeroSlides={siteImages.heroSlides}
        initialWhyUsSlides={siteImages.whyUsSlides}
        initialServicesSlides={siteImages.servicesSlides}
      />
    </AdminListPage>
  );
};

export default AdminSiteImagesPage;
