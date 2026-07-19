import "server-only";

import {
  FieldValue,
  type Firestore,
  type Transaction,
} from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { AppError } from "@/lib/exceptions";
import {
  PUBLIC_SNAPSHOT_MAX_BYTES,
  createCanonicalPublishedSnapshotCandidate,
  createEmptyPublicSnapshotChanges,
  getPublicSnapshotChanges,
  hasPublicSnapshotChanges,
  mergePublicSnapshotChanges,
  parsePendingPublicSnapshotChanges,
  parsePublicDataSnapshot,
  serializeStoredPublicSnapshot,
  type PublicDataSnapshot,
  type PublicSnapshotChanges,
} from "@/lib/publicSnapshot";
import type { PublicSnapshotStatus } from "@/features/settings/types";

export const PUBLISHED_SNAPSHOT_DOCUMENT_PATH = "system/publicSnapshot";

export type PublishedSnapshotReadResult =
  | {
      status: "success";
      snapshot: PublicDataSnapshot;
      pendingChanges: PublicSnapshotChanges;
    }
  | { status: "missing" | "invalid" | "failed" };

export type PublishedSnapshotCommitResult = {
  status: PublicSnapshotStatus | "stale";
  snapshot?: PublicDataSnapshot;
  changes: PublicSnapshotChanges;
  failureReason?:
    | "read"
    | "canonical-build"
    | "invalid"
    | "too-large"
    | "write"
    | "stale";
  sizeBytes?: number;
};

export type PublishedVisibilityPatch = {
  pestStatuses?: Record<string, boolean>;
  regionStatuses?: Record<string, boolean>;
  combinationStatuses?: Record<
    string,
    { isActive?: boolean; isArchived?: boolean }
  >;
  deletedPestSlugs?: string[];
  deletedRegionSlugs?: string[];
  deletedCombinationIds?: string[];
};

export type PublishedVisibilityPatchResult = {
  snapshot?: PublicDataSnapshot;
  changes: PublicSnapshotChanges;
  sizeBytes?: number;
  publicationRequired: boolean;
};

type ParsedStoredSnapshot = {
  snapshot: PublicDataSnapshot;
  pendingChanges: PublicSnapshotChanges;
};

/** Returns the sole reserved Firestore document used for published state. */
export const getPublishedSnapshotDocument = (db: Firestore) =>
  db.doc(PUBLISHED_SNAPSHOT_DOCUMENT_PATH);

/** Parses a Firestore envelope without trusting provider data. */
const parseStoredSnapshot = (value: unknown): ParsedStoredSnapshot | null => {
  const snapshot = parsePublicDataSnapshot(value);
  return snapshot
    ? {
        snapshot,
        pendingChanges: parsePendingPublicSnapshotChanges(value),
      }
    : null;
};

/** Reads the authoritative published document for public fallback resolution. */
export const readPublishedSnapshotFromFirestore = async (
  db: Firestore = getAdminDb(),
): Promise<PublishedSnapshotReadResult> => {
  try {
    const document = await getPublishedSnapshotDocument(db).get();
    if (!document.exists) return { status: "missing" };
    const parsed = parseStoredSnapshot(document.data());
    return parsed ? { status: "success", ...parsed } : { status: "invalid" };
  } catch {
    return { status: "failed" };
  }
};

/** Returns a valid published snapshot or fails without consulting editable data. */
export const getPublishedSnapshotFromFirestoreOrThrow = async (): Promise<
  PublicDataSnapshot
> => {
  const result = await readPublishedSnapshotFromFirestore();
  if (result.status === "success") return result.snapshot;
  throw new AppError(
    "Published snapshot is unavailable",
    result.status === "missing"
      ? "PUBLISHED_SNAPSHOT_MISSING"
      : "PUBLISHED_SNAPSHOT_UNAVAILABLE",
  );
};

/** Reads and validates the published document inside an existing transaction. */
export const readPublishedSnapshotInTransaction = async (
  transaction: Transaction,
  db: Firestore,
): Promise<PublishedSnapshotReadResult> => {
  const document = await transaction.get(getPublishedSnapshotDocument(db));
  if (!document.exists) return { status: "missing" };
  const parsed = parseStoredSnapshot(document.data());
  return parsed ? { status: "success", ...parsed } : { status: "invalid" };
};

/** Converts a validated envelope into an undefined-free Firestore value. */
const createStoredDocumentValue = (
  snapshot: PublicDataSnapshot,
  pendingChanges: PublicSnapshotChanges,
): { value: Record<string, unknown>; sizeBytes: number } => {
  const serialized = serializeStoredPublicSnapshot(snapshot, pendingChanges);
  const sizeBytes = Buffer.byteLength(serialized, "utf8");
  if (sizeBytes > PUBLIC_SNAPSHOT_MAX_BYTES) {
    throw new AppError(
      "Published snapshot exceeds the safe byte limit",
      "SNAPSHOT_TOO_LARGE",
    );
  }
  if (!parsePublicDataSnapshot(serialized)) {
    throw new AppError(
      "Published snapshot validation failed",
      "VALIDATION_ERROR",
    );
  }

  const value = JSON.parse(serialized) as unknown;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError(
      "Published snapshot serialization failed",
      "VALIDATION_ERROR",
    );
  }
  return { value: value as Record<string, unknown>, sizeBytes };
};

