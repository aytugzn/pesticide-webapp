import { AppError } from "@/lib/exceptions";

export type ProviderName =
  | "cloudinary"
  | "firebase-auth"
  | "gemini"
  | "google-places"
  | "telegram";

/** Returns a safe timeout error containing only the provider identifier. */
export const createProviderTimeoutError = (
  provider: ProviderName,
): AppError =>
  new AppError(`${provider} request timed out`, "PROVIDER_TIMEOUT", {
    provider,
  });

/** Detects native AbortSignal timeouts, SDK timeout wrappers, and normalized errors. */
export const isProviderTimeoutError = (error: unknown): boolean => {
  if (error instanceof AppError && error.code === "PROVIDER_TIMEOUT") {
    return true;
  }

  if (!error || typeof error !== "object") return false;

  const candidate = error as {
    cause?: unknown;
    code?: unknown;
    message?: unknown;
    name?: unknown;
  };
  const name =
    typeof candidate.name === "string" ? candidate.name.toLowerCase() : "";
  const code =
    typeof candidate.code === "string" ? candidate.code.toLowerCase() : "";
  const message =
    typeof candidate.message === "string"
      ? candidate.message.toLowerCase()
      : "";

  return (
    name === "aborterror" ||
    name === "timeouterror" ||
    code === "provider_timeout" ||
    code === "etimedout" ||
    message.includes("request timed out") ||
    message.includes("request timeout") ||
    isProviderTimeoutError(candidate.cause)
  );
};

/**
 * Runs fetch with an application-level timeout and normalizes timeout failures.
 */
export const fetchWithTimeout = async (
  input: string | URL | Request,
  init: RequestInit,
  timeoutMs: number,
  provider: ProviderName,
): Promise<Response> => {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = init.signal
    ? AbortSignal.any([init.signal, timeoutSignal])
    : timeoutSignal;

  try {
    return await fetch(input, { ...init, signal });
  } catch (error: unknown) {
    if (isProviderTimeoutError(error)) {
      throw createProviderTimeoutError(provider);
    }
    throw error;
  }
};

/**
 * Bounds SDK operations that do not expose an AbortSignal.
 * The provider promise remains observed after timeout, preventing unhandled rejection.
 */
export const withProviderTimeout = async <T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  provider: ProviderName,
): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(createProviderTimeoutError(provider)),
      timeoutMs,
    );
  });

  try {
    return await Promise.race([operation(), timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};
