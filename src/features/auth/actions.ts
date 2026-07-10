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

export const createSession = async (idToken: string): Promise<ActionResponse<void, AuthErrorCode>> => {
  const expiresIn = SESSION_DURATION * 1000;

  try {
    const adminAuth = await getAdminAuth();
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
  } catch (error: unknown) {
    console.error("Failed to create session", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return { success: false, error: AUTH_ERRORS.SESSION_CREATION_FAILED };
  }
};

export const revokeSession = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect(ROUTES.login);
};
