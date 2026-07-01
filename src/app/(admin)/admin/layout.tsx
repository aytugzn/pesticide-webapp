import { Metadata } from "next";
import { AdminLayoutClient } from "@/components/layouts/AdminLayoutClient";
import { DICTIONARY } from "@/constants/dictionary";

export const metadata: Metadata = {
  title: `${DICTIONARY.admin.dashboard.title} | ${DICTIONARY.admin.dashboard.subtitle}`,
  robots: {
    index: false,
    follow: false,
  },
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
};

export default AdminLayout;
