"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { GoogleStatsPromise } from "@/features/home/types";

const EMPTY_GOOGLE_STATS_PROMISE: GoogleStatsPromise = Promise.resolve(
  { status: "empty", data: null },
);

const GoogleStatsContext = createContext<GoogleStatsPromise>(
  EMPTY_GOOGLE_STATS_PROMISE,
);

/**
 * Shares the server-created Google stats promise for one mounted public layout.
 * The provider never starts client-side fetching or persists provider data.
 *
 * @param props - Stable server promise and public-layout children
 * @returns A context provider that survives public soft navigation
 */
export const GoogleStatsProvider = ({
  statsPromise,
  children,
}: {
  statsPromise: GoogleStatsPromise;
  children: ReactNode;
}) => (
  <GoogleStatsContext.Provider value={statsPromise}>
    {children}
  </GoogleStatsContext.Provider>
);

/**
 * Reads the stable server promise supplied by the public layout.
 *
 * @returns The shared Google stats promise for React 19 use()
 */
export const useGoogleStatsPromise = (): GoogleStatsPromise =>
  useContext(GoogleStatsContext);
