import "server-only";

import {
  Timestamp,
  type DocumentReference,
  type DocumentSnapshot,
  type Firestore,
} from "firebase-admin/firestore";

export type FirestoreDocumentVersion = Readonly<{
  seconds: number;
  nanoseconds: number;
}>;

export type DraftFinalizationStatus =
  | "deleted"
  | "already-missing"
  | "newer-draft-preserved"
  | "failed";

export type PreparedDraftVersionStatus =
  | "current"
  | "draft-missing"
  | "stale-draft-skipped"
  | "failed";

/** Returns the primitive server-side update version for an existing document. */
export const getFirestoreDocumentVersion = (
  snapshot: Pick<DocumentSnapshot, "exists" | "updateTime">,
): FirestoreDocumentVersion | null => {
  if (!snapshot.exists || !snapshot.updateTime) return null;

  return {
    seconds: snapshot.updateTime.seconds,
    nanoseconds: snapshot.updateTime.nanoseconds,
  };
};

/** Compares Firestore update versions without exposing SDK objects to clients. */
export const areFirestoreDocumentVersionsEqual = (
  left: FirestoreDocumentVersion,
  right: FirestoreDocumentVersion,
): boolean =>
  left.seconds === right.seconds &&
  left.nanoseconds === right.nanoseconds;

/** Resolves whether a transaction read still represents the prepared draft. */
export const getPreparedDraftVersionStatus = (
  snapshot: Pick<DocumentSnapshot, "exists" | "updateTime">,
  expectedVersion: FirestoreDocumentVersion | null,
): PreparedDraftVersionStatus => {
  if (!snapshot.exists) return "draft-missing";
  if (!expectedVersion) return "failed";

  const currentVersion = getFirestoreDocumentVersion(snapshot);
  if (!currentVersion) return "failed";
  return areFirestoreDocumentVersionsEqual(currentVersion, expectedVersion)
    ? "current"
    : "stale-draft-skipped";
};

/**
 * Deletes only the exact draft version prepared for publication.
 * A concurrent save is preserved and remains pending for the next publish.
 */
export const finalizePreparedDraft = async (
  db: Firestore,
  draftRef: DocumentReference,
  expectedVersion: FirestoreDocumentVersion | null,
): Promise<DraftFinalizationStatus> => {
  if (!expectedVersion) {
    console.error("Failed to finalize prepared draft");
    return "failed";
  }

  try {
    return await db.runTransaction<DraftFinalizationStatus>(
      async (transaction) => {
        const currentDraft = await transaction.get(draftRef);
        if (!currentDraft.exists) return "already-missing";

        const versionStatus = getPreparedDraftVersionStatus(
          currentDraft,
          expectedVersion,
        );
        if (versionStatus === "failed") {
          console.error("Failed to read prepared draft version");
          return "failed";
        }
        if (versionStatus === "stale-draft-skipped") {
          return "newer-draft-preserved";
        }
        if (versionStatus === "draft-missing") return "already-missing";

        transaction.delete(draftRef, {
          lastUpdateTime: new Timestamp(
            expectedVersion.seconds,
            expectedVersion.nanoseconds,
          ),
        });
        return "deleted";
      },
    );
  } catch {
    console.error("Failed to finalize prepared draft");
    return "failed";
  }
};
