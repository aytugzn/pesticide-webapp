"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { RefreshCw } from "lucide-react";
import { revalidateAll } from "@/features/settings/revalidateAll";
import { cn } from "@/utils/cn";
import { DICTIONARY } from "@/constants/dictionary";
import { useCombinationAdminToast } from "@/features/combinations/components/admin/CombinationJobProvider";

export const GlobalRevalidateButton = () => {
  const [isRevalidating, setIsRevalidating] = useState(false);
  const { showToast, showToastSequence } = useCombinationAdminToast();

  const handleRevalidate = async () => {
    setIsRevalidating(true);
    try {
      const res = await revalidateAll();
      if (res.success) {
        if (res.data?.cleanupStatus === "success") {
          showToastSequence([
            {
              variant: "success",
              message: DICTIONARY.admin.settings.revalidateSuccess,
            },
            {
              variant: "success",
              message: DICTIONARY.admin.settings.siteImages.cleanupSuccess,
            },
          ]);
        } else if (res.data?.cleanupStatus === "partial-failure") {
          showToastSequence([
            {
              variant: "success",
              message: DICTIONARY.admin.settings.revalidateSuccess,
            },
            {
              variant: "warning",
              message: DICTIONARY.admin.settings.siteImages.cleanupWarning,
            },
          ]);
        } else {
          showToast({
            variant: "success",
            message: DICTIONARY.admin.settings.revalidateSuccess,
          });
        }
      } else {
        showToast({
          variant: "error",
          message: DICTIONARY.admin.settings.revalidateError,
        });
      }
    } catch {
      showToast({
        variant: "error",
        message: DICTIONARY.admin.settings.revalidateError,
      });
    } finally {
      setIsRevalidating(false);
    }
  };

  return (
    <Button
      variant="primary"
      size="md"
      onClick={handleRevalidate}
      disabled={isRevalidating}
      className="flex items-center gap-2"
    >
      <RefreshCw
        className={cn("w-4 h-4 mr-2", isRevalidating && "animate-spin")}
      />
      {isRevalidating
        ? DICTIONARY.admin.settings.revalidating
        : DICTIONARY.admin.settings.revalidateBtn}
    </Button>
  );
};
