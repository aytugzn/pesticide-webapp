import "server-only";

import {
  getAdminApp as getCoreAdminApp,
  getAdminDb as getCoreAdminDb,
  hasFirebaseAdminConfig,
} from "./firebaseAdminCore";
import { assertFirebaseProjectConsistency } from "@/lib/environmentConsistency";

/** Initializes or reuses the web Firebase Admin app after identity validation. */
export const getAdminApp = () => {
  assertFirebaseProjectConsistency();
  return getCoreAdminApp();
};

/** Returns the web Firestore client after client/server project validation. */
export const getAdminDb = () => {
  assertFirebaseProjectConsistency();
  return getCoreAdminDb();
};

export { hasFirebaseAdminConfig };
