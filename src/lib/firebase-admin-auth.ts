import "server-only";

import type { Auth } from "firebase-admin/auth";
import { getAdminApp } from "@/lib/firebase-admin";

const getAdminAuthModule = async () => import("firebase-admin/auth");

export const getAdminAuth = async (): Promise<Auth> => {
  const { getAuth } = await getAdminAuthModule();
  return getAuth(getAdminApp());
};
