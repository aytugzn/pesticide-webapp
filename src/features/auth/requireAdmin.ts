import "server-only";

import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase-admin";
import { SESSION_COOKIE_NAME } from "@/constants/routes";

export const requireAdmin = async (): Promise<boolean> => {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!session) {
    return false;
  }

  try {
    const decodedClaims = await getAdminAuth().verifySessionCookie(session, true);
    
    const allowedEmail = process.env.ADMIN_EMAIL || "";
    if (decodedClaims.email !== allowedEmail) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Admin verification failed in requireAdmin helper", error);
    return false;
  }
};
