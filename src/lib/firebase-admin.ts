import "server-only";

import { createRequire } from "module";
import type { App } from "firebase-admin/app";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { AppError } from "./exceptions";
import { DICTIONARY } from "@/constants/dictionary";

const nodeRequire = createRequire(import.meta.url);

const getAdminAppModule = () =>
  nodeRequire("firebase-admin/app") as typeof import("firebase-admin/app");

const getAdminFirestoreModule = () =>
  nodeRequire("firebase-admin/firestore") as typeof import("firebase-admin/firestore");

const getAdminAuthModule = () =>
  nodeRequire("firebase-admin/auth") as typeof import("firebase-admin/auth");

const getAdminApp = (): App => {
  const { cert, getApps, getApp, initializeApp } = getAdminAppModule();

  if (getApps().length > 0) return getApp();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new AppError(DICTIONARY.systemErrors.env.firebaseAdmin, "ENV_MISSING");
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    }),
  });
};

export const getAdminDb = (): Firestore => {
  const { getFirestore } = getAdminFirestoreModule();
  return getFirestore(getAdminApp());
};

export const getAdminAuth = (): Auth => {
  const { getAuth } = getAdminAuthModule();
  return getAuth(getAdminApp());
};
