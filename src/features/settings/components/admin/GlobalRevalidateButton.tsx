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
      if (res.success && res.data) {
        const data = res.data;
        const didPublish = Boolean(
          data.published ||
            data.generalSettingsPublished ||
            data.reviewsPublished,
        );
        const shouldRefreshAdminData =
          didPublish ||
          data.newerDraftPreserved ||
          data.staleDraftSkipped;
        const messages = [
          ...(data.snapshotStatus === "failed" ||
          data.snapshotStatus === "stale"
            ? [
                {
                  variant: "warning" as const,
                  message: didPublish || data.activationPending
                    ? DICTIONARY.admin.settings.snapshotWarning
                    : DICTIONARY.admin.settings.snapshotInitializationWarning,
                },
              ]
            : data.activationDeferred
              ? [
                  {
                    variant: "warning" as const,
                    message: DICTIONARY.admin.settings.snapshotWarning,
                  },
                ]
            : data.cacheInvalidationFailed
              ? [
                  {
                    variant: "warning" as const,
                    message:
                      DICTIONARY.admin.settings.cacheInvalidationWarning,
                  },
                ]
              : data.staleDraftSkipped &&
                  !didPublish &&
                  !data.cacheInvalidated
                ? []
              : data.trueNoOp
                ? [
                    {
                      variant: "success" as const,
                      message:
                        DICTIONARY.admin.settings.revalidateNoChanges,
                    },
                  ]
                : didPublish
                ? [
                    {
                      variant: "success" as const,
                      message: DICTIONARY.admin.settings.revalidateSuccess,
                    },
                  ]
                : data.snapshotStatus === "initialized"
                  ? [
                      {
                        variant: "success" as const,
                        message:
                          DICTIONARY.admin.settings.snapshotInitialized,
                      },
                    ]
                  : [
                      {
                        variant: "success" as const,
                        message: DICTIONARY.admin.settings.revalidateSuccess,
                      },
                    ]),
          ...(data.domainPartialFailure
            ? [
                {
                  variant: "warning" as const,
                  message: DICTIONARY.admin.settings.revalidatePartial,
                },
              ]
            : []),
          ...(data.cleanupStatus === "partial-failure"
            ? [
                {
                  variant: "warning" as const,
                  message:
                    DICTIONARY.admin.settings.siteImages.cleanupWarning,
                },
              ]
            : []),
          ...(data.draftFinalizationFailed
            ? [
                {
                  variant: "warning" as const,
                  message:
                    DICTIONARY.admin.settings.draftFinalizationWarning,
                },
              ]
            : []),
          ...(data.newerDraftPreserved
            ? [
                {
                  variant: "warning" as const,
                  message:
                    DICTIONARY.admin.settings.newerDraftPreservedWarning,
                },
              ]
            : []),
          ...(data.staleDraftSkipped
            ? [
                {
                  variant: "warning" as const,
                  message:
                    DICTIONARY.admin.settings.staleDraftSkippedWarning,
                },
              ]
            : []),
        ];
        if (messages.length > 1) {
          showToastSequence(messages);
        } else {
          showToast(messages[0]);
        }
        if (shouldRefreshAdminData || data.draftsFinalized) {
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
