import { Metadata } from "next";
import { AdminLayoutClient } from "@/components/layout/AdminLayoutClient";
import { DICTIONARY } from "@/constants/dictionary";
import { AdminProviders } from "./AdminProviders";

export const metadata: Metadata = {
  title: `${DICTIONARY.admin.dashboard.title} | ${DICTIONARY.admin.dashboard.subtitle}`,
  robots: {
    index: false,
    follow: false,
  },
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <AdminProviders>
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </AdminProviders>
  );
};

export default AdminLayout;
