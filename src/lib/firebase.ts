// WARNING: This file should only be imported by Client Components.
// Use firebase-admin.ts for Server Components.
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { AppError } from "./exceptions";
import { DICTIONARY } from "@/constants/dictionary";

const getFirebaseApp = () => {
  if (getApps().length > 0) return getApps()[0];

  const required = [
    process.env.NEXT_PUBLIC_FIRESTORE_API_KEY,
    process.env.NEXT_PUBLIC_FIRESTORE_AUTH_DOMAIN,
    process.env.NEXT_PUBLIC_FIRESTORE_PROJECT_ID,
    process.env.NEXT_PUBLIC_FIRESTORE_STORAGE_BUCKET,
    process.env.NEXT_PUBLIC_FIRESTORE_MESSAGING_SENDER_ID,
    process.env.NEXT_PUBLIC_FIRESTORE_APP_ID,
    process.env.NEXT_PUBLIC_FIRESTORE_MEASUREMENT_ID,
  ];

  if (required.some((v) => !v)) {
    throw new AppError(DICTIONARY.systemErrors.env.firebaseClient, "ENV_MISSING");
  }

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIRESTORE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIRESTORE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIRESTORE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIRESTORE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIRESTORE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIRESTORE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIRESTORE_MEASUREMENT_ID,
  };

  return initializeApp(firebaseConfig);
};

export const getDb = () => getFirestore(getFirebaseApp());
export const getFirebaseAuth = () => getAuth(getFirebaseApp());