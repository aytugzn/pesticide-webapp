import "server-only";

import { hasFirebaseAdminConfig } from "@/lib/firebase-admin";
import { getPublishedSnapshotFromFirestoreOrThrow } from "@/lib/firestorePublishedSnapshot";
import {
  getPublicSnapshotResolution,
  type PublicDataSnapshot,
} from "@/lib/publicSnapshot";
import { AppError } from "@/lib/exceptions";

/**
 * Resolves the authoritative published snapshot through the strict
 * Firestore → Redis last-known-good provider chain.
 *
 * The long-lived Next.js cache layer (`"use cache"` + `cacheLife("max")` +
 * `cacheTag`) is applied by callers that wrap their projections with the
 * cache directive. This resolver itself is a plain async function.
 *
 * Does NOT call `connection()`, so it is safe for both `"use cache"` scopes
 * and `generateStaticParams`.
 *
 * @throws AppError when neither Firestore nor Redis can provide a valid snapshot
 */
export const resolvePublishedSnapshot = async (): Promise<PublicDataSnapshot> => {
  if (hasFirebaseAdminConfig()) {
    try {
      return await getPublishedSnapshotFromFirestoreOrThrow();
    } catch (error: unknown) {
      console.warn(
        "Firestore published snapshot failed, attempting Redis fallback",
        {
          errorCode: error instanceof AppError ? error.code : "UNKNOWN",
        },
      );
    }
  }

  const resolution = await getPublicSnapshotResolution();
  if (resolution.status === "available") {
    return resolution.snapshot;
  }

  throw new AppError(
    "Published snapshot is unavailable from all providers",
    "PUBLISHED_SNAPSHOT_UNAVAILABLE",
  );
};
