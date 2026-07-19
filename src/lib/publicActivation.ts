import "server-only";

import type { Firestore } from "firebase-admin/firestore";
import { updateTag } from "next/cache";
import { getCombinationCacheTag } from "@/features/combinations/constants";
import type { PublicMutationResult } from "@/types";
import {
  acknowledgeFirestorePublishedActivation,
  publishCanonicalSnapshotToFirestore,
  type PublishedSnapshotCommitResult,
  type PublishedVisibilityPatchResult,
} from "@/lib/firestorePublishedSnapshot";
import {
  acknowledgePublicSnapshotActivation,
  createEmptyPublicSnapshotChanges,
  hasPublicSnapshotChanges,
  updatePublicSnapshot,
  type PublicDataSnapshot,
  type PublicSnapshotChanges,
  type PublicSnapshotUpdateResult,
} from "@/lib/publicSnapshot";

export type PublicActivationResult = PublicMutationResult & {
  firestoreSnapshot: PublishedSnapshotCommitResult;
  snapshot: PublicSnapshotUpdateResult;
  cacheTags: string[];
  cacheInvalidated: boolean;
  cacheInvalidationFailed: boolean;
};

type CommittedActivationDependencies = {
  updateSnapshot: (
    snapshot: PublicDataSnapshot,
    requestedChanges: PublicSnapshotChanges,
  ) => Promise<PublicSnapshotUpdateResult>;
  updateCacheTag: (tag: string) => void;
  acknowledgeRedisSnapshot: (
    receipt: NonNullable<PublicSnapshotUpdateResult["activationReceipt"]>,
  ) => Promise<boolean>;
  acknowledgeFirestoreSnapshot: (revision: number) => Promise<boolean>;
};

/** Resolves exact Next.js cache ownership from published snapshot changes. */
export const getPublicCacheTags = (
  changes: PublicSnapshotChanges,
): string[] => {
  const tags = new Set<string>();
  if (changes.globalDataChanged) tags.add("global-data");
  if (changes.settingsChanged) tags.add("layout-settings");
  if (changes.homeDataChanged) tags.add("home-data");

  if (changes.fullActivation) {
    tags.add("all-combinations");
  } else if (changes.combinationsChanged) {
    tags.add("all-combinations");
  }

  if (changes.fullActivation || changes.combinationsChanged) {
    [
      ...changes.addedCombinationIds,
      ...changes.changedCombinationIds,
      ...changes.removedCombinationIds,
    ].forEach((id) => {
      const separatorIndex = id.indexOf("_");
      if (separatorIndex <= 0 || separatorIndex >= id.length - 1) return;
      tags.add(
        getCombinationCacheTag(
          id.slice(0, separatorIndex),
          id.slice(separatorIndex + 1),
        ),
      );
    });
  }

  return [...tags];
};

/** Creates a provider-neutral failed Redis activation result. */
const createFailedSnapshotResult = (
  failureReason: NonNullable<PublicSnapshotUpdateResult["failureReason"]>,
): PublicSnapshotUpdateResult => ({
  status: "failed",
  changes: createEmptyPublicSnapshotChanges(),
  failureReason,
});

