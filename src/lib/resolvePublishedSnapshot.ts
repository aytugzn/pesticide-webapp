import "server-only";

import ciPublicSnapshotFixture from "@/fixtures/ciPublicSnapshot.json";
import { hasFirebaseAdminConfig } from "@/lib/firebase-admin";
import { getPublishedSnapshotFromFirestoreOrThrow } from "@/lib/firestorePublishedSnapshot";
import {
  getPublicSnapshotResolution,
  parsePublicDataSnapshot,
  type PublicDataSnapshot,
} from "@/lib/publicSnapshot";
import { AppError } from "@/lib/exceptions";

/**
 * Enables build-only synthetic data; it does not validate Firebase or Redis.
 * Both guards keep Vercel builds and GitHub combination workers on real data.
 */
const getCiPublicSnapshot = (): PublicDataSnapshot | null => {
  if (
    process.env.GITHUB_ACTIONS !== "true" ||
    process.env.DMR_USE_SYNTHETIC_BUILD_FIXTURE !== "true"
  ) {
    return null;
  }

  const snapshot = parsePublicDataSnapshot(ciPublicSnapshotFixture);
  if (!snapshot) {
    throw new AppError(
      "CI public snapshot fixture is invalid",
      "CI_SNAPSHOT_INVALID",
    );
  }
  return snapshot;
};

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
  const ciSnapshot = getCiPublicSnapshot();
  if (ciSnapshot) return ciSnapshot;

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
