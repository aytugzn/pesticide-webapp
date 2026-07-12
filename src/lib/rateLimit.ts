import "server-only";

import { createHmac } from "crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { AppError } from "./exceptions";

const CONTACT_RATE_LIMIT = {
  requests: 3,
  window: "10 m",
} as const;

const LOGIN_RATE_LIMIT = {
  requests: 10,
  window: "10 m",
} as const;

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
let loginSessionRatelimit: Ratelimit | null | undefined = undefined;
let hasWarnedAboutInvalidUpstashConfig = false;
let hasWarnedAboutInvalidLoginUpstashConfig = false;
let hasWarnedAboutMissingRateLimitSecret = false;

const getContactRatelimit = () => {
  if (contactRatelimit !== undefined) return contactRatelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (isValidUpstashUrl(url) && isValidUpstashToken(token)) {
    try {
      contactRatelimit = new Ratelimit({
        redis: new Redis({ url: url!.trim(), token: token!.trim() }),
        limiter: Ratelimit.slidingWindow(CONTACT_RATE_LIMIT.requests, CONTACT_RATE_LIMIT.window),
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

const getLoginSessionRatelimit = () => {
  if (loginSessionRatelimit !== undefined) return loginSessionRatelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (isValidUpstashUrl(url) && isValidUpstashToken(token)) {
    try {
      loginSessionRatelimit = new Ratelimit({
        redis: new Redis({ url: url!.trim(), token: token!.trim() }),
        limiter: Ratelimit.slidingWindow(LOGIN_RATE_LIMIT.requests, LOGIN_RATE_LIMIT.window),
        analytics: true,
      });
    } catch {
      loginSessionRatelimit = null;
    }
  } else {
    loginSessionRatelimit = null;
  }

  return loginSessionRatelimit;
};

/**
 * Creates an HMAC-SHA256 hash for rate limit identifiers without storing raw personal data.
 */
export const createRateLimitHash = (value: string): string | null => {
  const secret = process.env.RATE_LIMIT_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new AppError("Missing RATE_LIMIT_SECRET", "CONFIG_ERROR");
    }
    if (!hasWarnedAboutMissingRateLimitSecret) {
      console.warn("RATE_LIMIT_SECRET missing in development. Hash generation disabled.");
      hasWarnedAboutMissingRateLimitSecret = true;
    }
    return null;
  }

  return createHmac("sha256", secret).update(value).digest("hex");
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

/**
 * Helper to limit admin session creation attempts based on a hashed IP identifier.
 * - Development'ta missing/invalid Upstash config rate limit'i bypass eder.
 * - Production'da missing/invalid Upstash config fail-closed davranır.
 */
export const limitLoginSessionCreation = async (
  identifier: string
): Promise<boolean> => {
  const ratelimit = getLoginSessionRatelimit();

  if (!ratelimit) {
    if (process.env.NODE_ENV === "production") {
      throw new AppError("Missing Upstash configuration", "CONFIG_ERROR");
    }
    if (!hasWarnedAboutInvalidLoginUpstashConfig) {
      console.warn("UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN missing or invalid in development. Bypassing rate limit.");
      hasWarnedAboutInvalidLoginUpstashConfig = true;
    }
    return true;
  }

  try {
    const { success } = await ratelimit.limit(identifier);
    return success;
  } catch {
    if (process.env.NODE_ENV === "production") {
      throw new AppError("Redis failure during rate limit check", "INTERNAL_ERROR");
    }
    console.warn("Redis failure in development. Bypassing rate limit.");
    return true;
  }
};
