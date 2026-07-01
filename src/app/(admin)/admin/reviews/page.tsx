import type { Metadata } from "next";
import { connection } from "next/server";
import { Star } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { getAdminDb } from "@/lib/firebase-admin";
import { AdminListPage } from "@/components/layouts/AdminListPage";
import { AdminDataTable } from "@/components/ui/AdminDataTable";

export const metadata: Metadata = {
  title: `${DICTIONARY.admin.reviews.title} | ${DICTIONARY.global.brand}`,
  robots: { index: false, follow: false },
};

const AdminReviewsPage = async () => {
  await connection();
  const snap = await getAdminDb().collection("settings").doc("reviews").get();
  const data = snap.data();
  const items = Array.isArray(data?.items) ? data.items : [];
  const rows = items.map((item: Record<string, unknown>) => [
    String(item.authorName || item.name || "-"),
    String(item.rating || "5"),
    String(item.text || "-"),
  ]);

  return (
    <AdminListPage
      eyebrow={DICTIONARY.admin.dashboard.subtitle}
      title={DICTIONARY.admin.reviews.title}
      description={DICTIONARY.admin.reviews.description}
      icon={Star}
    >
      <AdminDataTable
        emptyText={DICTIONARY.admin.reviews.empty}
        columns={[DICTIONARY.admin.reviews.table.customer, DICTIONARY.admin.reviews.table.rating, DICTIONARY.admin.reviews.table.comment]}
        rows={rows}
      />
    </AdminListPage>
  );
};

export default AdminReviewsPage;
