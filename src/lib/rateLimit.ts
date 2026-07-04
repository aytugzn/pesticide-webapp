import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { AppError } from "./exceptions";

// Check if Upstash Redis env vars are present
const isUpstashConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

// Create a new ratelimiter that allows 3 requests per 10 minutes
const ratelimit = isUpstashConfigured
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(3, "10 m"),
      analytics: true,
    })
  : null;

/**
 * Helper to limit contact form submissions based on identifier
 * Falls back safely to true if Upstash is not configured.
 */
export const limitContactSubmission = async (
  identifier: string
): Promise<boolean> => {
  if (!ratelimit) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "CRITICAL ERROR: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing. Contact form rate limiting is disabled. Failing closed."
      );
      throw new AppError("Missing Upstash configuration", "CONFIG_ERROR");
    }
    console.warn("UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN missing in development. Bypassing rate limit.");
    return true; // Fallback: allow submission if not configured in dev
  }

  try {
    const { success } = await ratelimit.limit(identifier);
    return success;
  } catch (error: unknown) {
    console.error("Rate limit check failed", {
      message: error instanceof Error ? error.message : "Unknown rate limit error",
    });
    if (process.env.NODE_ENV === "production") {
      throw new AppError("Redis failure during rate limit check", "INTERNAL_ERROR");
    }
    console.warn("Redis failure in development. Bypassing rate limit.");
    return true; // Fallback: allow submission on Redis failure in dev
  }
};
