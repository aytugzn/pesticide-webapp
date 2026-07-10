import "server-only";

import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase-admin-auth";
import { SESSION_COOKIE_NAME } from "@/constants/routes";

export const requireAdmin = async (): Promise<boolean> => {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!session) {
    return false;
  }

  try {
    const adminAuth = await getAdminAuth();
    const decodedClaims = await adminAuth.verifySessionCookie(session, true);
    
    const allowedEmail = process.env.ADMIN_EMAIL || "";
    if (decodedClaims.email !== allowedEmail) {
      return false;
    }

    return true;
  } catch (error: unknown) {
    console.error("Admin verification failed in requireAdmin helper", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
};
