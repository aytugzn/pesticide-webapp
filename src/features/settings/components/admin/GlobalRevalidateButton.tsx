"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { RefreshCw } from "lucide-react";
import { revalidateAll } from "@/features/settings/revalidateAll";
import { cn } from "@/utils/cn";
import { DICTIONARY } from "@/constants/dictionary";
import { useCombinationAdminToast } from "@/features/combinations/components/admin/CombinationJobProvider";

/**
 * Publishes pending global domains and reports cache or cleanup warnings.
 *
 * @returns The guarded global publish button and toast workflow
 */
export const GlobalRevalidateButton = () => {
  const router = useRouter();
  const [isRevalidating, setIsRevalidating] = useState(false);
  const { showToast, showToastSequence } = useCombinationAdminToast();

  const handleRevalidate = async () => {
    setIsRevalidating(true);
    try {
      const res = await revalidateAll();
      if (res.success) {
        const shouldRefreshAdminData = Boolean(
          res.data?.published || res.data?.generalSettingsPublished,
        );
        if (res.data?.cacheInvalidationFailed) {
          showToast({
            variant: "warning",
            message: DICTIONARY.admin.settings.cacheInvalidationWarning,
          });
        } else {
          const didPublish = Boolean(
            res.data?.published || res.data?.generalSettingsPublished,
          );
          const hasSpecificWarning = Boolean(
            res.data?.cleanupStatus === "partial-failure",
          );
          const messages = [
            ...(didPublish
              ? [
                  {
                    variant: "success" as const,
                    message: DICTIONARY.admin.settings.revalidateSuccess,
                  },
                ]
              : []),
            ...(res.data?.cleanupStatus === "success"
              ? [
                  {
                    variant: "success" as const,
                    message:
                      DICTIONARY.admin.settings.siteImages.cleanupSuccess,
                  },
                ]
              : res.data?.cleanupStatus === "partial-failure"
                ? [
                    {
                      variant: "warning" as const,
                      message:
                        DICTIONARY.admin.settings.siteImages.cleanupWarning,
                    },
                  ]
                : []),
            ...(didPublish && res.data?.partialFailure && !hasSpecificWarning
              ? [
                  {
                    variant: "warning" as const,
                    message: DICTIONARY.admin.settings.revalidatePartial,
                  },
                ]
              : []),
          ];
          if (messages.length > 1) {
            showToastSequence(messages);
          } else if (messages.length === 1) {
            showToast(messages[0]);
          } else {
            showToast({
              variant: "success",
              message: DICTIONARY.admin.settings.revalidateSuccess,
            });
          }
        }
        if (shouldRefreshAdminData) {
          router.refresh();
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
        aria-hidden="true"
      />
      {isRevalidating
        ? DICTIONARY.admin.settings.revalidating
        : DICTIONARY.admin.settings.revalidateBtn}
    </Button>
  );
};
