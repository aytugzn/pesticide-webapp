"use server";

import { adminAuth } from "@/lib/firebase-admin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_ERRORS, type AuthErrorCode } from "./types";
import type { ActionResponse } from "@/types";
import { DICTIONARY } from "@/constants/dictionary";
import { ROUTES, SESSION_COOKIE_NAME } from "@/constants/routes";

const ALLOWED_EMAILS = [process.env.ADMIN_EMAIL || ""];
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 gün

export const createSession = async (idToken: string): Promise<ActionResponse<void, AuthErrorCode>> => {
  const expiresIn = SESSION_DURATION * 1000;

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    if (!ALLOWED_EMAILS.includes(decodedToken.email ?? "")) {
      return { success: false, error: AUTH_ERRORS.UNAUTHORIZED_EMAIL };
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION,
      path: "/",
    });

    return { success: true };
  } catch (error) {
    console.error(DICTIONARY.systemErrors.logs.sessionCreation, error);
    return { success: false, error: AUTH_ERRORS.SESSION_CREATION_FAILED };
  }
};

export const revokeSession = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect(ROUTES.login);
};