"use client";

import { CombinationJobProvider } from "@/features/combinations/components/admin/CombinationJobProvider";

export const AdminProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <CombinationJobProvider>
      {children}
    </CombinationJobProvider>
  );
};
