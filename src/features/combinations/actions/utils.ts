export const getErrorInfo = (
  error: unknown,
): { code?: string; message?: string } => {
  if (typeof error === "object" && error !== null) {
    const candidate = error as { code?: unknown; message?: unknown };

    return {
      code: typeof candidate.code === "string"
        ? candidate.code
        : typeof candidate.code === "number"
          ? String(candidate.code)
          : undefined,
      message: typeof candidate.message === "string"
        ? candidate.message
        : error instanceof Error
          ? error.message
          : undefined,
    };
  }

  return {};
};

export type AiErrorReason =
  | "quota_or_rate_limit"
  | "provider_unavailable"
  | "provider_timeout"
  | "invalid_api_key"
  | "unknown_ai_error";

export const getAiErrorReason = (
  errorInfo: { code?: string; message?: string },
): AiErrorReason => {
  const code = errorInfo.code?.toLowerCase() || "";
  const message = errorInfo.message?.toLowerCase() || "";

  if (
    code === "provider_timeout" ||
    message.includes("request timed out")
  ) {
    return "provider_timeout";
  }

  if (
    code === "429" ||
    message.includes("429") ||
    message.includes("quota exceeded") ||
    message.includes("too many requests") ||
    message.includes("generate_content_free_tier_requests") ||
    message.includes("rate limit") ||
    message.includes("limit:")
  ) {
    return "quota_or_rate_limit";
  }

  if (
    code === "503" ||
    message.includes("503") ||
    message.includes("service unavailable") ||
    message.includes("high demand") ||
    message.includes("temporarily unavailable") ||
    message.includes("overloaded")
  ) {
    return "provider_unavailable";
  }

  if (
    message.includes("invalid api key") ||
    message.includes("unauthorized") ||
    message.includes("api_key_invalid") ||
    message.includes("key invalid")
  ) {
    return "invalid_api_key";
  }

  return "unknown_ai_error";
};