/** Activates one already-committed Firestore published revision. */
export const activateCommittedPublicDataWithDependencies = async (
  firestoreSnapshot: PublishedSnapshotCommitResult,
  dependencies: CommittedActivationDependencies,
): Promise<PublicActivationResult> => {
  if (!firestoreSnapshot.snapshot) {
    return {
      activationStatus: "deferred",
      publicationRequired: false,
      firestoreSnapshot,
      snapshot: createFailedSnapshotResult("write"),
      cacheTags: [],
      cacheInvalidated: false,
      cacheInvalidationFailed: false,
    };
  }

  const snapshot = await dependencies.updateSnapshot(
    firestoreSnapshot.snapshot,
    firestoreSnapshot.changes,
  );
  if (snapshot.status === "failed") {
    return {
      activationStatus: "deferred",
      publicationRequired: false,
      firestoreSnapshot,
      snapshot,
      cacheTags: [],
      cacheInvalidated: false,
      cacheInvalidationFailed: false,
    };
  }

  const cacheTags = getPublicCacheTags(snapshot.changes);
  if (!hasPublicSnapshotChanges(snapshot.changes) || cacheTags.length === 0) {
    return {
      activationStatus: "not-needed",
      publicationRequired: false,
      firestoreSnapshot,
      snapshot,
      cacheTags,
      cacheInvalidated: false,
      cacheInvalidationFailed: false,
    };
  }

  try {
    cacheTags.forEach((tag) => dependencies.updateCacheTag(tag));
  } catch {
    console.error("Failed to update public cache tags");
    return {
      activationStatus: "deferred",
      publicationRequired: false,
      firestoreSnapshot,
      snapshot,
      cacheTags,
      cacheInvalidated: false,
      cacheInvalidationFailed: true,
    };
  }

  if (snapshot.activationReceipt) {
    await Promise.all([
      dependencies.acknowledgeRedisSnapshot(snapshot.activationReceipt),
      dependencies.acknowledgeFirestoreSnapshot(
        firestoreSnapshot.snapshot.revision,
      ),
    ]);
  }

  return {
    activationStatus: "activated",
    publicationRequired: false,
    firestoreSnapshot,
    snapshot,
    cacheTags,
    cacheInvalidated: true,
    cacheInvalidationFailed: false,
  };
};

/** Synchronizes Redis and granular cache tags from a committed Firestore state. */
export const activateCommittedPublicData = async (
  db: Firestore,
  firestoreSnapshot: PublishedSnapshotCommitResult,
): Promise<PublicActivationResult> =>
  activateCommittedPublicDataWithDependencies(firestoreSnapshot, {
    updateSnapshot: updatePublicSnapshot,
    updateCacheTag: (tag) => updateTag(tag),
    acknowledgeRedisSnapshot: acknowledgePublicSnapshotActivation,
    acknowledgeFirestoreSnapshot: async (revision) =>
      acknowledgeFirestorePublishedActivation(db, revision),
  });

/** Activates one transactionally committed visibility-only snapshot patch. */
export const activatePublishedVisibilityPatch = async (
  db: Firestore,
  patch: PublishedVisibilityPatchResult,
): Promise<PublicMutationResult> => {
  if (!patch.snapshot) {
    return {
      activationStatus: patch.publicationRequired ? "deferred" : "not-needed",
      publicationRequired: patch.publicationRequired,
    };
  }
  if (!hasPublicSnapshotChanges(patch.changes)) {
    return {
      activationStatus: patch.publicationRequired ? "deferred" : "not-needed",
      publicationRequired: patch.publicationRequired,
    };
  }

  const activation = await activateCommittedPublicData(db, {
    status: "updated",
    snapshot: patch.snapshot,
    changes: patch.changes,
    sizeBytes: patch.sizeBytes,
  });
  return {
    activationStatus: activation.activationStatus,
    publicationRequired: patch.publicationRequired,
  };
};

/** Publishes canonical editable data to Firestore before external activation. */
export const activatePublicData = async (
  db: Firestore,
  requestedChanges: PublicSnapshotChanges =
    createEmptyPublicSnapshotChanges(),
): Promise<PublicActivationResult> => {
  const firestoreSnapshot = await publishCanonicalSnapshotToFirestore(
    db,
    requestedChanges,
  );
  if (
    firestoreSnapshot.status === "failed" ||
    firestoreSnapshot.status === "stale"
  ) {
    return {
      activationStatus: "deferred",
      publicationRequired: false,
      firestoreSnapshot,
      snapshot: createFailedSnapshotResult(
        firestoreSnapshot.failureReason === "canonical-build"
          ? "canonical-build"
          : firestoreSnapshot.failureReason === "too-large"
            ? "too-large"
            : "write",
      ),
      cacheTags: [],
      cacheInvalidated: false,
      cacheInvalidationFailed: false,
    };
  }
  return activateCommittedPublicData(db, firestoreSnapshot);
};
