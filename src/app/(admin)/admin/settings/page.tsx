import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Settings } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { AdminListPage } from "@/components/layout/AdminListPage";
import { GeneralSettingsForm } from "@/features/settings/components/admin/GeneralSettingsForm";
import { getAdminGeneralSettingsData } from "@/features/settings/data";

export const metadata: Metadata = {
  title: `${DICTIONARY.admin.settings.title} | ${DICTIONARY.global.brand}`,
  robots: { index: false, follow: false },
};

const AdminSettingsPage = async () => {
  await connection();
  const settings = await getAdminGeneralSettingsData();
  if (!settings) {
    redirect(ROUTES.login);
  }

  return (
    <AdminListPage
      eyebrow={DICTIONARY.admin.dashboard.subtitle}
      title={DICTIONARY.admin.settings.title}
      description={DICTIONARY.admin.settings.description}
      icon={Settings}
    >
      <GeneralSettingsForm
        key={JSON.stringify(settings)}
        initialValues={settings.values}
      />
    </AdminListPage>
  );
};

export default AdminSettingsPage;