/** Applies visibility-only changes while retaining last-published content. */
export const applyPublishedVisibilityPatch = (
  snapshot: PublicDataSnapshot,
  patch: PublishedVisibilityPatch,
): { snapshot: PublicDataSnapshot; publicationRequired: boolean } => {
  const deletedPests = new Set(patch.deletedPestSlugs ?? []);
  const deletedRegions = new Set(patch.deletedRegionSlugs ?? []);
  const deletedCombinations = new Set(patch.deletedCombinationIds ?? []);
  let publicationRequired = false;

  const pestStatuses = patch.pestStatuses ?? {};
  const foundPests = new Set<string>();
  const pests = snapshot.data.globalData.pests
    .filter((pest) => !deletedPests.has(pest.slug))
    .map((pest) => {
      if (!Object.prototype.hasOwnProperty.call(pestStatuses, pest.slug)) {
        return pest;
      }
      foundPests.add(pest.slug);
      return { ...pest, isActive: pestStatuses[pest.slug] };
    });
  Object.keys(pestStatuses).forEach((slug) => {
    if (pestStatuses[slug] && !foundPests.has(slug)) {
      publicationRequired = true;
    }
  });

  const regionStatuses = patch.regionStatuses ?? {};
  const foundRegions = new Set<string>();
  const regions = snapshot.data.globalData.regions
    .filter((region) => !deletedRegions.has(region.slug))
    .map((region) => {
      if (!Object.prototype.hasOwnProperty.call(regionStatuses, region.slug)) {
        return region;
      }
      foundRegions.add(region.slug);
      return { ...region, isActive: regionStatuses[region.slug] };
    });
  Object.keys(regionStatuses).forEach((slug) => {
    if (regionStatuses[slug] && !foundRegions.has(slug)) {
      publicationRequired = true;
    }
  });

  const combinationStatuses = patch.combinationStatuses ?? {};
  const foundCombinations = new Set<string>();
  const combinationsById: Record<string, PublicDataSnapshot["data"]["combinationsById"][string]> = {};
  Object.keys(snapshot.data.combinationsById)
    .sort()
    .forEach((id) => {
      const combination = snapshot.data.combinationsById[id];
      if (
        deletedCombinations.has(id) ||
        deletedPests.has(combination.pest) ||
        deletedRegions.has(combination.region)
      ) {
        return;
      }
      const status = combinationStatuses[id];
      if (!status) {
        combinationsById[id] = combination;
        return;
      }
      foundCombinations.add(id);
      combinationsById[id] = { ...combination, ...status };
    });
  Object.keys(combinationStatuses).forEach((id) => {
    if (combinationStatuses[id].isActive && !foundCombinations.has(id)) {
      publicationRequired = true;
    }
  });

  if (Object.values(pestStatuses).includes(false)) {
    Object.keys(combinationsById).forEach((id) => {
      const combination = combinationsById[id];
      if (pestStatuses[combination.pest] === false) {
        combinationsById[id] = { ...combination, isActive: false };
      }
    });
  }
  if (Object.values(regionStatuses).includes(false)) {
    Object.keys(combinationsById).forEach((id) => {
      const combination = combinationsById[id];
      if (regionStatuses[combination.region] === false) {
        combinationsById[id] = { ...combination, isActive: false };
      }
    });
  }

  return {
    publicationRequired,
    snapshot: {
      ...snapshot,
      data: {
        ...snapshot.data,
        globalData: {
          ...snapshot.data.globalData,
          pests,
          regions,
        },
        combinationsById,
      },
    },
  };
};

/** Stages one visibility patch in the caller's canonical Firestore transaction. */
export const stagePublishedVisibilityPatch = (
  transaction: Transaction,
  db: Firestore,
  current: PublishedSnapshotReadResult,
  patch: PublishedVisibilityPatch,
): PublishedVisibilityPatchResult => {
  if (current.status === "missing") {
    return {
      changes: createEmptyPublicSnapshotChanges(),
      publicationRequired: true,
    };
  }
  if (current.status !== "success") {
    throw new AppError(
      "Published snapshot is not safely patchable",
      "PUBLISHED_SNAPSHOT_INVALID",
    );
  }

  const patched = applyPublishedVisibilityPatch(current.snapshot, patch);
  const inferredChanges = getPublicSnapshotChanges(
    current.snapshot,
    patched.snapshot,
  );
  if (!hasPublicSnapshotChanges(inferredChanges)) {
    return {
      snapshot: current.snapshot,
      changes: current.pendingChanges,
      publicationRequired: patched.publicationRequired,
    };
  }

  const changes = mergePublicSnapshotChanges(
    current.pendingChanges,
    inferredChanges,
  );
  const nextSnapshot: PublicDataSnapshot = {
    ...patched.snapshot,
    revision: current.snapshot.revision + 1,
    updatedAt: Date.now(),
  };
  const stored = createStoredDocumentValue(nextSnapshot, changes);
  transaction.set(getPublishedSnapshotDocument(db), stored.value);
  return {
    snapshot: nextSnapshot,
    changes,
    sizeBytes: stored.sizeBytes,
    publicationRequired: patched.publicationRequired,
  };
};

