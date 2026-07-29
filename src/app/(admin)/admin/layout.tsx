import { Metadata } from "next";
import { AdminLayoutClient } from "@/components/layout/AdminLayoutClient";
import { DICTIONARY } from "@/constants/dictionary";
import { AdminProviders } from "./AdminProviders";
import { MUTATION_POLICY_MESSAGE } from "@/constants/mutationPolicy";
import { evaluateMutationPolicy } from "@/lib/mutationPolicy";

export const metadata: Metadata = {
  title: `${DICTIONARY.admin.dashboard.title} | ${DICTIONARY.admin.dashboard.subtitle}`,
  robots: {
    index: false,
    follow: false,
  },
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const mutationPolicy = evaluateMutationPolicy();

  return (
    <AdminProviders>
      <AdminLayoutClient>
        {!mutationPolicy.allowed ? (
          <div
            role="status"
            className="mb-4 rounded-brand-md border border-warning-border bg-warning-bg px-4 py-3 text-sm text-warning-text"
          >
            {MUTATION_POLICY_MESSAGE} Ortam: {mutationPolicy.runtime}.
          </div>
        ) : null}
        {children}
      </AdminLayoutClient>
    </AdminProviders>
  );
};

export default AdminLayout;
