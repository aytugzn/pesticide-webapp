/**
 * A basic in-memory rate limiter.
 * Exists only in the memory of the current Vercel Instance.
 * Ideal for preventing amateur malicious scripts and rapid clicks.
 * 
 * @param ip - The IP address of the requesting user
 * @param limit - The maximum number of requests allowed per window
 * @param windowMs - The rate limit window in milliseconds
 * @returns `true` if the request is allowed, `false` if blocked
 */

const globalForRateLimit = globalThis as unknown as {
  rateLimitMap: Map<string, { count: number; lastReset: number }>;
};

const rateLimitMap = globalForRateLimit.rateLimitMap || new Map<string, { count: number; lastReset: number }>();
if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.rateLimitMap = rateLimitMap;
}

export const rateLimit = (ip: string, limit: number, windowMs: number): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // If first time request
  if (!record) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }

  // Reset if window has passed
  if (now - record.lastReset > windowMs) {
    record.count = 1;
    record.lastReset = now;
    rateLimitMap.set(ip, record);
    return true;
  }

  // Block if limit exceeded
  if (record.count >= limit) {
    return false;
  }

  // Increment counter if within limit
  record.count += 1;
  rateLimitMap.set(ip, record);
  return true;
};
