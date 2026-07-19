"use server";

import "server-only";

import type { ActionResponse } from "@/types";
import { requireAdmin } from "@/features/auth/requireAdmin";
import { getAdminDb } from "@/lib/firebase-admin";
import type { DraftFinalizationStatus } from "@/lib/firestoreDraftFinalization";
import { activatePublicData } from "@/lib/publicActivation";
import {
  createEmptyPublicSnapshotChanges,
  mergePublicSnapshotChanges,
  type PublicSnapshotChanges,
} from "@/lib/publicSnapshot";
import {
  commitSiteImagesPublish,
  finalizeSiteImagesPublish,
  prepareSiteImagesDraftPublish,
} from "./publishSiteImages";
import {
  commitGeneralSettingsPublish,
  finalizeGeneralSettingsPublish,
  prepareGeneralSettingsDraftPublish,
} from "./publishGeneralSettings";
import {
  commitReviewsPublish,
  finalizeReviewsPublish,
  prepareReviewsDraftPublish,
} from "@/features/reviews/publishReviews";
import {
  SETTINGS_ERRORS,
  type GlobalPublishResult,
  type SettingsErrorCode,
} from "./types";
import {
  requiresCanonicalSnapshotComparison,
} from "./publishActivation";

/** Returns whether a version-checked draft commit may proceed to activation. */
const isAcceptedDraftCommit = (status: string | undefined): boolean =>
  status === "published" || status === "unchanged-current";

/** Returns whether a prepared draft was superseded or removed before commit. */
const isSkippedDraftCommit = (status: string | undefined): boolean =>
  status === "stale-draft-skipped" || status === "draft-missing";

/** Builds retryable cache ownership for accepted settings-domain drafts. */
const getRequestedDraftChanges = (input: {
  siteActivationPending: boolean;
  siteImagesPublished: boolean;
  heroImagesPublished: boolean;
  settingsSlidesPublished: boolean;
  generalActivationPending: boolean;
  reviewsActivationPending: boolean;
}): PublicSnapshotChanges => {
  const summaries: PublicSnapshotChanges[] = [];
  if (input.siteActivationPending) {
    summaries.push({
      ...createEmptyPublicSnapshotChanges(),
      heroSlidesChanged:
        input.heroImagesPublished || !input.siteImagesPublished,
      settingsChanged:
        input.settingsSlidesPublished || !input.siteImagesPublished,
    });
  }
  if (input.generalActivationPending) {
    summaries.push({
      ...createEmptyPublicSnapshotChanges(),
      settingsChanged: true,
    });
  }
  if (input.reviewsActivationPending) {
    summaries.push({
      ...createEmptyPublicSnapshotChanges(),
      reviewsChanged: true,
    });
  }
  return mergePublicSnapshotChanges(...summaries);
};

/**
 * Runs authorization, domain preparation, Firestore commits, canonical
 * snapshot replacement, and domain-owned cache invalidation in that order.
 *
 * @returns Detailed domain publish and warning state
 */
export const revalidateAll = async (): Promise<
  ActionResponse<GlobalPublishResult, SettingsErrorCode>