/** Atomically commits a full canonical candidate with stale-revision defense. */
export const commitCanonicalPublishedCandidate = async (
  db: Firestore,
  expected: PublishedSnapshotReadResult,
  candidate: PublicDataSnapshot,
  requestedChanges: PublicSnapshotChanges,
): Promise<PublishedSnapshotCommitResult> => {
  try {
    return await db.runTransaction<PublishedSnapshotCommitResult>(
      async (transaction) => {
        const current = await readPublishedSnapshotInTransaction(
          transaction,
          db,
        );
        if (current.status === "invalid" || current.status === "failed") {
          return {
            status: "failed",
            changes: createEmptyPublicSnapshotChanges(),
            failureReason: "invalid",
          };
        }
        const expectedMatches =
          (expected.status === "missing" && current.status === "missing") ||
          (expected.status === "success" &&
            current.status === "success" &&
            expected.snapshot.revision === current.snapshot.revision);
        if (!expectedMatches) {
          return {
            status: "stale",
            changes: createEmptyPublicSnapshotChanges(),
            failureReason: "stale",
          };
        }

        const existingSnapshot =
          current.status === "success" ? current.snapshot : null;
        const dataChanged =
          !existingSnapshot ||
          JSON.stringify(existingSnapshot.data) !==
            JSON.stringify(candidate.data);
        const inferredChanges = existingSnapshot
          ? getPublicSnapshotChanges(existingSnapshot, candidate)
          : mergePublicSnapshotChanges({
              ...createEmptyPublicSnapshotChanges(),
              fullActivation: true,
              settingsChanged: true,
              pestsChanged: true,
              regionsChanged: true,
              heroSlidesChanged: true,
              reviewsChanged: true,
              combinationsChanged: true,
              addedCombinationIds: Object.keys(
                candidate.data.combinationsById,
              ).sort(),
            });
        const pendingChanges =
          current.status === "success"
            ? current.pendingChanges
            : createEmptyPublicSnapshotChanges();
        const changes = mergePublicSnapshotChanges(
          pendingChanges,
          inferredChanges,
          requestedChanges,
        );
        const nextSnapshot: PublicDataSnapshot = dataChanged
          ? {
              ...candidate,
              revision: (existingSnapshot?.revision ?? 0) + 1,
              updatedAt: Date.now(),
            }
          : existingSnapshot;
        const pendingChanged =
          JSON.stringify(pendingChanges) !== JSON.stringify(changes);
        if (!dataChanged && !pendingChanged) {
          return {
            status: "not-needed",
            snapshot: nextSnapshot,
            changes,
          };
        }

        const stored = createStoredDocumentValue(nextSnapshot, changes);
        transaction.set(getPublishedSnapshotDocument(db), stored.value);
        return {
          status: existingSnapshot
            ? dataChanged
              ? "updated"
              : "not-needed"
            : "initialized",
          snapshot: nextSnapshot,
          changes,
          sizeBytes: stored.sizeBytes,
        };
      },
    );
  } catch (error: unknown) {
    return {
      status: "failed",
      changes: createEmptyPublicSnapshotChanges(),
      failureReason:
        error instanceof AppError && error.code === "SNAPSHOT_TOO_LARGE"
          ? "too-large"
          : "write",
    };
  }
};

/** Builds and commits one complete editable-canonical publication candidate. */
export const publishCanonicalSnapshotToFirestore = async (
  db: Firestore,
  requestedChanges: PublicSnapshotChanges =
    createEmptyPublicSnapshotChanges(),
): Promise<PublishedSnapshotCommitResult> => {
  const expected = await readPublishedSnapshotFromFirestore(db);
  if (expected.status === "failed" || expected.status === "invalid") {
    return {
      status: "failed",
      changes: createEmptyPublicSnapshotChanges(),
      failureReason: "read",
    };
  }

  let candidate: PublicDataSnapshot;
  try {
    candidate = await createCanonicalPublishedSnapshotCandidate(db);
  } catch {
    return {
      status: "failed",
      changes: createEmptyPublicSnapshotChanges(),
      failureReason: "canonical-build",
    };
  }
  return commitCanonicalPublishedCandidate(
    db,
    expected,
    candidate,
    requestedChanges,
  );
};

/** Removes pending cache metadata only when the published revision is current. */
export const acknowledgeFirestorePublishedActivation = async (
  db: Firestore,
  revision: number,
): Promise<boolean> => {
  try {
    return await db.runTransaction<boolean>(async (transaction) => {
      const current = await readPublishedSnapshotInTransaction(
        transaction,
        db,
      );
      if (
        current.status !== "success" ||
        current.snapshot.revision !== revision
      ) {
        return false;
      }
      transaction.update(getPublishedSnapshotDocument(db), {
        activation: FieldValue.delete(),
      });
      return true;
    });
  } catch {
    console.error("Failed to acknowledge Firestore public activation");
    return false;
  }
};
