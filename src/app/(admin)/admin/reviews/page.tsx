import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Star } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES } from "@/constants/routes";
import { AdminListPage } from "@/components/layout/AdminListPage";
import { ReviewsManager } from "@/features/reviews/components/admin/ReviewsManager";
import { getAdminReviewsData } from "@/features/reviews/data";

export const metadata: Metadata = {
  title: `${DICTIONARY.admin.reviews.title} | ${DICTIONARY.global.brand}`,
  robots: { index: false, follow: false },
};

const AdminReviewsPage = async () => {
  await connection();
  const data = await getAdminReviewsData();
  if (!data) redirect(ROUTES.login);

  return (
    <AdminListPage
      eyebrow={DICTIONARY.admin.dashboard.subtitle}
      title={DICTIONARY.admin.reviews.title}
      description={DICTIONARY.admin.reviews.description}
      icon={Star}
    >
      <ReviewsManager initialData={data} />
    </AdminListPage>
  );
};

export default AdminReviewsPage;
