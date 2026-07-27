export const COMBINATION_JOB_DOC_PATH =
  "adminJobs/bulkCombinationGeneration";
export const COMBINATION_JOB_STALE_TIMEOUT_MS = 20 * 60 * 1000;
export const COMBINATION_JOB_MAX_ATTEMPTS = 3;
export const COMBINATION_JOB_RETRY_DELAYS_MS = [15_000, 45_000] as const;
export const COMBINATION_JOB_BOOKKEEPING_RETRY_DELAYS_MS = [250, 750] as const;

/** Determines whether a running worker heartbeat exceeded the recovery window. */
export const isCombinationJobHeartbeatStale = (
  heartbeatAt: number | undefined,
  now: number,
): boolean => !heartbeatAt || now - heartbeatAt > COMBINATION_JOB_STALE_TIMEOUT_MS;
