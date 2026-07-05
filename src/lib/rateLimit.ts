import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { AppError } from "./exceptions";

const isValidUpstashUrl = (val: string | undefined): boolean => {
  if (!val) return false;
  const trimmed = val.trim();
  return trimmed !== "" && trimmed !== "..." && trimmed.startsWith("https://");
};

const isValidUpstashToken = (val: string | undefined): boolean => {
  if (!val) return false;
  const trimmed = val.trim();
  return trimmed !== "" && trimmed !== "...";
};

let contactRatelimit: Ratelimit | null | undefined = undefined;
let hasWarnedAboutInvalidUpstashConfig = false;

const getContactRatelimit = () => {
  if (contactRatelimit !== undefined) return contactRatelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (isValidUpstashUrl(url) && isValidUpstashToken(token)) {
    try {
      contactRatelimit = new Ratelimit({
        redis: new Redis({ url: url!.trim(), token: token!.trim() }),
        limiter: Ratelimit.slidingWindow(3, "10 m"),
        analytics: true,
      });
    } catch {
      contactRatelimit = null;
    }
  } else {
    contactRatelimit = null;
  }

  return contactRatelimit;
};

/**
 * Helper to limit contact form submissions based on identifier.
 * - Development'ta missing/invalid Upstash config rate limit'i bypass eder.
 * - Production'da missing/invalid Upstash config fail-closed davranır.
 */
export const limitContactSubmission = async (
  identifier: string
): Promise<boolean> => {
  const ratelimit = getContactRatelimit();

  if (!ratelimit) {
    if (process.env.NODE_ENV === "production") {
      throw new AppError("Missing Upstash configuration", "CONFIG_ERROR");
    }
    if (!hasWarnedAboutInvalidUpstashConfig) {
      console.warn("UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN missing or invalid in development. Bypassing rate limit.");
      hasWarnedAboutInvalidUpstashConfig = true;
    }
    return true; // Fallback: allow submission if not configured in dev
  }

  try {
    const { success } = await ratelimit.limit(identifier);
    return success;
  } catch {
    if (process.env.NODE_ENV === "production") {
      throw new AppError("Redis failure during rate limit check", "INTERNAL_ERROR");
    }
    console.warn("Redis failure in development. Bypassing rate limit.");
    return true; // Fallback: allow submission on Redis failure in dev
  }
};
