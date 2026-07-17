import type { Metadata } from "next";
import { connection } from "next/server";
import { MessageSquare } from "lucide-react";
import { DICTIONARY } from "@/constants/dictionary";
import { getAdminDb } from "@/lib/firebase-admin";
import { AdminListPage } from "@/components/layout/AdminListPage";
import { MessagesManager } from "@/features/messages/components/admin/MessagesManager";
import { parseAdminMessageRow } from "@/features/messages/utils";

export const metadata: Metadata = {
  title: `${DICTIONARY.admin.messages.title} | ${DICTIONARY.global.brand}`,
  robots: { index: false, follow: false },
};

const AdminMessagesPage = async () => {
  await connection();
  const snap = await getAdminDb()
    .collection("messages")
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();
  const rows = snap.docs.map((doc) =>
    parseAdminMessageRow(doc.id, doc.data()),
  );

  return (
    <AdminListPage
      eyebrow={DICTIONARY.admin.dashboard.subtitle}
      title={DICTIONARY.admin.messages.title}
      description={DICTIONARY.admin.messages.description}
      icon={MessageSquare}
    >
      <MessagesManager initialRows={rows} />
    </AdminListPage>
  );
};

export default AdminMessagesPage;