> => {
  if (!(await requireAdmin())) {
    return { success: false, error: SETTINGS_ERRORS.UNAUTHORIZED };
  }

  const db = getAdminDb();
  const [sitePreparation, generalPreparation, reviewsPreparation] =
    await Promise.all([
      prepareSiteImagesDraftPublish(db),
      prepareGeneralSettingsDraftPublish(db),
      prepareReviewsDraftPublish(db),
    ]);

  const [sitePublish, generalPublish, reviewsPublish] = await Promise.all([
    sitePreparation.success && sitePreparation.data
      ? commitSiteImagesPublish(db, sitePreparation.data)
      : Promise.resolve({
          success: false as const,
          error: sitePreparation.success
            ? SETTINGS_ERRORS.FETCH_FAILED
            : sitePreparation.error,
        }),
    generalPreparation.success && generalPreparation.data
      ? commitGeneralSettingsPublish(db, generalPreparation.data)
      : Promise.resolve({
          success: false as const,
          error: generalPreparation.success
            ? SETTINGS_ERRORS.FETCH_FAILED
            : generalPreparation.error,
        }),
    reviewsPreparation.success && reviewsPreparation.data
      ? commitReviewsPublish(db, reviewsPreparation.data)
      : Promise.resolve({
          success: false as const,
          error: reviewsPreparation.success
            ? SETTINGS_ERRORS.FETCH_FAILED
            : reviewsPreparation.error,
        }),
  ]);
  const siteImagesPublished =
    sitePublish.success && Boolean(sitePublish.data?.published);
  const siteCommitStatus = sitePublish.success
    ? sitePublish.data?.status
    : undefined;
  const heroImagesPublished = Boolean(
    siteImagesPublished &&
      sitePreparation.success &&
      sitePreparation.data?.heroChanged,
  );
  const settingsSlidesPublished = Boolean(
    siteImagesPublished &&
      sitePreparation.success &&
      sitePreparation.data?.settingsSlidesChanged,
  );
  const generalSettingsPublished =
    generalPublish.success && Boolean(generalPublish.data?.published);
  const generalCommitStatus = generalPublish.success
    ? generalPublish.data?.status
    : undefined;
  const reviewsPublished =
    reviewsPublish.success && Boolean(reviewsPublish.data?.published);
  const reviewsCommitStatus = reviewsPublish.success
    ? reviewsPublish.data?.status
    : undefined;
  const globalDomainPublished =
    siteImagesPublished || generalSettingsPublished;
  const anyPublished = globalDomainPublished || reviewsPublished;
  const anyDomainFailure =
    !sitePublish.success || !generalPublish.success || !reviewsPublish.success;
  const siteActivationPending = Boolean(
    sitePublish.success &&
      sitePreparation.success &&
      sitePreparation.data?.hasDraft &&
      isAcceptedDraftCommit(siteCommitStatus),
  );
  const generalActivationPending = Boolean(
    generalPublish.success &&
      generalPreparation.success &&
      generalPreparation.data?.hasDraft &&
      isAcceptedDraftCommit(generalCommitStatus),
  );
  const reviewsActivationPending = Boolean(
    reviewsPublish.success &&
      reviewsPreparation.success &&
      reviewsPreparation.data?.hasDraft &&
      isAcceptedDraftCommit(reviewsCommitStatus),
  );
  const anyActivationPending =
    siteActivationPending ||
    generalActivationPending ||
    reviewsActivationPending;

  const requiresCanonicalComparison =
    requiresCanonicalSnapshotComparison();
  const requestedDraftChanges = getRequestedDraftChanges({
    siteActivationPending,
    siteImagesPublished,
    heroImagesPublished,
    settingsSlidesPublished,
    generalActivationPending,
    reviewsActivationPending,
  });
  const activation = await activatePublicData(
    db,
    requiresCanonicalComparison
      ? requestedDraftChanges
      : createEmptyPublicSnapshotChanges(),
  );
  if (
    anyDomainFailure &&
    !anyPublished &&
    !anyActivationPending &&
    !activation.cacheInvalidated
  ) {
    return { success: false, error: SETTINGS_ERRORS.FETCH_FAILED };
  }
  const cacheInvalidated = activation.cacheInvalidated;
  const cacheInvalidationFailed = activation.cacheInvalidationFailed;

  let draftsFinalized = false;
  let draftFinalizationFailed = false;
  let newerDraftPreserved = false;
  if (cacheInvalidated) {
    const finalizationResults: Array<DraftFinalizationStatus | null> =
      await Promise.all([
        siteActivationPending
          ? finalizeSiteImagesPublish(
              db,
              sitePreparation.success
                ? (sitePreparation.data?.draftVersion ?? null)
                : null,
            )
          : Promise.resolve(null),
        generalActivationPending
          ? finalizeGeneralSettingsPublish(
              db,
              generalPreparation.success
                ? (generalPreparation.data?.draftVersion ?? null)
                : null,
            )
          : Promise.resolve(null),
        reviewsActivationPending
          ? finalizeReviewsPublish(
              db,
              reviewsPreparation.success
                ? (reviewsPreparation.data?.draftVersion ?? null)
                : null,
            )
          : Promise.resolve(null),
      ]);
    const attemptedFinalizations = finalizationResults.filter(
      (result): result is DraftFinalizationStatus => result !== null,
    );
    draftFinalizationFailed = attemptedFinalizations.includes("failed");
    newerDraftPreserved = attemptedFinalizations.includes(
      "newer-draft-preserved",
    );
    draftsFinalized =
      attemptedFinalizations.length > 0 &&
      attemptedFinalizations.every(
        (result) => result === "deleted" || result === "already-missing",
      );
  }

  const cleanupStatus: GlobalPublishResult["cleanupStatus"] = "not-needed";
  const staleDraftSkipped =
    isSkippedDraftCommit(siteCommitStatus) ||
    isSkippedDraftCommit(generalCommitStatus) ||
    isSkippedDraftCommit(reviewsCommitStatus);
  const activationDeferred = activation.activationStatus === "deferred";
  const partialFailure =
    anyDomainFailure ||
    staleDraftSkipped ||
    activation.firestoreSnapshot.status === "failed" ||
    activation.firestoreSnapshot.status === "stale" ||
    activation.snapshot.status === "failed" ||
    cacheInvalidationFailed ||
    draftFinalizationFailed;
  const trueNoOp =
    !anyPublished &&
    !anyActivationPending &&
    !anyDomainFailure &&
    !staleDraftSkipped &&
    activation.activationStatus === "not-needed";

  return {
    success: true,
    data: {
      published: siteImagesPublished,
      cleanupStatus,
      generalSettingsPublished,
      reviewsPublished,
      snapshotStatus: activation.firestoreSnapshot.status,
      domainPartialFailure: anyDomainFailure,
      partialFailure,
      cacheInvalidationAttempted: activation.cacheTags.length > 0,
      cacheInvalidated,
      cacheInvalidationFailed,
      activationPending: anyActivationPending,
      activationDeferred,
      draftsFinalized,
      draftFinalizationFailed,
      newerDraftPreserved,
      staleDraftSkipped,
      trueNoOp,
    },
  };
};
