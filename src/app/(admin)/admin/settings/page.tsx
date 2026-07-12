import type { Metadata } from "next";
import { connection } from "next/server";
import { Settings } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { getAdminDb } from "@/lib/firebase-admin";
import { parseHeroSlideDoc, parseSettingsDoc } from "@/utils/parsers";
import { AdminListPage } from "@/components/layout/AdminListPage";
import { AdminDataTable } from "@/components/ui/AdminDataTable";
import { SiteImagesForm } from "@/features/settings/components/admin/SiteImagesForm";

export const metadata: Metadata = {
  title: `${DICTIONARY.admin.settings.title} | ${DICTIONARY.global.brand}`,
  robots: { index: false, follow: false },
};

const AdminSettingsPage = async () => {
  await connection();
  const db = getAdminDb();
  const [generalSnap, heroSnap] = await Promise.all([
    db.collection("settings").doc("general").get(),
    db.collection("settings").doc("heroSlider").get(),
  ]);
  const settings = parseSettingsDoc(generalSnap.data());
  const heroData = heroSnap.data();
  const heroSlides = Array.isArray(heroData?.slides)
    ? heroData.slides
        .map((slide, index) => parseHeroSlideDoc(slide, index))
        .filter((slide) => slide !== null)
    : [];
  const rows = [
    [DICTIONARY.admin.settings.table.phone, settings.phone || "-"],
    [DICTIONARY.admin.settings.table.email, settings.email || "-"],
    [DICTIONARY.admin.settings.table.address, settings.address || "-"],
    [DICTIONARY.admin.settings.table.workingHours, settings.workingHours || "-"],
  ];

  return (
    <AdminListPage
      eyebrow={DICTIONARY.admin.dashboard.subtitle}
      title={DICTIONARY.admin.settings.title}
      description={DICTIONARY.admin.settings.description}
      icon={Settings}
    >
      <AdminDataTable
        emptyText={DICTIONARY.admin.settings.empty}
        columns={[DICTIONARY.admin.settings.table.field, DICTIONARY.admin.settings.table.value]}
        rows={rows}
      />
      <SiteImagesForm
        key={JSON.stringify({
          heroSlides,
          whyUsSlides: settings.whyUsSlides ?? (settings.whyUsImage ? [settings.whyUsImage] : []),
          servicesSlides: settings.servicesSlides ?? (settings.servicesImage ? [settings.servicesImage] : []),
        })}
        initialHeroSlides={heroSlides}
        initialWhyUsSlides={settings.whyUsSlides ?? (settings.whyUsImage ? [settings.whyUsImage] : [])}
        initialServicesSlides={settings.servicesSlides ?? (settings.servicesImage ? [settings.servicesImage] : [])}
      />
    </AdminListPage>
  );
};

export default AdminSettingsPage;
