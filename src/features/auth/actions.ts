"use server"

import "server-only";

import { getAdminAuth } from "@/lib/firebase-admin-auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_ERRORS, type AuthErrorCode } from "./types";
import type { ActionResponse } from "@/types";
import { ROUTES, SESSION_COOKIE_NAME } from "@/constants/routes";

const ALLOWED_EMAILS = [process.env.ADMIN_EMAIL || ""];
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days
const AUTH_SESSION_STAGES = {
  getAdminAuth: "getAdminAuth",
  verifyIdToken: "verifyIdToken",
  emailWhitelist: "emailWhitelist",
  createSessionCookie: "createSessionCookie",
  setCookie: "setCookie",
} as const;

type AuthSessionStage =
  (typeof AUTH_SESSION_STAGES)[keyof typeof AUTH_SESSION_STAGES];

const getSafeAuthDebugContext = () => {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  return {
    envExists: {
      FIREBASE_PROJECT_ID: Boolean(process.env.FIREBASE_PROJECT_ID),
      FIREBASE_CLIENT_EMAIL: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
      FIREBASE_PRIVATE_KEY: Boolean(privateKey),
      ADMIN_EMAIL: Boolean(process.env.ADMIN_EMAIL),
    },
    projectMatch:
      process.env.NEXT_PUBLIC_FIRESTORE_PROJECT_ID ===
      process.env.FIREBASE_PROJECT_ID,
    privateKeyShape: {
      hasBeginMarker: Boolean(privateKey?.includes("BEGIN PRIVATE KEY")),
      hasEndMarker: Boolean(privateKey?.includes("END PRIVATE KEY")),
      containsEscapedNewline: Boolean(privateKey?.includes("\\n")),
      containsRealNewline: Boolean(privateKey?.includes("\n")),
    },
  };
};

const getErrorCode = (error: unknown): string | undefined => {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return undefined;
};

export const createSession = async (idToken: string): Promise<ActionResponse<void, AuthErrorCode>> => {
  const expiresIn = SESSION_DURATION * 1000;
  let stage: AuthSessionStage = AUTH_SESSION_STAGES.getAdminAuth;

  try {
    stage = AUTH_SESSION_STAGES.getAdminAuth;
    const adminAuth = await getAdminAuth();

    stage = AUTH_SESSION_STAGES.verifyIdToken;
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    stage = AUTH_SESSION_STAGES.emailWhitelist;
    if (!ALLOWED_EMAILS.includes(decodedToken.email ?? "")) {
      return { success: false, error: AUTH_ERRORS.UNAUTHORIZED_EMAIL };
    }

    stage = AUTH_SESSION_STAGES.createSessionCookie;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    stage = AUTH_SESSION_STAGES.setCookie;
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION,
      path: "/",
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to create admin session", {
      message: "Failed to create admin session",
      stage,
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorCode: getErrorCode(error),
      ...getSafeAuthDebugContext(),
    });
    return { success: false, error: AUTH_ERRORS.SESSION_CREATION_FAILED };
  }
};

export const revokeSession = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect(ROUTES.login);
};
